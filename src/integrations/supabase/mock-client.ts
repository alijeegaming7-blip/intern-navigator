import type { Database } from "./types";

type AnyRecord = Record<string, unknown>;

type Listener = (event: string, session: Session | null) => void;

type Session = {
  access_token: string;
  user: {
    id: string;
    email: string;
    user_metadata?: AnyRecord;
    app_metadata?: AnyRecord;
  };
};

const store: Record<string, AnyRecord[]> = {
  profiles: [
    {
      id: "demo-intern-001",
      full_name: "Demo Intern",
      email: "intern@ezitech.dev",
      current_level: "L2 Builder",
      target_role: "Frontend Engineer",
      github_username: "demo-dev",
      attendance_score: 96,
      coding_speed: 72,
      engineering_credits: 18,
      joined_at: "2026-01-10T00:00:00.000Z",
      notification_prefs: {},
      last_email_digest_at: null,
    },
  ],
  user_roles: [
    { user_id: "demo-intern-001", role: "intern" },
    { user_id: "demo-admin-001", role: "admin" },
  ],
  roadmaps: [],
  notifications: [],
  mentor_reviews: [],
  activity_events: [],
  skills: [
    { id: "skill-001", name: "React", category: "frontend" },
    { id: "skill-002", name: "TypeScript", category: "frontend" },
    { id: "skill-003", name: "SQL", category: "backend" },
  ],
  intern_skills: [
    { user_id: "demo-intern-001", skill_id: "skill-001", proficiency: 3, verified: true },
    { user_id: "demo-intern-001", skill_id: "skill-002", proficiency: 4, verified: true },
  ],
  case_studies: [
    {
      id: "cs-001",
      code: "CS-001",
      title: "Build a dashboard",
      category: "frontend",
      difficulty: "medium",
    },
    {
      id: "cs-002",
      code: "CS-002",
      title: "Ship a realtime API",
      category: "backend",
      difficulty: "hard",
    },
  ],
  completed_case_studies: [],
  admin_invites: [],
  roadmaps: [],
  roadmap_generations: [],
};

let currentSession: Session | null = null;
const authListeners = new Set<Listener>();

