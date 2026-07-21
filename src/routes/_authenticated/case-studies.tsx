import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/case-studies")({
  head: () => ({ meta: [{ title: "Case Studies — EEF" }, { name: "robots", content: "noindex" }] }),
  component: CaseStudies,
});

type CS = {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  difficulty: number;
  tech_stack: string[];
  estimated_hours: number;
};

function CaseStudies() {
  const [items, setItems] = useState<CS[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<string>("All");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: cs }, { data: c }] = await Promise.all([
      supabase.from("case_studies").select("*").order("code"),
      supabase.from("completed_case_studies").select("case_study_id"),
    ]);
    setItems((cs ?? []) as CS[]);
    setCompletedIds(new Set((c ?? []).map((r) => r.case_study_id as string)));
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const markDone = async (id: string) => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return toast.error("Not signed in");
    const { error } = await supabase
      .from("completed_case_studies")
      .insert({ case_study_id: id, user_id: u.user.id });
    if (error) return toast.error(error.message);
    toast.success("Marked as completed — regenerate your roadmap to see new goals");
    load();
  };

  const categories = ["All", ...Array.from(new Set(items.map((i) => i.category)))];
  const filtered = filter === "All" ? items : items.filter((i) => i.category === filter);

  if (loading)
    return (
      <div className="p-8 grid place-items-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-6">
      <header>
        <p className="mono text-[11px] text-primary tracking-widest">CASE STUDIES · CATALOG</p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight">
          Ship <span className="gradient-text">real work.</span>
        </h1>
      </header>

      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`mono text-xs px-3 py-1.5 rounded-md border transition ${
              filter === c
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card/40 text-muted-foreground hover:text-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((cs) => {
          const done = completedIds.has(cs.id);
          return (
            <div key={cs.id} className="surface-panel p-5 flex flex-col">
              <div className="flex items-center justify-between">
                <span className="mono text-[11px] text-accent">{cs.code}</span>
                <span className="mono text-[11px] text-muted-foreground">
                  DIFF {"★".repeat(cs.difficulty)}
                </span>
              </div>
              <h3 className="mt-2 text-lg font-semibold">{cs.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground flex-1">{cs.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {cs.tech_stack.slice(0, 4).map((t) => (
                  <span
                    key={t}
                    className="mono text-[10px] px-2 py-0.5 rounded border border-border text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> ~{cs.estimated_hours}h
                </span>
                {done ? (
                  <span className="text-success flex items-center gap-1 mono">
                    <CheckCircle2 className="h-4 w-4" /> DONE
                  </span>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => markDone(cs.id)}>
                    Mark complete
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
