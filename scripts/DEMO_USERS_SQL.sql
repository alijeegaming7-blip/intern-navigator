-- ============================================================
-- EEF DEMO USERS SETUP
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Step 1: Create demo users in auth.users
-- NOTE: Supabase doesn't allow inserting directly into auth.users via SQL.
-- You must create users through the Supabase Auth dashboard or use the
-- admin API. After creating users via dashboard, run Steps 2-4 below.

-- ============================================================
-- HOW TO CREATE DEMO USERS:
-- 1. Go to: https://supabase.com/dashboard/project/yjzjbvthwrmhyyoxihca/auth/users
-- 2. Click "Add user" → "Create new user"
-- 3. Create these 3 users:
--    - intern@eef.demo    / Demo@1234
--    - mentor@eef.demo    / Demo@1234
--    - admin@eef.demo     / Demo@1234
-- 4. Check "Auto Confirm User" for each
-- 5. Then run the SQL below after getting their UUIDs
-- ============================================================

-- Step 2: After creating users, get their IDs with this query:
SELECT id, email FROM auth.users 
WHERE email IN ('intern@eef.demo', 'mentor@eef.demo', 'admin@eef.demo');

-- Step 3: Update profiles for demo users (replace UUIDs with actual ones)
-- The trigger should auto-create profiles, but we update them here:

-- Update intern profile (replace INTERN_UUID with actual UUID)
UPDATE profiles SET
  full_name = 'Alex Johnson',
  current_level = 'L2 Builder',
  target_role = 'Full Stack Developer',
  github_username = 'alexjohnson',
  attendance_score = 92,
  coding_speed = 75,
  engineering_credits = 45
WHERE id = (SELECT id FROM auth.users WHERE email = 'intern@eef.demo');

-- Update mentor profile
UPDATE profiles SET
  full_name = 'Sarah Chen',
  current_level = 'L4 Senior Engineer',
  target_role = 'Tech Lead',
  github_username = 'sarahchen',
  attendance_score = 98,
  coding_speed = 95,
  engineering_credits = 180
WHERE id = (SELECT id FROM auth.users WHERE email = 'mentor@eef.demo');

-- Update admin profile
UPDATE profiles SET
  full_name = 'EEF Administrator',
  current_level = 'L5 Tech Lead',
  target_role = 'Engineering Manager',
  github_username = 'eefadmin',
  attendance_score = 100,
  coding_speed = 100,
  engineering_credits = 500
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@eef.demo');

-- Step 4: Assign roles
INSERT INTO user_roles (user_id, role)
SELECT id, 'intern' FROM auth.users WHERE email = 'intern@eef.demo'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO user_roles (user_id, role)
SELECT id, 'mentor' FROM auth.users WHERE email = 'mentor@eef.demo'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'admin@eef.demo'
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 5: Add skills for intern demo user
INSERT INTO intern_skills (user_id, skill_id, proficiency, verified)
SELECT 
  (SELECT id FROM auth.users WHERE email = 'intern@eef.demo'),
  s.id,
  CASE 
    WHEN s.name IN ('JavaScript', 'React') THEN 3
    WHEN s.name IN ('Node.js', 'Python') THEN 2
    ELSE 1
  END,
  s.name IN ('JavaScript', 'React')
FROM skills s
WHERE s.name IN ('JavaScript', 'React', 'Node.js', 'Python', 'SQL', 'Git', 'HTML/CSS')
ON CONFLICT (user_id, skill_id) DO NOTHING;

-- Step 6: Verify everything
SELECT 
  u.email,
  p.full_name,
  p.current_level,
  r.role
FROM auth.users u
JOIN profiles p ON p.id = u.id
JOIN user_roles r ON r.user_id = u.id
WHERE u.email IN ('intern@eef.demo', 'mentor@eef.demo', 'admin@eef.demo')
ORDER BY u.email;

-- ============================================================
-- DEMO CREDENTIALS SUMMARY:
-- 
-- INTERN:  intern@eef.demo  / Demo@1234
-- MENTOR:  mentor@eef.demo  / Demo@1234
-- ADMIN:   admin@eef.demo   / Demo@1234
--
-- Live: https://intern-navigator.pages.dev
-- ============================================================
