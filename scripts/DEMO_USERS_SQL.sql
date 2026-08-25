-- ================================================================
-- EEF DEMO USERS — COMPLETE SETUP SQL
-- Paste and run this ENTIRE script in:
-- Supabase Dashboard → SQL Editor → New query → Run
-- ================================================================
-- Creates 3 demo accounts with full profiles, roles, and skills
-- No external API calls needed — pure SQL
-- ================================================================

-- Enable pgcrypto for password hashing (already enabled in Supabase)
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  intern_id  uuid;
  mentor_id  uuid;
  admin_id   uuid;
  skill_rec  RECORD;
  i          int := 0;
BEGIN

  -- ============================================================
  -- STEP 1: CREATE AUTH USERS
  -- ============================================================

  -- Intern user
  SELECT id INTO intern_id FROM auth.users WHERE email = 'intern@eef.demo';
  IF intern_id IS NULL THEN
    intern_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      is_super_admin
    ) VALUES (
      intern_id,
      '00000000-0000-0000-0000-000000000000',
      'intern@eef.demo',
      crypt('Demo@1234', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Alex Johnson"}'::jsonb,
      now(), now(), 'authenticated', 'authenticated',
      '', '', '', false
    );
    RAISE NOTICE '✅ Created intern@eef.demo (id: %)', intern_id;
  ELSE
    -- Update password in case it changed
    UPDATE auth.users SET encrypted_password = crypt('Demo@1234', gen_salt('bf'))
    WHERE id = intern_id;
    RAISE NOTICE '⚠️  intern@eef.demo already exists — password reset';
  END IF;

  -- Mentor user
  SELECT id INTO mentor_id FROM auth.users WHERE email = 'mentor@eef.demo';
  IF mentor_id IS NULL THEN
    mentor_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      is_super_admin
    ) VALUES (
      mentor_id,
      '00000000-0000-0000-0000-000000000000',
      'mentor@eef.demo',
      crypt('Demo@1234', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Sarah Chen"}'::jsonb,
      now(), now(), 'authenticated', 'authenticated',
      '', '', '', false
    );
    RAISE NOTICE '✅ Created mentor@eef.demo (id: %)', mentor_id;
  ELSE
    UPDATE auth.users SET encrypted_password = crypt('Demo@1234', gen_salt('bf'))
    WHERE id = mentor_id;
    RAISE NOTICE '⚠️  mentor@eef.demo already exists — password reset';
  END IF;

  -- Admin user
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@eef.demo';
  IF admin_id IS NULL THEN
    admin_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      is_super_admin
    ) VALUES (
      admin_id,
      '00000000-0000-0000-0000-000000000000',
      'admin@eef.demo',
      crypt('Demo@1234', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"EEF Administrator"}'::jsonb,
      now(), now(), 'authenticated', 'authenticated',
      '', '', '', false
    );
    RAISE NOTICE '✅ Created admin@eef.demo (id: %)', admin_id;
  ELSE
    UPDATE auth.users SET encrypted_password = crypt('Demo@1234', gen_salt('bf'))
    WHERE id = admin_id;
    RAISE NOTICE '⚠️  admin@eef.demo already exists — password reset';
  END IF;

  -- ============================================================
  -- STEP 2: UPSERT PROFILES
  -- ============================================================

  INSERT INTO public.profiles (
    id, full_name, current_level, target_role,
    github_username, attendance_score, coding_speed,
    engineering_credits, joined_at
  ) VALUES (
    intern_id, 'Alex Johnson', 'L2 Builder', 'Full Stack Developer',
    'alexjohnson', 92, 75, 45, now()
  ) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    current_level = EXCLUDED.current_level,
    target_role = EXCLUDED.target_role,
    github_username = EXCLUDED.github_username,
    attendance_score = EXCLUDED.attendance_score,
    coding_speed = EXCLUDED.coding_speed,
    engineering_credits = EXCLUDED.engineering_credits;
  RAISE NOTICE '✅ Profile set for intern';

  INSERT INTO public.profiles (
    id, full_name, current_level, target_role,
    github_username, attendance_score, coding_speed,
    engineering_credits, joined_at
  ) VALUES (
    mentor_id, 'Sarah Chen', 'L4 Senior Engineer', 'Tech Lead',
    'sarahchen', 98, 95, 180, now()
  ) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    current_level = EXCLUDED.current_level,
    target_role = EXCLUDED.target_role,
    github_username = EXCLUDED.github_username,
    attendance_score = EXCLUDED.attendance_score,
    coding_speed = EXCLUDED.coding_speed,
    engineering_credits = EXCLUDED.engineering_credits;
  RAISE NOTICE '✅ Profile set for mentor';

  INSERT INTO public.profiles (
    id, full_name, current_level, target_role,
    github_username, attendance_score, coding_speed,
    engineering_credits, joined_at
  ) VALUES (
    admin_id, 'EEF Administrator', 'L5 Tech Lead', 'Engineering Manager',
    'eefadmin', 100, 100, 500, now()
  ) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    current_level = EXCLUDED.current_level,
    target_role = EXCLUDED.target_role,
    github_username = EXCLUDED.github_username,
    attendance_score = EXCLUDED.attendance_score,
    coding_speed = EXCLUDED.coding_speed,
    engineering_credits = EXCLUDED.engineering_credits;
  RAISE NOTICE '✅ Profile set for admin';

  -- ============================================================
  -- STEP 3: ASSIGN ROLES
  -- ============================================================

  INSERT INTO public.user_roles (user_id, role)
  VALUES (intern_id, 'intern')
  ON CONFLICT (user_id, role) DO NOTHING;
  RAISE NOTICE '✅ Role intern assigned';

  INSERT INTO public.user_roles (user_id, role)
  VALUES (mentor_id, 'mentor')
  ON CONFLICT (user_id, role) DO NOTHING;
  RAISE NOTICE '✅ Role mentor assigned';

  INSERT INTO public.user_roles (user_id, role)
  VALUES (admin_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  RAISE NOTICE '✅ Role admin assigned';

  -- ============================================================
  -- STEP 4: ASSIGN SKILLS TO INTERN
  -- ============================================================

  i := 0;
  FOR skill_rec IN
    SELECT id, name FROM public.skills ORDER BY name LIMIT 8
  LOOP
    INSERT INTO public.intern_skills (user_id, skill_id, proficiency, verified)
    VALUES (
      intern_id,
      skill_rec.id,
      CASE WHEN i < 2 THEN 4 WHEN i < 4 THEN 3 ELSE 2 END,
      i < 2
    ) ON CONFLICT (user_id, skill_id) DO UPDATE SET
      proficiency = EXCLUDED.proficiency,
      verified    = EXCLUDED.verified;
    i := i + 1;
  END LOOP;
  RAISE NOTICE '✅ Skills assigned to intern (% skills)', i;

  -- ============================================================
  -- DONE
  -- ============================================================
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '  DEMO USERS READY!';
  RAISE NOTICE '================================================';
  RAISE NOTICE '  INTERN  →  intern@eef.demo  /  Demo@1234';
  RAISE NOTICE '  MENTOR  →  mentor@eef.demo  /  Demo@1234';
  RAISE NOTICE '  ADMIN   →  admin@eef.demo   /  Demo@1234';
  RAISE NOTICE '================================================';

END $$;

-- ============================================================
-- VERIFY — Run this to confirm everything was created
-- ============================================================
SELECT
  u.email,
  p.full_name,
  p.current_level,
  r.role,
  u.email_confirmed_at IS NOT NULL AS confirmed
FROM auth.users u
JOIN public.profiles   p ON p.id = u.id
JOIN public.user_roles r ON r.user_id = u.id
WHERE u.email IN ('intern@eef.demo','mentor@eef.demo','admin@eef.demo')
ORDER BY r.role;