function emit(event: string, session: Session | null) {
  authListeners.forEach((listener) => listener(event, session));
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function getOrCreateTable(table: string) {
  if (!store[table]) store[table] = [];
  return store[table];
}

function buildUser(email: string, metadata?: AnyRecord) {
  const id = email.includes("admin") ? "demo-admin-001" : "demo-intern-001";
  const fullName =
    (metadata?.full_name as string | undefined) ?? email.split("@")[0].replace(/[._-]/g, " ");
  return {
    id,
    email,
    user_metadata: { full_name: fullName, ...metadata },
    app_metadata: { provider: "mock" },
  };
}

function ensureProfileForUser(user: { id: string; email: string; user_metadata?: AnyRecord }) {
  const existing = (getOrCreateTable("profiles") as AnyRecord[]).find((row) => row.id === user.id);
  if (existing) {
    if (user.email && !existing.email) existing.email = user.email;
    if (user.user_metadata?.full_name && !existing.full_name)
      existing.full_name = user.user_metadata.full_name;
    return existing;
  }

  const profile = {
    id: user.id,
    full_name: (user.user_metadata?.full_name as string | undefined) ?? user.email.split("@")[0],
    email: user.email,
    current_level: "L2 Builder",
    target_role: "Software Engineer",
    github_username: null,
    attendance_score: 92,
    coding_speed: 70,
    engineering_credits: 10,
    joined_at: new Date().toISOString(),
    notification_prefs: {},
    last_email_digest_at: null,
  };
  (getOrCreateTable("profiles") as AnyRecord[]).push(profile);
  const rolesTable = getOrCreateTable("user_roles") as AnyRecord[];
  if (
    !rolesTable.some(
      (row) =>
        row.user_id === user.id && row.role === (user.email.includes("admin") ? "admin" : "intern"),
    )
  ) {
    rolesTable.push({ user_id: user.id, role: user.email.includes("admin") ? "admin" : "intern" });
  }
  return profile;
}

function applyFilters(
  rows: AnyRecord[],
  filters: Array<{ type: string; column: string; value?: unknown; values?: unknown[] }>,
) {
  return rows.filter((row) => {
    return filters.every((filter) => {
      const rowValue = row[filter.column];
      switch (filter.type) {
        case "eq":
          return rowValue === filter.value;
        case "in":
          return Array.isArray(filter.values) && filter.values.includes(rowValue);
        case "is":
          return rowValue === filter.value;
        default:
          return true;
      }
    });
  });
}

class MockQueryBuilder {
  constructor(
    private table: string,
    private rows: AnyRecord[] = [],
  ) {}

  private filters: Array<{ type: string; column: string; value?: unknown; values?: unknown[] }> =
    [];
  private sort?: { column: string; ascending: boolean };
  private limitCount?: number;

  select(_columns?: string | unknown, _options?: unknown) {
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ type: "eq", column, value });
    return this;
  }

  in(column: string, values: unknown[]) {
    this.filters.push({ type: "in", column, values });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.sort = { column, ascending: options?.ascending ?? true };
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  is(column: string, value: unknown) {
    this.filters.push({ type: "is", column, value });
    return this;
  }

  maybeSingle() {
    const rows = this.execute();
    return Promise.resolve({ data: rows[0] ?? null, error: null });
  }

  single() {
    const rows = this.execute();
    if (rows.length > 0) {
      return Promise.resolve({ data: rows[0], error: null });
    }
    return Promise.resolve({ data: null, error: { message: "No rows found" } });
  }

  delete() {
    const rows = this.execute();
    const table = getOrCreateTable(this.table);
    const remaining = table.filter((row) => !rows.some((candidate) => candidate === row));
    store[this.table] = remaining;
    return Promise.resolve({ data: rows, error: null });
  }

  update(values: AnyRecord) {
    const rows = this.execute();
    const table = getOrCreateTable(this.table);
    rows.forEach((row) => Object.assign(row, values));
    store[this.table] = table;
    return this;
  }

  insert(values: AnyRecord | AnyRecord[]) {
    const table = getOrCreateTable(this.table);
    const rows = Array.isArray(values) ? values : [values];
    rows.forEach((row) => table.push(clone(row)));
    store[this.table] = table;
    return this;
  }

  upsert(values: AnyRecord | AnyRecord[], options?: { onConflict?: string }) {
    const table = getOrCreateTable(this.table);
    const rows = Array.isArray(values) ? values : [values];
    const conflictColumn = options?.onConflict ?? "id";
    rows.forEach((row) => {
      const existingIndex = table.findIndex((item) => item[conflictColumn] === row[conflictColumn]);
      if (existingIndex >= 0) {
        table[existingIndex] = { ...table[existingIndex], ...clone(row) };
      } else {
        table.push(clone(row));
      }
    });
    store[this.table] = table;
    return Promise.resolve({ data: rows, error: null });
  }

  private execute() {
    const table = getOrCreateTable(this.table) as AnyRecord[];
    let rows = clone(table) as AnyRecord[];

    if (this.filters.length > 0) {
      rows = applyFilters(rows, this.filters);
    }

    if (this.sort) {
      rows = rows.sort((a, b) => {
        const left = a[this.sort!.column];
        const right = b[this.sort!.column];
        if (left == null || right == null) return 0;
        const direction = this.sort!.ascending ? 1 : -1;
        return String(left).localeCompare(String(right)) * direction;
      });
    }

    if (this.limitCount != null) {
      rows = rows.slice(0, this.limitCount);
    }

    return rows;
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?: ((value: AnyRecord[]) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason?: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }

  catch(onrejected?: ((reason?: unknown) => unknown) | null) {
    return Promise.resolve(this.execute()).catch(onrejected);
  }

  finally(onfinally?: (() => void) | null) {
    return Promise.resolve(this.execute()).finally(onfinally);
  }
}

function buildAuthClient() {
  return {
    getSession: async () => {
      return { data: { session: currentSession } };
    },
    getUser: async () => {
      if (!currentSession) {
        return { data: { user: null }, error: null };
      }
      return { data: { user: currentSession.user }, error: null };
    },
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      if (!email || !password) {
        return {
          data: { session: null, user: null },
          error: { message: "Email and password are required" },
        };
      }
      const user = buildUser(email);
      ensureProfileForUser(user);
      currentSession = {
        access_token: `mock-token-${email}`,
        user,
      };
      emit("SIGNED_IN", currentSession);
      return { data: { session: currentSession, user }, error: null };
    },
    signUp: async ({
      email,
      password,
      options,
    }: {
      email: string;
      password: string;
      options?: { data?: AnyRecord };
    }) => {
      if (!email || !password) {
        return {
          data: { session: null, user: null },
          error: { message: "Email and password are required" },
        };
      }
      const user = buildUser(email, options?.data);
      ensureProfileForUser(user);
      currentSession = {
        access_token: `mock-token-${email}`,
        user,
      };
      emit("SIGNED_IN", currentSession);
      return { data: { session: currentSession, user }, error: null };
    },
    signOut: async () => {
      currentSession = null;
      emit("SIGNED_OUT", null);
      return { error: null };
    },
    onAuthStateChange: (callback: Listener) => {
      authListeners.add(callback);
      return { data: { subscription: { unsubscribe: () => authListeners.delete(callback) } } };
    },
  };
}

function buildRpcClient() {
  return {
    rpc: async (name: string, params?: AnyRecord) => {
      if (name === "has_role") {
        const userId = params?._user_id as string | undefined;
        const role = params?._role as string | undefined;
        const userRoles = (getOrCreateTable("user_roles") as AnyRecord[]).filter(
          (row) => row.user_id === userId,
        );
        return { data: userRoles.some((row) => row.role === role), error: null };
      }
      if (name === "redeem_admin_invite") {
        const code = String(params?._code ?? "")
          .trim()
          .toUpperCase();
        const invite = (getOrCreateTable("admin_invites") as AnyRecord[]).find(
          (row) => row.code === code,
        );
        if (!invite) {
          return { data: null, error: { message: "Invite not found" } };
        }
        return { data: [{ role: invite.role }], error: null };
      }
      if (name === "bootstrap_first_admin") {
        const profiles = getOrCreateTable("profiles") as AnyRecord[];
        if (profiles.length > 0) {
          return { data: true, error: null };
        }
        return { data: false, error: null };
      }
      return { data: null, error: null };
    },
  };
}

export function isMockBackendEnabled() {
  return typeof window !== "undefined"
    ? import.meta.env.VITE_USE_MOCK_BACKEND === "true"
    : process.env.VITE_USE_MOCK_BACKEND === "true";
}

export function createMockSupabaseClient() {
  const auth = buildAuthClient();
  const rpc = buildRpcClient();
  return {
    auth,
    ...rpc,
    from(table: string) {
      return new MockQueryBuilder(table);
    },
  } as unknown as Database & {
    auth: typeof buildAuthClient;
    from: (table: string) => MockQueryBuilder;
    rpc: (
      name: string,
      params?: AnyRecord,
    ) => Promise<{ data: unknown; error: null | { message: string } }>;
  };
}

export function getDemoUser() {
  return currentSession?.user ?? null;
}
