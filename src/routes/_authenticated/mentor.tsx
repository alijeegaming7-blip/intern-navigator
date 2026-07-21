import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { generateRoadmap } from "@/lib/roadmap.functions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Sparkles, Star } from "lucide-react";

export const Route = createFileRoute("/_authenticated/mentor")({
  head: () => ({
    meta: [{ title: "Mentor Console — EEF" }, { name: "robots", content: "noindex" }],
  }),
  component: MentorPage,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Intern = any;

function MentorPage() {
  const [interns, setInterns] = useState<Intern[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [roadmaps, setRoadmaps] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [regenId, setRegenId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Intern | null>(null);
  const [rating, setRating] = useState(4);
  const [feedback, setFeedback] = useState("");
  const genFn = useServerFn(generateRoadmap);

  const load = async () => {
    setLoading(true);
    // Fetch all intern profiles (RLS lets mentors/admins read all)
    const { data: internRows } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "intern");
    const ids = (internRows ?? []).map((r) => r.user_id as string);
    if (ids.length === 0) {
      setInterns([]);
      setRoadmaps({});
      setLoading(false);
      return;
    }
    const [{ data: profiles }, { data: rms }] = await Promise.all([
      supabase.from("profiles").select("*").in("id", ids),
      supabase.from("roadmaps").select("*").in("user_id", ids),
    ]);
    setInterns(profiles ?? []);
    const rMap: Record<string, unknown> = {};
    (rms ?? []).forEach((r) => (rMap[r.user_id as string] = r));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setRoadmaps(rMap as any);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const regenerate = async (userId: string) => {
    setRegenId(userId);
    try {
      await genFn({ data: { targetUserId: userId, trigger: "mentor" } });
      toast.success("Roadmap regenerated for intern");
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRegenId(null);
    }
  };

  const submitReview = async () => {
    if (!selected) return;
    if (feedback.trim().length < 5) return toast.error("Feedback is too short");
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return toast.error("Not signed in");
    const { error } = await supabase.from("mentor_reviews").insert({
      intern_id: selected.id,
      mentor_id: u.user.id,
      rating,
      feedback: feedback.trim().slice(0, 1000),
    });
    if (error) return toast.error(error.message);
    toast.success("Review submitted");
    setSelected(null);
    setFeedback("");
    setRating(4);
  };

  if (loading)
    return (
      <div className="p-8 grid place-items-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8">
      <header>
        <p className="mono text-[11px] text-primary tracking-widest">MENTOR CONSOLE</p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight">
          Your <span className="gradient-text">interns</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {interns.length} intern{interns.length === 1 ? "" : "s"} in the system.
        </p>
      </header>

      <div className="grid gap-4">
        {interns.map((it) => {
          const rm = roadmaps[it.id];
          return (
            <div key={it.id} className="surface-panel p-5">
              <div className="flex flex-wrap items-start gap-6 justify-between">
                <div className="flex-1 min-w-[240px]">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <h3 className="text-lg font-semibold">{it.full_name}</h3>
                    <span className="mono text-[10px] text-muted-foreground">
                      {it.current_level}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {it.email} · target: {it.target_role}
                  </p>
                  {rm && (
                    <div className="mt-3 grid gap-3 md:grid-cols-3 text-xs">
                      <StatMini label="Promotion" value={`${rm.promotion_readiness}%`} />
                      <StatMini label="Job ready" value={`${rm.job_readiness}%`} />
                      <StatMini label="Est. grad" value={rm.estimated_graduation_date ?? "—"} />
                    </div>
                  )}
                  {rm?.recommended_case_studies?.[0] && (
                    <div className="mt-3 rounded-md border border-accent/30 bg-accent/5 p-3">
                      <p className="mono text-[10px] text-accent tracking-widest">
                        AI-SUGGESTED NEXT PROJECT
                      </p>
                      <p className="text-sm font-medium mt-1">
                        {rm.recommended_case_studies[0].code} —{" "}
                        {rm.recommended_case_studies[0].title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {rm.recommended_case_studies[0].reason}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button size="sm" onClick={() => regenerate(it.id)} disabled={regenId === it.id}>
                    {regenId === it.id ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-3 w-3" />
                    )}
                    Regenerate
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSelected(it)}>
                    <Star className="mr-2 h-3 w-3" /> Review
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
        {interns.length === 0 && (
          <p className="text-sm text-muted-foreground">No interns registered yet.</p>
        )}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm p-4"
          onClick={() => setSelected(null)}
        >
          <div className="surface-panel p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Review {selected.full_name}</h3>
            <div className="mt-4">
              <label className="text-xs mono tracking-wider text-muted-foreground">RATING</label>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setRating(n)}>
                    <Star
                      className={`h-6 w-6 ${n <= rating ? "fill-primary text-primary" : "text-muted-foreground"}`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <label className="text-xs mono tracking-wider text-muted-foreground">FEEDBACK</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                maxLength={1000}
                className="mt-2 w-full rounded-md border border-input bg-background p-3 text-sm"
                placeholder="Concrete, actionable feedback."
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setSelected(null)}>
                Cancel
              </Button>
              <Button onClick={submitReview}>Submit</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card/40 p-2">
      <div className="mono text-[10px] text-muted-foreground tracking-widest">
        {label.toUpperCase()}
      </div>
      <div className="text-sm font-semibold mt-0.5">{value}</div>
    </div>
  );
}
