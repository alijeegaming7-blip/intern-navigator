import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function randomCode() {
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 14)
    .toUpperCase();
}

async function assertAdmin(supabase: SupabaseClient<Database>, userId: string) {
  const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!isAdmin) throw new Error("Only admins can perform this action");
}

export const createAdminInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        role: z.enum(["admin", "mentor"]).default("admin"),
        expires_in_days: z.number().int().min(1).max(365).default(30),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const code = randomCode();
    const expiresAt = new Date(Date.now() + data.expires_in_days * 86400_000).toISOString();
    const { error } = await supabase
      .from("admin_invites")
      .insert({ code, role: data.role, created_by: userId, expires_at: expiresAt });
    if (error) throw new Error(error.message);
    return { code, expires_at: expiresAt };
  });

export const revokeInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { error } = await supabase.from("admin_invites").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const extendInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({ id: z.string().uuid(), expires_in_days: z.number().int().min(1).max(365) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const expiresAt = new Date(Date.now() + data.expires_in_days * 86400_000).toISOString();
    const { error } = await supabase
      .from("admin_invites")
      .update({ expires_at: expiresAt })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { expires_at: expiresAt };
  });

export const redeemInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ code: z.string().min(4).max(64) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row, error } = await supabase.rpc("redeem_admin_invite", {
      _code: data.code.trim().toUpperCase(),
    });
    if (error) throw new Error(error.message);
    const role = Array.isArray(row) && row.length > 0 ? (row[0] as { role: string }).role : "admin";
    return { role };
  });

export const bootstrapFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase.rpc("bootstrap_first_admin");
    if (error) throw new Error(error.message);
    return { promoted: Boolean(data) };
  });

export const listInvites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { data, error } = await supabase
      .from("admin_invites")
      .select("id, code, role, used_by, used_at, expires_at, created_at, created_by")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    // enrich with emails for created_by / used_by
    const ids = new Set<string>();
    type InviteRow = { created_by?: string | null; used_by?: string | null };
    (data ?? []).forEach((r: InviteRow) => {
      if (r.created_by) ids.add(r.created_by);
      if (r.used_by) ids.add(r.used_by);
    });
    let profiles: Record<string, { full_name: string; email: string }> = {};
    if (ids.size > 0) {
      const { data: p } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", Array.from(ids));
      type ProfileRow = { id: string; full_name?: string; email?: string };
      profiles = Object.fromEntries((p ?? []).map((x: ProfileRow) => [x.id, x]));
    }
    type InviteFull = {
      id: string;
      code?: string;
      role?: string;
      used_by?: string | null;
      used_at?: string | null;
      expires_at?: string | null;
      created_at?: string | null;
      created_by?: string | null;
    };
    return (data ?? []).map((r: InviteFull) => ({
      ...r,
      created_by_profile: r.created_by ? (profiles[r.created_by] ?? null) : null,
      used_by_profile: r.used_by ? (profiles[r.used_by] ?? null) : null,
    }));
  });
