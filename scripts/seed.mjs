import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

async function seed() {
  console.log("Seeding demo data...");

  // Profiles
  const profiles = [
    {
      id: "demo-intern-001",
      full_name: "Demo Intern",
      email: "intern@ezitech.dev",
      bio: "A demo intern.",
    },
    {
      id: "demo-admin-001",
      full_name: "Demo Admin",
      email: "admin@ezitech.dev",
      bio: "Administrator",
    },
  ];

  for (const p of profiles) {
    const { error } = await supabase.from("profiles").upsert(p, { onConflict: "id" });
    if (error) console.error("profiles upsert error", error.message);
  }

  // Roles
  const roles = [
    { user_id: "demo-intern-001", role: "intern" },
    { user_id: "demo-admin-001", role: "admin" },
  ];
  for (const r of roles) {
    const { error } = await supabase
      .from("user_roles")
      .upsert(r, { onConflict: ["user_id", "role"] });
    if (error) console.error("roles upsert error", error.message);
  }

  // Skills
  const skills = [
    { id: "skill-001", name: "JavaScript", category: "programming" },
    { id: "skill-002", name: "React", category: "framework" },
  ];
  for (const s of skills) {
    const { error } = await supabase.from("skills").upsert(s, { onConflict: "id" });
    if (error) console.error("skills upsert error", error.message);
  }

  // Intern skills
  const internSkills = [
    { user_id: "demo-intern-001", skill_id: "skill-001", proficiency: 40 },
    { user_id: "demo-intern-001", skill_id: "skill-002", proficiency: 30 },
  ];
  for (const is of internSkills) {
    const { error } = await supabase
      .from("intern_skills")
      .upsert(is, { onConflict: ["user_id", "skill_id"] });
    if (error) console.error("intern_skills upsert error", error.message);
  }

  // Notifications (optional)
  const { error: notifErr } = await supabase.from("notifications").insert([
    {
      user_id: "demo-intern-001",
      kind: "info",
      title: "Welcome",
      message: "Welcome to the demo!",
      severity: "info",
    },
  ]);
  if (notifErr) console.error("notifications insert error", notifErr.message);

  console.log("Seeding complete");
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
