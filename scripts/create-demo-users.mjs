/**
 * EEF — Demo Users Setup Script
 * Creates demo user profiles and roles after auth users exist in Supabase.
 * Auth users are created via curl in START.bat first.
 * Run: node scripts/create-demo-users.mjs
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Load .env ---
const envPath = resolve(__dirname, "../.env");
try {
  readFileSync(envPath, "utf-8")
    .split("\n")
    .forEach((line) => {
      const m = line.match(/^([^#=\s][^=]*)=["']?(.+?)["']?\s*$/);
      if (m) process.env[m[1].trim()] = m[2].trim();
    });
} catch {
  console.error("❌ .env not found. Run from project root.");
  process.exit(1);
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const headers = {
  "Content-Type": "application/json",
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
};

// ---- Helpers ----
async function apiGet(path) {
  const r = await fetch(`${SUPABASE_URL}${path}`, { headers });
  if (!r.ok) throw new Error(`GET ${path} → ${r.status}: ${await r.text()}`);
  return r.json();
}

async function apiPost(path, body) {
  const r = await fetch(`${SUPABASE_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const text = await r.text();
  return { ok: r.ok, status: r.status, body: (() => { try { return JSON.parse(text); } catch { return text; } })() };
}

async function dbUpsert(table, rows, onConflict) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?on_conflict=${onConflict}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(Array.isArray(rows) ? rows : [rows]),
  });
  return r.ok;
}

// ---- Demo user definitions ----
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

// ---- Main ----
async function main() {
  console.log("\n🚀  EEF Demo User Setup\n" + "=".repeat(50));

  // Step 1: Create auth users (idempotent — skip if exists)
  const created = [];
  for (const u of DEMO_USERS) {
    process.stdout.write(`\n📧  ${u.email} ... `);
    const res = await apiPost("/auth/v1/admin/users", {
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.profile.full_name },
    });

    if (res.ok) {
      console.log(`✅  created (id: ${res.body.id?.slice(0, 8)}...)`);
      created.push({ ...u, id: res.body.id });
    } else if (res.status === 422 || (typeof res.body === "object" && res.body?.msg?.includes("already"))) {
      console.log("⚠️   already exists — fetching id...");
      // Get existing user id
      const list = await apiGet("/auth/v1/admin/users?page=1&per_page=100");
      const users = list.users ?? list;
      const existing = users.find((x) => x.email === u.email);
      if (existing) {
        console.log(`    found: ${existing.id.slice(0, 8)}...`);
        created.push({ ...u, id: existing.id });
      } else {
        console.log("    ❌ could not find user after creation");
      }
    } else {
      console.log(`❌  error: ${JSON.stringify(res.body).slice(0, 120)}`);
    }
  }

  if (created.length === 0) {
    console.error("\n❌  No users created or found. Check credentials.");
    process.exit(1);
  }

  // Step 2: Upsert profiles and roles
  console.log("\n\n🔧  Setting up profiles and roles...\n");

  for (const u of created) {
    // profile
    const ok1 = await dbUpsert("profiles", { id: u.id, ...u.profile, joined_at: new Date().toISOString() }, "id");
    console.log(`  ${ok1 ? "✅" : "❌"}  Profile  → ${u.profile.full_name}`);

    // role
    const ok2 = await dbUpsert("user_roles", { user_id: u.id, role: u.role }, "user_id,role");
    console.log(`  ${ok2 ? "✅" : "❌"}  Role     → ${u.role}`);

    // skills for intern
    if (u.role === "intern") {
      const skillsRes = await fetch(`${SUPABASE_URL}/rest/v1/skills?select=id,name&limit=8`, { headers });
      const skills = await skillsRes.json();
      if (Array.isArray(skills) && skills.length > 0) {
        const rows = skills.map((s, i) => ({
          user_id: u.id,
          skill_id: s.id,
          proficiency: i < 2 ? 4 : i < 4 ? 3 : 2,
          verified: i < 2,
        }));
        const ok3 = await dbUpsert("intern_skills", rows, "user_id,skill_id");
        console.log(`  ${ok3 ? "✅" : "❌"}  Skills   → ${skills.length} assigned`);
      }
    }
  }

  // Done
  console.log("\n" + "=".repeat(50));
  console.log("✅  DEMO USERS READY\n");
  console.log("  INTERN  :  intern@eef.demo   /  Demo@1234");
  console.log("  MENTOR  :  mentor@eef.demo   /  Demo@1234");
  console.log("  ADMIN   :  admin@eef.demo    /  Demo@1234");
  console.log("\n  Live  →  https://intern-navigator.pages.dev");
  console.log("  Local →  http://localhost:8080");
  console.log("=".repeat(50) + "\n");
}

main().catch((e) => {
  console.error("\n❌  Fatal:", e.message);
  process.exit(1);
});
