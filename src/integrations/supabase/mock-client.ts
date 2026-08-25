import type { Database } from "./types";

type AnyRecord = Record<string, unknown>;
type Listener = (event: string, session: Session | null) => void;
type Session = {
  access_token: string;
  user: { id: string; email: string; user_metadata?: AnyRecord; app_metadata?: AnyRecord };
};

// ────────────────────────────────────────────────────────────
// SEED DATA — 3 demo accounts with full platform data
// ────────────────────────────────────────────────────────────
const INTERN_ID = "demo-intern-001";
const MENTOR_ID = "demo-mentor-001";
const ADMIN_ID  = "demo-admin-001";

const DEMO_USERS: Record<string, { email: string; password: string; name: string }> = {
  [INTERN_ID]: { email: "intern@eef.demo", password: "Demo@1234", name: "Alex Johnson" },
  [MENTOR_ID]: { email: "mentor@eef.demo", password: "Demo@1234", name: "Sarah Chen" },
  [ADMIN_ID]:  { email: "admin@eef.demo",  password: "Demo@1234", name: "EEF Administrator" },
};

const store: Record<string, AnyRecord[]> = {
  profiles: [
    {
      id: INTERN_ID,
      full_name: "Alex Johnson",
      email: "intern@eef.demo",
      current_level: "L2 Builder",
      target_role: "Full Stack Developer",
      github_username: "alexjohnson",
      bio: "Aspiring full-stack developer passionate about building great products.",
      attendance_score: 92,
      coding_speed: 75,
      engineering_credits: 45,
      joined_at: "2026-01-10T00:00:00.000Z",
      notification_prefs: { roadmap_missing: true, roadmap_stale: true, goal_due: true },
      last_email_digest_at: null,
      onboarding_completed: true,
      mentor_id: MENTOR_ID,
      avatar_url: null,
    },
    {
      id: MENTOR_ID,
      full_name: "Sarah Chen",
      email: "mentor@eef.demo",
      current_level: "L4 Senior Engineer",
      target_role: "Tech Lead",
      github_username: "sarahchen",
      bio: "Senior engineer with 8 years of experience mentoring junior developers.",
      attendance_score: 98,
      coding_speed: 95,
      engineering_credits: 180,
      joined_at: "2025-06-01T00:00:00.000Z",
      notification_prefs: {},
      last_email_digest_at: null,
      onboarding_completed: true,
      mentor_id: null,
      avatar_url: null,
    },
    {
      id: ADMIN_ID,
      full_name: "EEF Administrator",
      email: "admin@eef.demo",
      current_level: "L5 Tech Lead",
      target_role: "Engineering Manager",
      github_username: "eefadmin",
      bio: "Platform administrator for the EEF Intern Navigator system.",
      attendance_score: 100,
      coding_speed: 100,
      engineering_credits: 500,
      joined_at: "2025-01-01T00:00:00.000Z",
      notification_prefs: {},
      last_email_digest_at: null,
      onboarding_completed: true,
      mentor_id: null,
      avatar_url: null,
    },
  ],

  user_roles: [
    { id: "role-001", user_id: INTERN_ID, role: "intern",  created_at: "2026-01-10T00:00:00.000Z" },
    { id: "role-002", user_id: MENTOR_ID, role: "mentor",  created_at: "2025-06-01T00:00:00.000Z" },
    { id: "role-003", user_id: ADMIN_ID,  role: "admin",   created_at: "2025-01-01T00:00:00.000Z" },
  ],

  skills: [
    { id: "sk-01", name: "JavaScript",    category: "Frontend",  description: "Core web scripting language" },
    { id: "sk-02", name: "TypeScript",    category: "Frontend",  description: "Typed superset of JavaScript" },
    { id: "sk-03", name: "React",         category: "Frontend",  description: "UI component library by Meta" },
    { id: "sk-04", name: "Node.js",       category: "Backend",   description: "Server-side JavaScript runtime" },
    { id: "sk-05", name: "SQL",           category: "Database",  description: "Structured Query Language" },
    { id: "sk-06", name: "Git",           category: "DevOps",    description: "Version control system" },
    { id: "sk-07", name: "Docker",        category: "DevOps",    description: "Containerisation platform" },
    { id: "sk-08", name: "REST APIs",     category: "Backend",   description: "RESTful API design & integration" },
    { id: "sk-09", name: "Python",        category: "Backend",   description: "General purpose scripting language" },
    { id: "sk-10", name: "CSS/Tailwind",  category: "Frontend",  description: "Styling & utility-first CSS" },
    { id: "sk-11", name: "Testing",       category: "Quality",   description: "Unit, integration & E2E testing" },
    { id: "sk-12", name: "CI/CD",         category: "DevOps",    description: "Continuous integration & delivery" },
  ],

  intern_skills: [
    { id: "is-01", user_id: INTERN_ID, skill_id: "sk-01", proficiency: 4, verified: true,  updated_at: "2026-03-01T00:00:00.000Z" },
    { id: "is-02", user_id: INTERN_ID, skill_id: "sk-02", proficiency: 3, verified: true,  updated_at: "2026-03-01T00:00:00.000Z" },
    { id: "is-03", user_id: INTERN_ID, skill_id: "sk-03", proficiency: 4, verified: true,  updated_at: "2026-03-01T00:00:00.000Z" },
    { id: "is-04", user_id: INTERN_ID, skill_id: "sk-05", proficiency: 2, verified: false, updated_at: "2026-03-01T00:00:00.000Z" },
    { id: "is-05", user_id: INTERN_ID, skill_id: "sk-06", proficiency: 3, verified: true,  updated_at: "2026-03-01T00:00:00.000Z" },
    { id: "is-06", user_id: INTERN_ID, skill_id: "sk-10", proficiency: 4, verified: true,  updated_at: "2026-03-01T00:00:00.000Z" },
  ],

  case_studies: [
    { id: "cs-01", code: "CS-001", title: "Build a Task Manager",          category: "Frontend",  difficulty: 1, estimated_hours: 8,  description: "Create a full CRUD task manager app with React.", tech_stack: ["React","TypeScript"], prerequisites: [] },
    { id: "cs-02", code: "CS-002", title: "Design a REST API",             category: "Backend",   difficulty: 2, estimated_hours: 12, description: "Design and implement a RESTful API for a blog.", tech_stack: ["Node.js","Express","SQL"], prerequisites: ["CS-001"] },
    { id: "cs-03", code: "CS-003", title: "Ship a Realtime Dashboard",     category: "Fullstack", difficulty: 3, estimated_hours: 20, description: "Build a live dashboard with realtime data updates.", tech_stack: ["React","Node.js","WebSockets"], prerequisites: ["CS-002"] },
    { id: "cs-04", code: "CS-004", title: "Containerise a Node App",       category: "DevOps",    difficulty: 2, estimated_hours: 6,  description: "Package a Node.js app with Docker.", tech_stack: ["Docker","Node.js"], prerequisites: [] },
    { id: "cs-05", code: "CS-005", title: "CI/CD Pipeline Setup",          category: "DevOps",    difficulty: 3, estimated_hours: 10, description: "Set up automated testing and deployment pipeline.", tech_stack: ["GitHub Actions","Docker"], prerequisites: ["CS-004"] },
    { id: "cs-06", code: "CS-006", title: "Auth System from Scratch",      category: "Backend",   difficulty: 3, estimated_hours: 16, description: "Implement JWT-based authentication.", tech_stack: ["Node.js","JWT","bcrypt"], prerequisites: ["CS-002"] },
    { id: "cs-07", code: "CS-007", title: "Database Optimisation",         category: "Database",  difficulty: 3, estimated_hours: 10, description: "Optimise slow queries and add indexes.", tech_stack: ["PostgreSQL","SQL"], prerequisites: ["CS-002"] },
    { id: "cs-08", code: "CS-008", title: "React Performance Deep Dive",   category: "Frontend",  difficulty: 3, estimated_hours: 12, description: "Profile and optimise a slow React application.", tech_stack: ["React","Profiler"], prerequisites: ["CS-001"] },
    { id: "cs-09", code: "CS-009", title: "Microservices Architecture",    category: "Backend",   difficulty: 4, estimated_hours: 24, description: "Split a monolith into microservices.", tech_stack: ["Docker","Node.js","RabbitMQ"], prerequisites: ["CS-004","CS-006"] },
    { id: "cs-10", code: "CS-010", title: "End-to-End Testing Suite",      category: "Quality",   difficulty: 2, estimated_hours: 8,  description: "Write E2E tests with Playwright.", tech_stack: ["Playwright","TypeScript"], prerequisites: ["CS-001"] },
  ],

  completed_case_studies: [
    { id: "ccs-01", user_id: INTERN_ID, case_study_id: "cs-01", completed_at: "2026-02-10T00:00:00.000Z", mentor_rating: 4, notes: "Good implementation, clean code" },
    { id: "ccs-02", user_id: INTERN_ID, case_study_id: "cs-02", completed_at: "2026-03-01T00:00:00.000Z", mentor_rating: 3, notes: "Needs better error handling" },
  ],

  mentor_reviews: [
    {
      id: "mr-01",
      intern_id: INTERN_ID,
      mentor_id: MENTOR_ID,
      rating: 4,
      feedback: "Alex is making excellent progress. Strong React skills, needs to focus more on backend and database concepts. Good attitude and consistent effort.",
      review_date: "2026-03-15T00:00:00.000Z",
    },
  ],

  roadmaps: [
    {
      id: "rm-01",
      user_id: INTERN_ID,
      current_level: "L2 Builder",
      next_target: "Full Stack Developer",
      ai_summary: "Alex is progressing well with strong frontend skills. The next 12 weeks should focus on backend development, SQL optimisation, and shipping a full-stack project. Case studies CS-003 and CS-006 are the priority recommendations.",
      weekly_goals: JSON.stringify([
        { week: 1, title: "Strengthen SQL fundamentals", description: "Complete SQL exercises covering JOINs, indexes, and query optimisation. Use CS-007 as reference material." },
        { week: 2, title: "Build REST API endpoints", description: "Implement CRUD endpoints for a blog API using Node.js and Express. Focus on error handling and validation." },
        { week: 3, title: "Integrate frontend with API", description: "Connect the React frontend to the backend API built last week. Add loading and error states." },
        { week: 4, title: "Deploy full-stack app", description: "Deploy the combined frontend + backend using Docker. Practice the CI/CD pipeline setup." },
      ]),
      monthly_goals: JSON.stringify([
        { month: 1, title: "Master Backend Basics", description: "Complete CS-002, CS-004 and strengthen SQL/Node.js fundamentals through daily practice." },
        { month: 2, title: "Build & Ship Full Stack", description: "Complete CS-003 and CS-006. Deploy a working full-stack application demonstrating frontend + backend integration." },
        { month: 3, title: "Reach L3 Engineer", description: "Complete 2 more advanced case studies, receive a mentor review rating ≥ 4, and demonstrate consistent code quality." },
      ]),
      recommended_case_studies: JSON.stringify([
        { code: "CS-003", title: "Ship a Realtime Dashboard", reason: "Combines your React strength with backend skills to create impressive portfolio piece." },
        { code: "CS-006", title: "Auth System from Scratch", reason: "Critical backend skill gap — JWT auth is required for senior roles." },
        { code: "CS-007", title: "Database Optimisation", reason: "SQL proficiency is currently low — this case study will bring it to L3 level." },
      ]),
      missing_skills: JSON.stringify(["Docker", "CI/CD", "Testing", "Python"]),
      strong_skills: JSON.stringify(["JavaScript", "React", "CSS/Tailwind"]),
      weak_skills: JSON.stringify(["SQL", "Node.js"]),
      technology_dependencies: JSON.stringify(["TypeScript", "React", "Node.js", "PostgreSQL", "Git", "Docker", "REST APIs"]),
      promotion_readiness: 52,
      job_readiness: 48,
      estimated_graduation_date: "2026-10-01",
      generated_at: "2026-07-01T00:00:00.000Z",
    },
  ],

  roadmap_generations: [
    {
      id: "rg-01",
      user_id: INTERN_ID,
      triggered_by: INTERN_ID,
      model: "gemini-2.0-flash-exp",
      duration_ms: 1840,
      inputs: JSON.stringify({ skills_count: 6, completed_count: 2, trigger: "manual" }),
      scores: JSON.stringify({ promotion_readiness: 52, job_readiness: 48, current_level: "L2 Builder" }),
      summary: "Roadmap generated for Alex Johnson targeting Full Stack Developer.",
      created_at: "2026-07-01T00:00:00.000Z",
    },
  ],

  notifications: [
    {
      id: "notif-01",
      user_id: INTERN_ID,
      kind: "roadmap_stale",
      title: "Your roadmap is fresh!",
      message: "Great — your roadmap was generated recently. Keep working on your weekly goals.",
      severity: "info",
      link: "/roadmap",
      read_at: null,
      dedupe_key: "roadmap_fresh",
      created_at: "2026-07-01T10:00:00.000Z",
    },
    {
      id: "notif-02",
      user_id: INTERN_ID,
      kind: "goal_due",
      title: "Week 1 goal in progress",
      message: "Strengthen SQL fundamentals — this week's goal is active.",
      severity: "info",
      link: "/roadmap",
      read_at: null,
      dedupe_key: "goal_due_w1",
      created_at: "2026-07-02T09:00:00.000Z",
    },
  ],

  activity_events: [
    { id: "ae-01", user_id: INTERN_ID, event_type: "roadmap_generated", payload: JSON.stringify({ trigger: "manual" }), created_at: "2026-07-01T00:00:00.000Z" },
    { id: "ae-02", user_id: INTERN_ID, event_type: "case_study_completed", payload: JSON.stringify({ code: "CS-001" }), created_at: "2026-02-10T00:00:00.000Z" },
    { id: "ae-03", user_id: INTERN_ID, event_type: "case_study_completed", payload: JSON.stringify({ code: "CS-002" }), created_at: "2026-03-01T00:00:00.000Z" },
  ],

  admin_invites: [
    {
      id: "inv-01",
      code: "DEMO-MENTOR-2026",
      role: "mentor",
      created_by: ADMIN_ID,
      created_at: "2026-07-01T00:00:00.000Z",
      expires_at: "2027-01-01T00:00:00.000Z",
      used_at: null,
      used_by: null,
    },
  ],
};

