import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { generateRoadmap } from "@/lib/roadmap.functions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Map, Layers, FileDown } from "lucide-react";

export const Route = createFileRoute("/_authenticated/roadmap")({
  head: () => ({ meta: [{ title: "Roadmap — EEF" }, { name: "robots", content: "noindex" }] }),
  component: RoadmapPage,
});

function RoadmapPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [roadmap, setRoadmap] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const genFn = useServerFn(generateRoadmap);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("roadmaps").select("*").maybeSingle();
    setRoadmap(data);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const regenerate = async () => {
    setGenerating(true);
    try {
      await genFn({ data: { trigger: "roadmap_page" } });
      toast.success("Roadmap regenerated");
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  if (loading)
    return (
      <div className="p-8 grid place-items-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );

  if (!roadmap)
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="surface-panel p-10 text-center">
          <Map className="mx-auto h-8 w-8 text-primary" />
          <h1 className="mt-3 text-2xl font-semibold">No roadmap yet</h1>
          <Button className="mt-6" onClick={regenerate} disabled={generating}>
            {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate
          </Button>
        </div>
      </div>
    );

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mono text-[11px] text-primary tracking-widest">FULL ROADMAP</p>
          <h1 className="text-4xl font-bold tracking-tight mt-1">
            Your journey to <span className="gradient-text">{roadmap.next_target}</span>
          </h1>
        </div>
        <div className="flex gap-2">
          <Link to="/roadmap-print">
            <Button variant="outline">
              <FileDown className="mr-2 h-4 w-4" /> Export PDF
            </Button>
          </Link>
          <Button onClick={regenerate} disabled={generating}>
            {generating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Regenerate
          </Button>
        </div>
      </header>

      <div className="surface-panel p-6">
        <p className="mono text-xs text-muted-foreground tracking-widest">AI SUMMARY</p>
        <p className="mt-2 text-base">{roadmap.ai_summary}</p>
      </div>

      <Section title="Weekly goals" icon={Layers}>
        <div className="relative pl-6 border-l-2 border-primary/30 space-y-6">
          {(roadmap.weekly_goals ?? []).map(
            (g: { week: number; title: string; description: string }, i: number) => (
              <div key={i} className="relative">
                <span className="absolute -left-[29px] top-1 grid h-4 w-4 place-items-center rounded-full bg-primary text-[9px] mono text-primary-foreground">
                  {g.week ?? i + 1}
                </span>
                <div className="mono text-[11px] text-primary tracking-widest">
                  WEEK {g.week ?? i + 1}
                </div>
                <h3 className="text-lg font-semibold mt-1">{g.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{g.description}</p>
              </div>
            ),
          )}
        </div>
      </Section>

      <Section title="Monthly goals" icon={Layers}>
        <div className="grid gap-4 md:grid-cols-2">
          {(roadmap.monthly_goals ?? []).map(
            (m: { month: number; title: string; description: string }, i: number) => (
              <div key={i} className="rounded-lg border border-border bg-card/50 p-5">
                <div className="mono text-[11px] text-accent tracking-widest">
                  MONTH {m.month ?? i + 1}
                </div>
                <h3 className="text-lg font-semibold mt-1">{m.title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{m.description}</p>
              </div>
            ),
          )}
        </div>
      </Section>

      <Section title="Technology dependencies" icon={Layers}>
        <div className="flex flex-wrap gap-2">
          {(roadmap.technology_dependencies ?? []).map((t: string) => (
            <span
              key={t}
              className="mono text-xs px-3 py-1.5 rounded-md border border-primary/30 bg-primary/10 text-primary"
            >
              {t}
            </span>
          ))}
        </div>
      </Section>

      <Section title="Recommended case studies" icon={Layers}>
        <div className="grid gap-3">
          {(roadmap.recommended_case_studies ?? []).map(
            (c: { code: string; title: string; reason: string }, i: number) => (
              <div key={i} className="rounded-lg border border-border bg-card/50 p-4 flex gap-3">
                <span className="mono text-xs text-accent min-w-[4rem]">{c.code}</span>
                <div>
                  <div className="text-sm font-medium">{c.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">{c.reason}</div>
                </div>
              </div>
            ),
          )}
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}
