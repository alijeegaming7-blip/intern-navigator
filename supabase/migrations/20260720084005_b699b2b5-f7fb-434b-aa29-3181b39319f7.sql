
-- 1) Admin invites
CREATE TABLE public.admin_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  role app_role NOT NULL DEFAULT 'admin',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  used_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_invites TO authenticated;
GRANT ALL ON public.admin_invites TO service_role;
ALTER TABLE public.admin_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage invites" ON public.admin_invites FOR ALL
  TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "any auth can read to redeem" ON public.admin_invites FOR SELECT
  TO authenticated USING (used_by IS NULL AND expires_at > now());

-- Redeem function (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.redeem_admin_invite(_code text)
RETURNS TABLE(role app_role) LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _inv record; _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO _inv FROM public.admin_invites WHERE code=_code AND used_by IS NULL AND expires_at>now() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'invalid or expired invite'; END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (_uid, _inv.role) ON CONFLICT (user_id, role) DO NOTHING;
  UPDATE public.admin_invites SET used_by=_uid, used_at=now() WHERE id=_inv.id;
  RETURN QUERY SELECT _inv.role;
END; $$;
REVOKE ALL ON FUNCTION public.redeem_admin_invite(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_admin_invite(text) TO authenticated;

-- Bootstrap: if no admin exists, promote current user
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role='admin') THEN
    RETURN false;
  END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (_uid, 'admin') ON CONFLICT (user_id, role) DO NOTHING;
  RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.bootstrap_first_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bootstrap_first_admin() TO authenticated;

-- 2) Onboarding flag on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- 3) Audit log for roadmap generations
CREATE TABLE public.roadmap_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  triggered_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  model text NOT NULL,
  duration_ms integer,
  inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roadmap_generations TO authenticated;
GRANT ALL ON public.roadmap_generations TO service_role;
ALTER TABLE public.roadmap_generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or mentor or admin can view" ON public.roadmap_generations FOR SELECT TO authenticated
  USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=user_id AND p.mentor_id=auth.uid()));
CREATE POLICY "system inserts via server fn" ON public.roadmap_generations FOR INSERT TO authenticated
  WITH CHECK (triggered_by=auth.uid());

-- 4) Notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  severity text NOT NULL DEFAULT 'info',
  read_at timestamptz,
  dedupe_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, dedupe_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications" ON public.notifications FOR ALL TO authenticated
  USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());
CREATE INDEX idx_notifications_user_created ON public.notifications (user_id, created_at DESC);
