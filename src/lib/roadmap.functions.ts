import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * generateRoadmap — the core EEF AI engine.
 * Pulls every signal we have for the intern, asks our AI gateway to produce a
 * personalized roadmap as JSON, then upserts it into the roadmaps table.
 */
export const generateRoadmap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        targetUserId: z.string().uuid().optional(),
        trigger: z.string().max(80).optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // If a mentor/admin is regenerating for a different intern, verify role.
    const forUser = data.targetUserId && data.targetUserId !== userId ? data.targetUserId : userId;
    if (forUser !== userId) {
      const { data: canElevate } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .in("role", ["mentor", "admin"]);
      if (!canElevate || canElevate.length === 0) {
        throw new Error("Forbidden: only mentors or admins can regenerate for another intern");
      }
    }

    // 1. Gather signals
    const [profileRes, skillsRes, allSkillsRes, completedRes, allCsRes, reviewsRes, eventsRes] =
      await Promise.all([
        supabase.from("profiles").select("*").eq("id", forUser).maybeSingle(),
        supabase
          .from("intern_skills")
          .select("proficiency, verified, skills(name, category)")
          .eq("user_id", forUser),
        supabase.from("skills").select("name, category"),
        supabase
          .from("completed_case_studies")
          .select("mentor_rating, notes, case_studies(code, title, category, difficulty)")
          .eq("user_id", forUser),
        supabase.from("case_studies").select("code, title, category, difficulty, tech_stack"),
        supabase
          .from("mentor_reviews")
          .select("rating, feedback, review_date")
          .eq("intern_id", forUser)
          .order("review_date", { ascending: false })
          .limit(10),
        supabase
          .from("activity_events")
          .select("event_type, payload, created_at")
          .eq("user_id", forUser)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

    const profile = profileRes.data;
    if (!profile) throw new Error("Profile not found");

    const skills =
      skillsRes.data?.map((s) => ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        name: (s.skills as any)?.name,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        category: (s.skills as any)?.category,
        proficiency: s.proficiency,
        verified: s.verified,
      })) ?? [];

    const completed =
      completedRes.data?.map((c) => ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        code: (c.case_studies as any)?.code,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        title: (c.case_studies as any)?.title,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        difficulty: (c.case_studies as any)?.difficulty,
        rating: c.mentor_rating,
      })) ?? [];

    const availableCs =
      allCsRes.data?.filter((cs) => !completed.some((c) => c.code === cs.code)) ?? [];

    const signalPayload = {
      profile: {
        name: profile.full_name,
        current_level: profile.current_level,
        target_role: profile.target_role,
        github: profile.github_username,
        attendance: profile.attendance_score,
        coding_speed: profile.coding_speed,
        credits: profile.engineering_credits,
        joined_at: profile.joined_at,
      },
      skills,
      catalog_skills: allSkillsRes.data ?? [],
      completed_case_studies: completed,
      available_case_studies: availableCs,
      mentor_reviews: reviewsRes.data ?? [],
      recent_events: eventsRes.data ?? [],
      regeneration_trigger: data.trigger ?? "manual",
    };

    // 2. Call Lovable AI Gateway
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const model = "google/gemini-2.5-flash";
    const systemPrompt = `You are EEF, Ezitech Engineering Framework's roadmap engine.
Given an intern's signals, produce a highly personalized engineering learning roadmap.
Respond with STRICT JSON only, matching this schema:
{
  "current_level": string,
  "next_target": string,
  "weekly_goals": [ { "week": number, "title": string, "description": string } ],
  "monthly_goals": [ { "month": number, "title": string, "description": string } ],
  "recommended_case_studies": [ { "code": string, "title": string, "reason": string } ],
  "missing_skills": string[],
  "strong_skills": string[],
  "weak_skills": string[],
  "technology_dependencies": string[],
  "promotion_readiness": number,
  "job_readiness": number,
  "estimated_graduation_weeks": number,
  "ai_summary": string
}
Rules:
- Recommend ONLY case study codes from available_case_studies.
- Weekly goals must build on completed work and address weak_skills.
- Be specific and technical, no generic advice.
- Levels: L1 Explorer, L2 Builder, L3 Engineer, L4 Senior Engineer, L5 Tech Lead.`;

    const startedAt = Date.now();
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content:
              "Generate a personalized roadmap for this intern. Signals:\n" +
              JSON.stringify(signalPayload, null, 2),
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      if (resp.status === 429) throw new Error("AI rate limit reached — try again in a moment.");
      if (resp.status === 402)
        throw new Error("AI credits exhausted — add credits in the workspace billing settings.");
      throw new Error(`AI gateway error (${resp.status}): ${text.slice(0, 300)}`);
    }

    const aiJson = await resp.json();
    const durationMs = Date.now() - startedAt;
    const content = aiJson.choices?.[0]?.message?.content;
    if (!content) throw new Error("AI returned no content");

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("AI returned malformed JSON");
    }

    const weeks = Math.max(1, Math.min(52, Number(parsed.estimated_graduation_weeks ?? 12)));
    const grad = new Date();
    grad.setDate(grad.getDate() + weeks * 7);
    const gradIso = grad.toISOString().slice(0, 10);

    const promotion = clampInt(parsed.promotion_readiness, 0, 100, 0);
    const jobR = clampInt(parsed.job_readiness, 0, 100, 0);

    const row = {
      user_id: forUser,
      current_level: String(parsed.current_level ?? profile.current_level),
      next_target: String(parsed.next_target ?? ""),
      weekly_goals: (parsed.weekly_goals ?? []) as never,
      monthly_goals: (parsed.monthly_goals ?? []) as never,
      recommended_case_studies: (parsed.recommended_case_studies ?? []) as never,
      missing_skills: (parsed.missing_skills ?? []) as never,
      strong_skills: (parsed.strong_skills ?? []) as never,
      weak_skills: (parsed.weak_skills ?? []) as never,
      technology_dependencies: (parsed.technology_dependencies ?? []) as never,
      promotion_readiness: promotion,
      job_readiness: jobR,
      estimated_graduation_date: gradIso,
      ai_summary: String(parsed.ai_summary ?? ""),
      generated_at: new Date().toISOString(),
    };

    const { error: upErr } = await supabase.from("roadmaps").upsert(row, { onConflict: "user_id" });
    if (upErr) throw new Error("Failed to save roadmap: " + upErr.message);

    await supabase.from("profiles").update({ current_level: row.current_level }).eq("id", forUser);

    await supabase.from("activity_events").insert({
      user_id: forUser,
      event_type: "roadmap_generated",
      payload: { trigger: data.trigger ?? "manual", by: userId } as never,
    });

    // Audit log — captures inputs, scores, model, latency
    const inputSummary = {
      skills_count: skills.length,
      completed_count: completed.length,
      available_case_studies: availableCs.length,
      reviews_count: reviewsRes.data?.length ?? 0,
      recent_events: eventsRes.data?.length ?? 0,
      attendance: profile.attendance_score,
      coding_speed: profile.coding_speed,
      credits: profile.engineering_credits,
      target_role: profile.target_role,
      trigger: data.trigger ?? "manual",
    };
    const scores = {
      promotion_readiness: promotion,
      job_readiness: jobR,
      estimated_graduation_weeks: weeks,
      current_level: row.current_level,
      next_target: row.next_target,
      weekly_goals: Array.isArray(parsed.weekly_goals)
        ? (parsed.weekly_goals as unknown[]).length
        : 0,
      missing_skills: Array.isArray(parsed.missing_skills)
        ? (parsed.missing_skills as unknown[]).length
        : 0,
    };
    await supabase.from("roadmap_generations").insert({
      user_id: forUser,
      triggered_by: userId,
      model,
      duration_ms: durationMs,
      inputs: inputSummary as never,
      scores: scores as never,
      summary: row.ai_summary,
    });

    return { ok: true, roadmap: row };
  });

function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}