// ────────────────────────────────────────────────────────────
// SESSION + AUTH
// ────────────────────────────────────────────────────────────
let currentSession: Session | null = null;
const authListeners = new Set<Listener>();

function emit(event: string, session: Session | null) {
  authListeners.forEach((l) => l(event, session));
}
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
function getOrCreateTable(table: string) {
  if (!store[table]) store[table] = [];
  return store[table];
}

function findUserByCredentials(email: string, password: string) {
  return Object.entries(DEMO_USERS).find(
    ([, u]) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
  );
}

function buildSession(userId: string): Session {
  const user = DEMO_USERS[userId];
  return {
    access_token: `mock-token-${userId}`,
    user: {
      id: userId,
      email: user.email,
      user_metadata: { full_name: user.name },
      app_metadata: { provider: "mock" },
    },
  };
}

function ensureProfile(userId: string, email: string, fullName?: string) {
  const profiles = getOrCreateTable("profiles") as AnyRecord[];
  if (!profiles.find((p) => p.id === userId)) {
    profiles.push({
      id: userId,
      full_name: fullName ?? email.split("@")[0],
      email,
      current_level: "L1 Explorer",
      target_role: "Software Engineer",
      github_username: null,
      bio: null,
      attendance_score: 90,
      coding_speed: 60,
      engineering_credits: 0,
      joined_at: new Date().toISOString(),
      notification_prefs: {},
      last_email_digest_at: null,
      onboarding_completed: false,
      mentor_id: null,
      avatar_url: null,
    });
  }
  const roles = getOrCreateTable("user_roles") as AnyRecord[];
  if (!roles.find((r) => r.user_id === userId)) {
    roles.push({ id: `role-${userId}`, user_id: userId, role: "intern", created_at: new Date().toISOString() });
  }
}

