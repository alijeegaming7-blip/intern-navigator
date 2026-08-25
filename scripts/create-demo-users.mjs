/**
 * EEF Demo Users Creation Script
 * Creates demo accounts for testing the platform
 * Run: node scripts/create-demo-users.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env manually
try {
  const envFile = readFileSync(resolve(__dirname, "../.env"), "utf-8");
  envFile.split("\n").forEach((line) => {
    const match = line.match(/^([^#=]+)=["']?(.+?)["']?\s*$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  });
} catch {}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_USERS = [
  {
    email: "intern@eef.demo",
    password: "Demo@1234",
    role: "intern",
    profile: {
      full_name: "Alex Johnson",
      current_level: "L2 Builder",
      target_role: "Full Stack Developer",
      github_username: "alexjohnson",
      attendance_score: 92,
      coding_speed: 75,
      engineering_credits: 45,
    },
  },
  {
    email: "mentor@eef.demo",
    password: "Demo@1234",
    role: "mentor",
    profile: {
      full_name: "Sarah Chen",
      current_level: "L4 Senior Engineer",
      target_role: "Tech Lead",
      github_username: "sarahchen",
      attendance_score: 98,
      coding_speed: 95,
      engineering_credits: 180,
    },
  },
  {
    email: "admin@eef.demo",
    password: "Demo@1234",
    role: "admin",
    profile: {
      full_name: "EEF Administrator",
      current_level: "L5 Tech Lead",
      target_role: "Engineering Manager",
      github_username: "eefadmin",
      attendance_score: 100,
      coding_speed: 100,
      engineering_credits: 500,
    },
  },
];

async function createDemoUsers() {
  console.log("\n🚀 EEF Demo User Creation\n");
  console.log("=".repeat(50));

  for (const user of DEMO_USERS) {
    console.log(`\n📧 Creating ${user.role}: ${user.email}`);

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { full_name: user.profile.full_name },
    });

    if (authError) {
      if (authError.message.includes("already exists")) {
        console.log(`   ⚠️  User already exists — skipping auth creation`);
        // Try to get existing user
        const { data: list } = await supabase.auth.admin.listUsers();
        const existing = list?.users?.find((u) => u.email === user.email);
        if (existing) {
          await updateProfile(existing.id, user);
        }
        continue;
      }
      console.error(`   ❌ Auth error: ${authError.message}`);
      continue;
    }

    const userId = authData.user?.id;
    if (!userId) continue;

    await updateProfile(userId, user);
  }

  console.log("\n" + "=".repeat(50));
  console.log("\n✅ Demo users ready!\n");
  console.log("📋 LOGIN CREDENTIALS:");
  console.log("=".repeat(50));
  DEMO_USERS.forEach((u) => {
    console.log(`\n  ${u.role.toUpperCase()}:`);
    console.log(`  Email:    ${u.email}`);
    console.log(`  Password: ${u.password}`);
  });
  console.log("\n" + "=".repeat(50));
  console.log("\n🌐 Live site: https://intern-navigator.pages.dev");
  console.log("🔧 Local dev: http://localhost:8080\n");
}

async function updateProfile(userId, user) {
  // Upsert profile
  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      ...user.profile,
      joined_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (profileError) {
    console.error(`   ❌ Profile error: ${profileError.message}`);
  } else {
    console.log(`   ✅ Profile created: ${user.profile.full_name}`);
  }

  // Assign role
  const { error: roleError } = await supabase.from("user_roles").upsert(
    { user_id: userId, role: user.role },
    { onConflict: "user_id,role" },
  );

  if (roleError) {
    console.error(`   ❌ Role error: ${roleError.message}`);
  } else {
    console.log(`   ✅ Role assigned: ${user.role}`);
  }

  // Add some skills for intern
  if (user.role === "intern") {
    const { data: skills } = await supabase.from("skills").select("id, name").limit(5);
    if (skills?.length) {
      const internSkills = skills.map((s, i) => ({
        user_id: userId,
        skill_id: s.id,
        proficiency: Math.floor(Math.random() * 3) + 1,
        verified: i < 2,
      }));
      await supabase.from("intern_skills").upsert(internSkills, { onConflict: "user_id,skill_id" });
      console.log(`   ✅ Skills assigned: ${skills.length} skills`);
    }
  }
}

createDemoUsers().catch(console.error);
