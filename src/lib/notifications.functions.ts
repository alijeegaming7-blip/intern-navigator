import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type WeeklyGoal = { week?: number; title?: string; description?: string };

/**
 * scanNotifications — inspects the caller's roadmap and reviews and
 * inserts notifications for stale roadmaps, overdue weekly goals, and
 * missing mentor reviews. Deduped via `dedupe_key`.
 */
export const scanNotifications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: prof } = await supabase
      .from("profiles")
      .select("notification_prefs")
      .eq("id", userId)
      .maybeSingle();
    const prefs = (prof?.notification_prefs ?? {}) as Record<string, boolean>;
    const wants = (kind: string) => prefs[kind] !== false; // default on

    const [roadmapRes, reviewRes, profileRes] = await Promise.all([
      supabase
        .from("roadmaps")
        .select("weekly_goals, generated_at, promotion_readiness")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("mentor_reviews")
        .select("review_date")
        .eq("intern_id", userId)
        .order("review_date", { ascending: false })
        .limit(1),
      supabase.from("profiles").select("joined_at").eq("id", userId).maybeSingle(),
    ]);

    const now = new Date();
    const toInsert: Array<{
      user_id: string;
      kind: string;
      title: string;
      message: string;
      severity: string;
      link?: string;
      dedupe_key: string;
    }> = [];

    const roadmap = roadmapRes.data;
    if (!roadmap) {
      toInsert.push({
        user_id: userId,
        kind: "roadmap_missing",
        title: "Generate your first roadmap",
        message: "You haven't generated a roadmap yet. Head to your dashboard and click Generate.",
        severity: "info",
        link: "/dashboard",
        dedupe_key: "roadmap_missing",
      });
    } else {
      const generated = new Date(roadmap.generated_at ?? now);
      const daysSince = Math.floor((now.getTime() - generated.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSince >= 14) {
        toInsert.push({
          user_id: userId,
          kind: "roadmap_stale",
          title: "Your roadmap is stale",
          message: `It's been ${daysSince} days since your last roadmap. Regenerate to get fresh goals.`,
          severity: "warn",
          link: "/roadmap",
          dedupe_key: `roadmap_stale_${Math.floor(daysSince / 7)}w`,
        });
      }

      // Weekly-goal reminders — treat "week N" as starting N-1 weeks after generation
      const goals = (roadmap.weekly_goals ?? []) as WeeklyGoal[];
      goals.forEach((g) => {
        const wk = Number(g.week ?? 0);
        if (!wk) return;
        const goalStart = new Date(generated);
        goalStart.setDate(goalStart.getDate() + (wk - 1) * 7);
        const goalEnd = new Date(goalStart);
        goalEnd.setDate(goalEnd.getDate() + 7);
        const dueSoon = now >= goalStart && now < goalEnd;
        const overdue = now >= goalEnd && daysSince < wk * 7 + 21;
        if (dueSoon) {
          toInsert.push({
            user_id: userId,
            kind: "goal_due",
            title: `Week ${wk} goal in progress`,
            message: g.title ?? "Weekly goal is active this week.",
            severity: "info",
            link: "/roadmap",
            dedupe_key: `goal_due_${roadmap.generated_at}_w${wk}`,
          });
        } else if (overdue) {
          toInsert.push({
            user_id: userId,
            kind: "goal_overdue",
            title: `Week ${wk} goal overdue`,
            message: `"${g.title ?? "Weekly goal"}" was due ${Math.floor((now.getTime() - goalEnd.getTime()) / 86400000)} days ago.`,
            severity: "warn",
            link: "/roadmap",
            dedupe_key: `goal_overdue_${roadmap.generated_at}_w${wk}`,
          });
        }
      });
    }

    // Mentor review cadence — expect at least one per 21 days
    const lastReview = reviewRes.data?.[0]?.review_date;
    const joined = profileRes.data?.joined_at;
    if (joined) {
      const anchor = lastReview ? new Date(lastReview) : new Date(joined);
      const daysSinceReview = Math.floor((now.getTime() - anchor.getTime()) / 86400000);
      if (daysSinceReview >= 21) {
        toInsert.push({
          user_id: userId,
          kind: "review_overdue",
          title: "Mentor review overdue",
          message: `It's been ${daysSinceReview} days since your last review. Ping your mentor.`,
          severity: "warn",
          link: "/profile",
          dedupe_key: `review_overdue_${Math.floor(daysSinceReview / 14)}`,
        });
      } else if (daysSinceReview >= 14) {
        toInsert.push({
          user_id: userId,
          kind: "review_due_soon",
          title: "Mentor review due soon",
          message: "Your next mentor review is coming up this week.",
          severity: "info",
          link: "/profile",
          dedupe_key: `review_due_${Math.floor(daysSinceReview / 7)}w`,
        });
      }
    }

    let inserted = 0;
    const filtered = toInsert.filter((n) => wants(n.kind));
    for (const n of filtered) {
      const { error } = await supabase.from("notifications").insert(n).select().maybeSingle();
      if (!error) inserted++;
    }

    return { scanned: filtered.length, inserted };
  });