// ────────────────────────────────────────────────────────────
// QUERY BUILDER
// ────────────────────────────────────────────────────────────
type Filter = { type: string; column: string; value?: unknown; values?: unknown[] };

class MockQueryBuilder {
  private filters: Filter[] = [];
  private sort?: { column: string; ascending: boolean };
  private limitCount?: number;
  private _insertData?: AnyRecord | AnyRecord[];
  private _updateData?: AnyRecord;
  private _upsertData?: AnyRecord | AnyRecord[];
  private _upsertConflict?: string;
  private _operation: "select" | "insert" | "update" | "upsert" | "delete" = "select";
  private _countHead = false;

  constructor(private table: string) {}

  select(_columns?: unknown, options?: { count?: string; head?: boolean }) {
    this._operation = "select";
    if (options?.head) this._countHead = true;
    return this;
  }
  eq(column: string, value: unknown)      { this.filters.push({ type: "eq", column, value }); return this; }
  in(column: string, values: unknown[])   { this.filters.push({ type: "in", column, values }); return this; }
  is(column: string, value: unknown)      { this.filters.push({ type: "is", column, value }); return this; }
  order(column: string, opts?: { ascending?: boolean }) {
    this.sort = { column, ascending: opts?.ascending ?? true }; return this;
  }
  limit(n: number) { this.limitCount = n; return this; }

