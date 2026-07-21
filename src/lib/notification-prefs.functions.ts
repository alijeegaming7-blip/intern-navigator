import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const DEFAULT_PREFS = {
  roadmap_missing: true,
  roadmap_stale: true,
  goal_due: true,
  goal_overdue: true,
  review_due_soon: true,
  review_overdue: true,
  email_enabled: false,
  digest_frequency_hours: 1,
};

export type NotificationPrefs = typeof DEFAULT_PREFS;

const prefsSchema = z.object({
  roadmap_missing: z.boolean(),
  roadmap_stale: z.boolean(),
  goal_due: z.boolean(),
  goal_overdue: z.boolean(),
  review_due_soon: z.boolean(),
  review_overdue: z.boolean(),
  email_enabled: z.boolean(),
  digest_frequency_hours: z.number().int().min(1).max(168),
});

export const getNotificationPrefs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("notification_prefs, last_email_digest_at, email")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return {
      prefs: {
        ...DEFAULT_PREFS,
        ...((data?.notification_prefs as object) ?? {}),
      } as NotificationPrefs,
      last_email_digest_at: data?.last_email_digest_at ?? null,
      email: data?.email ?? null,
    };
  });

export const updateNotificationPrefs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => prefsSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update({ notification_prefs: data as never })
      .eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
