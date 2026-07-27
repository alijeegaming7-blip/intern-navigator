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

    // 2. Call Google Gemini API directly (with fallback)
    const apiKey = process.env.GEMINI_API_KEY;
    
    let parsed: Record<string, unknown>;
    
    if (!apiKey) {
      // Fallback: Generate roadmap based on skills without AI
      console.warn("GEMINI_API_KEY not configured - using fallback roadmap generation");
      parsed = generateFallbackRoadmap(signalPayload);
    } else {
      // Use Gemini API
      const model = "gemini-2.0-flash-exp";
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
      try {
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text:
                        systemPrompt +
                        "\n\nGenerate a personalized roadmap for this intern. Signals:\n" +
                        JSON.stringify(signalPayload, null, 2),
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 8192,
                responseMimeType: "application/json",
              },
            }),
          },
        );

        if (!resp.ok) {
          const text = await resp.text();
          if (resp.status === 429) {
            console.warn("Gemini API rate limited - using fallback");
            parsed = generateFallbackRoadmap(signalPayload);
          } else {
            console.error(`Gemini API error (${resp.status}): ${text.slice(0, 300)}`);
            parsed = generateFallbackRoadmap(signalPayload);
          }
        } else {
          const aiJson = await resp.json();
          const durationMs = Date.now() - startedAt;
          const content = aiJson.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!content) {
            console.warn("AI returned no content - using fallback");
            parsed = generateFallbackRoadmap(signalPayload);
          } else {
            try {
              parsed = JSON.parse(content);
            } catch {
              console.warn("AI returned malformed JSON - using fallback");
              parsed = generateFallbackRoadmap(signalPayload);
            }
          }
        }
      } catch (error) {
        console.error("Gemini API call failed:", error);
        parsed = generateFallbackRoadmap(signalPayload);
      }
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateFallbackRoadmap(signals: any): Record<string, unknown> {
  const { profile, skills, available_case_studies, completed_case_studies } = signals;
  
  // Analyze skills
  const strongSkills = skills.filter((s: { proficiency: number }) => s.proficiency >= 4).map((s: { name: string }) => s.name);
  const weakSkills = skills.filter((s: { proficiency: number }) => s.proficiency <= 2).map((s: { name: string }) => s.name);
  const missingSkills = ["Git", "Docker", "CI/CD", "Testing", "API Design"].filter(
    (s) => !skills.some((sk: { name: string }) => sk.name.toLowerCase() === s.toLowerCase())
  );
  
  // Determine current level and next target
  const completedCount = completed_case_studies?.length || 0;
  const avgProficiency = skills.length > 0 ? skills.reduce((sum: number, s: { proficiency: number }) => sum + s.proficiency, 0) / skills.length : 1;
  
  let currentLevel = "L1 Explorer";
  let nextTarget = "L2 Builder";
  let estimatedWeeks = 12;
  
  if (completedCount >= 10 && avgProficiency >= 4) {
    currentLevel = "L4 Senior Engineer";
    nextTarget = "L5 Tech Lead";
    estimatedWeeks = 8;
  } else if (completedCount >= 6 && avgProficiency >= 3.5) {
    currentLevel = "L3 Engineer";
    nextTarget = "L4 Senior Engineer";
    estimatedWeeks = 10;
  } else if (completedCount >= 3 && avgProficiency >= 2.5) {
    currentLevel = "L2 Builder";
    nextTarget = "L3 Engineer";
    estimatedWeeks = 12;
  } else if (completedCount >= 1) {
    currentLevel = "L1 Explorer";
    nextTarget = "L2 Builder";
    estimatedWeeks = 16;
  }
  
  // Generate weekly goals based on weak skills and target
  const weeklyGoals = [];
  for (let week = 1; week <= 4; week++) {
    if (week === 1 && weakSkills.length > 0) {
      weeklyGoals.push({
        week,
        title: `Strengthen ${weakSkills[0] || "Core Skills"}`,
        description: `Focus on improving ${weakSkills.slice(0, 2).join(" and ")} through practice and case studies.`
      });
    } else if (week === 2 && missingSkills.length > 0) {
      weeklyGoals.push({
        week,
        title: `Learn ${missingSkills[0]}`,
        description: `Start learning ${missingSkills[0]} fundamentals and integrate it into your workflow.`
      });
    } else if (week === 3) {
      weeklyGoals.push({
        week,
        title: "Build a Complete Project",
        description: "Apply your skills to build an end-to-end project showcasing your capabilities."
      });
    } else {
      weeklyGoals.push({
        week,
        title: "Code Review and Optimization",
        description: "Review previous work, optimize code quality, and incorporate mentor feedback."
      });
    }
  }
  
  // Generate monthly goals
  const monthlyGoals = [
    {
      month: 1,
      title: "Master Foundational Skills",
      description: `Complete 3-4 case studies focusing on ${weakSkills.slice(0, 2).join(", ")} and core engineering principles.`
    },
    {
      month: 2,
      title: "Build Portfolio Projects",
      description: "Create 2 substantial projects that demonstrate your technical abilities and problem-solving skills."
    },
    {
      month: 3,
      title: `Achieve ${nextTarget} Level`,
      description: `Reach ${nextTarget} by mastering advanced concepts and consistently delivering quality work.`
    }
  ];
  
  // Recommend case studies based on skill gaps
  const recommendedCaseStudies = available_case_studies
    .filter((cs: { difficulty: string }) => {
      if (currentLevel === "L1 Explorer") return cs.difficulty === "beginner";
      if (currentLevel === "L2 Builder") return ["beginner", "intermediate"].includes(cs.difficulty);
      return true;
    })
    .slice(0, 5)
    .map((cs: { code: string; title: string; category: string }) => ({
      code: cs.code,
      title: cs.title,
      reason: `Recommended to strengthen your ${cs.category} skills`
    }));
  
  // Technology dependencies based on target role
  const techDependencies = ["JavaScript/TypeScript", "React", "Node.js", "SQL/Database", "Git", "RESTful APIs"];
  
  // Calculate readiness scores
  const promotionReadiness = Math.min(100, Math.round((completedCount * 10) + (avgProficiency * 15)));
  const jobReadiness = Math.min(100, Math.round((completedCount * 8) + (avgProficiency * 12) + (strongSkills.length * 5)));
  
  return {
    current_level: profile.current_level || currentLevel,
    next_target: profile.target_role || nextTarget,
    weekly_goals: weeklyGoals,
    monthly_goals: monthlyGoals,
    recommended_case_studies: recommendedCaseStudies,
    missing_skills: missingSkills,
    strong_skills: strongSkills,
    weak_skills: weakSkills,
    technology_dependencies: techDependencies,
    promotion_readiness: promotionReadiness,
    job_readiness: jobReadiness,
    estimated_graduation_weeks: estimatedWeeks,
    ai_summary: `Based on your current skills and ${completedCount} completed case studies, you're on track to reach ${nextTarget} in approximately ${estimatedWeeks} weeks. Focus on strengthening ${weakSkills.slice(0, 2).join(" and ")} while building your portfolio projects.`
  };
}