  insert(values: AnyRecord | AnyRecord[]) {
    this._operation = "insert"; this._insertData = values; return this;
  }
  update(values: AnyRecord) {
    this._operation = "update"; this._updateData = values; return this;
  }
  upsert(values: AnyRecord | AnyRecord[], opts?: { onConflict?: string }) {
    this._operation = "upsert"; this._upsertData = values;
    this._upsertConflict = opts?.onConflict ?? "id"; return this;
  }
  delete() { this._operation = "delete"; return this; }

  private _getFiltered(): AnyRecord[] {
    const table = clone(getOrCreateTable(this.table)) as AnyRecord[];
    let rows = this.filters.reduce((acc, f) => acc.filter((row) => {
      const v = row[f.column];
      if (f.type === "eq")  return v === f.value;
      if (f.type === "in")  return Array.isArray(f.values) && f.values.includes(v);
      if (f.type === "is")  return f.value === null ? v == null : v === f.value;
      return true;
    }), table);
    if (this.sort) {
      const { column, ascending } = this.sort;
      rows = rows.sort((a, b) => {
        const [l, r] = [a[column], b[column]];
        if (l == null || r == null) return 0;
        return String(l).localeCompare(String(r)) * (ascending ? 1 : -1);
      });
    }
    if (this.limitCount != null) rows = rows.slice(0, this.limitCount);
    return rows;
  }

