# 🚀 Database Setup Instructions

## ⚡ Quick Setup (5 minutes)

Your Supabase dashboard should have opened automatically. If not, click here:
**https://supabase.com/dashboard/project/duvjqwptlnmluwrjxcud/sql/new**

---

## 📋 Step-by-Step Instructions

### Step 1: Open Supabase SQL Editor ✅
The SQL Editor should be open in your browser. If not:
1. Go to: https://supabase.com/dashboard
2. Select your project: **duvjqwptlnmluwrjxcud**
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run the Complete Migration
1. Open the file: `COMPLETE_MIGRATION.sql` (in this project folder)
2. **Copy ALL the content** (Ctrl+A, Ctrl+C)
3. **Paste into Supabase SQL Editor** (Ctrl+V)
4. Click **RUN** button (bottom right)

⏱️ **Wait 10-15 seconds** for it to complete

### Step 3: Verify Setup
After running, you should see:
- ✅ "Success. No rows returned"
- Or a list of created objects

Check the **Table Editor** (left sidebar):
- You should see tables: `profiles`, `user_roles`, `skills`, `case_studies`, `roadmaps`, `notifications`, etc.

---

## 🎯 What This Does

The migration creates:
- **10 database tables** for your app
- **30 skills** (HTML, React, Python, etc.)
- **10 case studies** (projects for interns)
- **Security policies** (Row Level Security)
- **Auto-signup function** (creates profile automatically)
- **Admin system** (invite codes and roles)

---

## 🔐 Make Yourself Admin

After creating your account:

1. Go back to SQL Editor
2. Run this single command:
   ```sql
   SELECT public.bootstrap_first_admin();
   ```
3. This makes YOU the first admin!

---

## ✅ Verification Checklist

After running the migration, verify:

### Check Tables Exist
Go to **Table Editor** → You should see:
- [ ] profiles
- [ ] user_roles  
- [ ] skills
- [ ] case_studies
- [ ] roadmaps
- [ ] notifications
- [ ] admin_invites
- [ ] activity_events
- [ ] mentor_reviews
- [ ] completed_case_studies
- [ ] intern_skills
- [ ] roadmap_generations

### Check Seed Data
1. Click **skills** table → Should see 30 rows
2. Click **case_studies** table → Should see 10 rows

---

## 🧪 Test Your Setup

### Test 1: Create Account
1. Go to: http://localhost:8080/auth
2. Click "Create account"
3. Fill in:
   - Name: Your Name
   - Email: your@email.com
   - Password: (at least 6 characters)
4. Click "Create account"

**Expected:** You should be redirected to the dashboard

### Test 2: Verify Profile Created
In Supabase SQL Editor, run:
```sql
SELECT * FROM profiles;
```
**Expected:** You should see your profile with your email

### Test 3: Make Yourself Admin
In SQL Editor, run:
```sql
SELECT public.bootstrap_first_admin();
```
**Expected:** Returns `true`

### Test 4: Verify Admin Role
In SQL Editor, run:
```sql
SELECT * FROM user_roles WHERE role = 'admin';
```
**Expected:** You should see your user_id with 'admin' role

### Test 5: Access Admin Panel
1. Go to: http://localhost:8080/admin
2. **Expected:** You should see the admin dashboard

---

## 🐛 Troubleshooting

### Error: "relation already exists"
✅ **This is OK!** It means the table was already created. The migration is idempotent.

### Error: "permission denied"
❌ Make sure you're logged into the correct Supabase project

### Can't see tables
1. Refresh the page
2. Check you're in the correct project
3. Go to Table Editor to see visual list

### Account created but can't login
1. Check your email for confirmation (if email confirmation is enabled)
2. Go to Authentication → Users in Supabase dashboard
3. Verify your user exists

### Can't access admin panel
1. Run `SELECT * FROM user_roles;` to verify your role
2. Run `SELECT public.bootstrap_first_admin();` to add admin role
3. Sign out and sign in again

---

## 📖 Alternative: Manual Migration

If the complete script has issues, apply migrations one by one:

1. Go to: `supabase/migrations/` folder
2. Open each file in order:
   - `20260720082640_...sql` → Run in SQL Editor
   - `20260720082706_...sql` → Run in SQL Editor
   - `20260720082729_...sql` → Run in SQL Editor
   - `20260720084005_...sql` → Run in SQL Editor
   - `20260720084828_...sql` → Run in SQL Editor

---

## 🎉 Success!

Once setup is complete:
1. ✅ Database is configured
2. ✅ You can create accounts
3. ✅ You're the admin
4. ✅ App is fully functional

**Now go to:** http://localhost:8080/

---

## 📞 Still Having Issues?

### Check Supabase Project Status
1. Go to: https://supabase.com/dashboard/project/duvjqwptlnmluwrjxcud
2. Check if project is active (not paused)
3. Check database health in Settings → Database

### Check Environment Variables
File: `.env`
```
VITE_SUPABASE_URL=https://duvjqwptlnmluwrjxcud.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_***
SUPABASE_SERVICE_ROLE_KEY=***
```

### Get Help
- Check Supabase docs: https://supabase.com/docs
- Check project logs in Supabase Dashboard
- Review browser console for errors (F12)

---

**Ready? Let's set it up! 🚀**

Open: https://supabase.com/dashboard/project/duvjqwptlnmluwrjxcud/sql/new
