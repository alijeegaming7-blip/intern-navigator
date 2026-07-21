-- Notification preferences and email digest state on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_prefs JSONB NOT NULL DEFAULT jsonb_build_object(
    'roadmap_missing', true,
    'roadmap_stale', true,
    'goal_due', true,
    'goal_overdue', true,
    'review_due_soon', true,
    'review_overdue', true,
    'email_enabled', false,
    'digest_frequency_hours', 1
  ),
  ADD COLUMN IF NOT EXISTS last_email_digest_at TIMESTAMPTZ;

-- Revoke invite: hard-delete an unused invite (admins only via RLS)
-- Handled through existing RLS "admins manage invites"

-- View recent invite usage: extend the existing table -- no schema change needed
-- but we add an index for status filters.
CREATE INDEX IF NOT EXISTS idx_admin_invites_used_at ON public.admin_invites (used_at DESC NULLS LAST);