  private _commit(): { data: unknown; error: null | { message: string }; count?: number } {
    const tbl = getOrCreateTable(this.table);

    if (this._operation === "insert") {
      const rows = Array.isArray(this._insertData) ? this._insertData : [this._insertData!];
      const withIds = rows.map((r) => ({ id: crypto.randomUUID(), created_at: new Date().toISOString(), ...r }));
      withIds.forEach((r) => tbl.push(clone(r)));
      store[this.table] = tbl;
      return { data: withIds.length === 1 ? withIds[0] : withIds, error: null };
    }

    if (this._operation === "update") {
      const target = this._getFiltered();
      target.forEach((row) => {
        const idx = tbl.findIndex((r) => r === row || (r.id && r.id === row.id));
        if (idx >= 0) Object.assign(tbl[idx], clone(this._updateData!));
      });
      store[this.table] = tbl;
      return { data: target, error: null };
    }

    if (this._operation === "upsert") {
      const rows = Array.isArray(this._upsertData) ? this._upsertData : [this._upsertData!];
      const conflictKey = this._upsertConflict ?? "id";
      rows.forEach((row) => {
        // Handle composite keys like "user_id,skill_id"
        const keys = conflictKey.split(",").map((k) => k.trim());
        const idx = tbl.findIndex((item) => keys.every((k) => item[k] === row[k]));
        if (idx >= 0) {
          tbl[idx] = { ...tbl[idx], ...clone(row) };
        } else {
          tbl.push(clone({ id: crypto.randomUUID(), created_at: new Date().toISOString(), ...row }));
        }
      });
      store[this.table] = tbl;
      return { data: rows, error: null };
    }

    if (this._operation === "delete") {
      const target = this._getFiltered();
      const targetIds = new Set(target.map((r) => r.id ?? JSON.stringify(r)));
      store[this.table] = tbl.filter((r) => !targetIds.has(r.id ?? JSON.stringify(r)));
      return { data: target, error: null };
    }

    // select
    const rows = this._getFiltered();
    if (this._countHead) return { data: null, error: null, count: rows.length };
    return { data: rows, error: null };
  }

  maybeSingle()  { const r = this._commit(); return Promise.resolve({ data: Array.isArray(r.data) ? (r.data[0] ?? null) : r.data, error: r.error }); }
  single()       { const r = this._commit(); const d = Array.isArray(r.data) ? r.data[0] : r.data; return Promise.resolve(d ? { data: d, error: null } : { data: null, error: { message: "No rows" } }); }

  then<T, U = never>(ok?: ((v: { data: unknown[]; error: null; count?: number }) => T | PromiseLike<T>) | null, fail?: ((e: unknown) => U | PromiseLike<U>) | null) {
    const r = this._commit();
    const out = { data: Array.isArray(r.data) ? r.data : r.data != null ? [r.data] : [], error: r.error, count: r.count };
    return Promise.resolve(out as never).then(ok, fail);
  }
  catch(fn?: ((e: unknown) => unknown) | null)  { return Promise.resolve(this._commit()).catch(fn); }
  finally(fn?: (() => void) | null)              { return Promise.resolve(this._commit()).finally(fn); }
}

// ────────────────────────────────────────────────────────────
// AUTH CLIENT
// ────────────────────────────────────────────────────────────
function buildAuthClient() {
  return {
    getSession: async () => ({ data: { session: currentSession }, error: null }),

    getUser: async () => currentSession
      ? { data: { user: currentSession.user }, error: null }
      : { data: { user: null }, error: null },

    getClaims: async (token: string) => {
      const userId = Object.keys(DEMO_USERS).find((id) => `mock-token-${id}` === token)
        ?? (token.startsWith("mock-token-") ? token.replace("mock-token-", "") : null);
      if (!userId) return { data: null, error: { message: "Invalid mock token" } };
      const user = DEMO_USERS[userId];
      if (!user) return { data: null, error: { message: "Unknown user" } };
      return {
        data: { claims: { sub: userId, email: user.email, role: "authenticated" } },
        error: null,
      };
    },

    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      const found = findUserByCredentials(email, password);
      if (!found) return { data: { session: null, user: null }, error: { message: "Invalid email or password" } };
      const [userId] = found;
      currentSession = buildSession(userId);
      emit("SIGNED_IN", currentSession);
      return { data: { session: currentSession, user: currentSession.user }, error: null };
    },

    signUp: async ({ email, password, options }: { email: string; password: string; options?: { data?: AnyRecord } }) => {
      if (!email || !password) return { data: { session: null, user: null }, error: { message: "Email and password required" } };
      const userId = crypto.randomUUID();
      const fullName = (options?.data?.full_name as string | undefined) ?? email.split("@")[0];
      ensureProfile(userId, email, fullName);
      currentSession = {
        access_token: `mock-token-${userId}`,
        user: { id: userId, email, user_metadata: { full_name: fullName }, app_metadata: { provider: "mock" } },
      };
      // Also register in DEMO_USERS for subsequent logins in this session
      DEMO_USERS[userId] = { email, password, name: fullName };
      emit("SIGNED_IN", currentSession);
      return { data: { session: currentSession, user: currentSession.user }, error: null };
    },

    signOut: async () => {
      currentSession = null;
      emit("SIGNED_OUT", null);
      return { error: null };
    },

    onAuthStateChange: (cb: Listener) => {
      authListeners.add(cb);
      return { data: { subscription: { unsubscribe: () => authListeners.delete(cb) } } };
    },
  };
}

// ────────────────────────────────────────────────────────────
// RPC CLIENT
// ────────────────────────────────────────────────────────────
function buildRpcClient() {
  return {
    rpc: async (name: string, params?: AnyRecord) => {
      if (name === "has_role") {
        const rows = getOrCreateTable("user_roles") as AnyRecord[];
        const found = rows.some((r) => r.user_id === params?._user_id && r.role === params?._role);
        return { data: found, error: null };
      }
      if (name === "redeem_admin_invite") {
        const code = String(params?._code ?? "").trim().toUpperCase();
        const invites = getOrCreateTable("admin_invites") as AnyRecord[];
        const invite = invites.find((i) => i.code === code && !i.used_at && new Date(i.expires_at as string) > new Date());
        if (!invite) return { data: null, error: { message: "Invite not found or expired" } };
        invite.used_at = new Date().toISOString();
        if (currentSession) {
          const roles = getOrCreateTable("user_roles") as AnyRecord[];
          if (!roles.find((r) => r.user_id === currentSession!.user.id && r.role === invite.role)) {
            roles.push({ id: crypto.randomUUID(), user_id: currentSession.user.id, role: invite.role, created_at: new Date().toISOString() });
          }
        }
        return { data: [{ role: invite.role }], error: null };
      }
      if (name === "bootstrap_first_admin") {
        const admins = (getOrCreateTable("user_roles") as AnyRecord[]).filter((r) => r.role === "admin");
        if (admins.length === 0 && currentSession) {
          const roles = getOrCreateTable("user_roles") as AnyRecord[];
          roles.push({ id: crypto.randomUUID(), user_id: currentSession.user.id, role: "admin", created_at: new Date().toISOString() });
          return { data: true, error: null };
        }
        return { data: false, error: null };
      }
      return { data: null, error: null };
    },
  };
}

// ────────────────────────────────────────────────────────────
// PUBLIC API
// ────────────────────────────────────────────────────────────
export function isMockBackendEnabled() {
  if (typeof window !== "undefined") return import.meta.env.VITE_USE_MOCK_BACKEND === "true";
  return process.env.VITE_USE_MOCK_BACKEND === "true";
}

export function createMockSupabaseClient() {
  return {
    auth: buildAuthClient(),
    ...buildRpcClient(),
    from(table: string) { return new MockQueryBuilder(table); },
  } as unknown as Database & {
    auth: ReturnType<typeof buildAuthClient>;
    from: (table: string) => MockQueryBuilder;
    rpc: (name: string, params?: AnyRecord) => Promise<{ data: unknown; error: null | { message: string } }>;
  };
}

export function getDemoUser() {
  return currentSession?.user ?? null;
}
