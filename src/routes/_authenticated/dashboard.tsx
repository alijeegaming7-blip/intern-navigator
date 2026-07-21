import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { generateRoadmap } from "@/lib/roadmap.functions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  TrendingUp,
  Target,
  Award,
  Calendar,
  Loader2,
  ArrowRight,
  Flame,
  BookOpen,
  FileDown,
  PlayCircle,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { OnboardingTour } from "@/components/onboarding-tour";
import { restartOnboardingTour } from "@/components/onboarding-tour.events";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — EEF" }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Roadmap = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Profile = any;

function Dashboard() {
  const [profile, setProfile] = useState<Profile>(null);
  const [roadmap, setRoadmap] = useState<Roadmap>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const genFn = useServerFn(generateRoadmap);

  const load = async () => {
    setLoading(true);
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("*").maybeSingle(),
      supabase.from("roadmaps").select("*").maybeSingle(),
    ]);
    setProfile(p);
    setRoadmap(r);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const regenerate = async () => {
    setGenerating(true);
    try {
      await genFn({ data: { trigger: "dashboard_manual" } });
      toast.success("Roadmap regenerated");
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 grid place-items-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8">
      <OnboardingTour />
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mono text-[11px] text-primary tracking-widest">
            {profile?.current_level ?? "L1 - Explorer"}
          </p>
          <h1 className="mt-1 text-4xl font-bold tracking-tight">
            Welcome back, <span className="gradient-text">{profile?.full_name || "engineer"}</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {roadmap
              ? `Last generated ${new Date(roadmap.generated_at).toLocaleString()}`
              : "You haven't generated a roadmap yet."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={restartOnboardingTour} title="Replay the guided tour">
            <PlayCircle className="mr-2 h-4 w-4" /> Restart tour
          </Button>
          {roadmap && (
            <Link to="/roadmap-print">
              <Button variant="outline">
                <FileDown className="mr-2 h-4 w-4" /> Export PDF
              </Button>
            </Link>
          )}
          <Button onClick={regenerate} disabled={generating}>
            {generating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {roadmap ? "Regenerate roadmap" : "Generate my first roadmap"}
          </Button>
        </div>
      </header>

      {!roadmap ? (
        <div className="surface-panel p-12 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-primary" />
          <h2 className="mt-4 text-xl font-semibold">No roadmap yet</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Add a few skills on your profile, then generate your first personalized plan.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Link
              to="/profile"
              className="inline-flex items-center rounded-md border border-border bg-card px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
            >
              Add skills
            </Link>
            <Button onClick={regenerate} disabled={generating}>
              {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate now
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Stat
              icon={TrendingUp}
              label="Promotion readiness"
              value={`${roadmap.promotion_readiness}%`}
              bar={roadmap.promotion_readiness}
            />
            <Stat
              icon={Award}
              label="Job readiness"
              value={`${roadmap.job_readiness}%`}
              bar={roadmap.job_readiness}
            />
            <Stat
              icon={Calendar}
              label="Est. graduation"
              value={
                roadmap.estimated_graduation_date
                  ? new Date(roadmap.estimated_graduation_date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "—"
              }
            />
            <Stat
              icon={Flame}
              label="Coding speed"
              value={`${profile?.coding_speed ?? 0}/100`}
              bar={profile?.coding_speed ?? 0}
            />
          </div>

          <div className="surface-panel p-6">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <p className="mono text-xs text-muted-foreground tracking-widest">NEXT TARGET</p>
            </div>
            <p className="mt-2 text-xl font-semibold">{roadmap.next_target}</p>
            <p className="mt-3 text-sm text-muted-foreground">{roadmap.ai_summary}</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ListCard title="This week" icon={Sparkles}>
              {(roadmap.weekly_goals ?? [])
                .slice(0, 4)
                .map((g: { week: number; title: string; description: string }, i: number) => (
                  <li key={i} className="flex gap-3 py-3 border-b border-border/50 last:border-0">
                    <span className="mono text-xs mt-1 text-primary min-w-[3rem]">
                      W{g.week ?? i + 1}
                    </span>
                    <div>
                      <div className="text-sm font-medium">{g.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{g.description}</div>
                    </div>
                  </li>
                ))}
            </ListCard>

            <ListCard title="Recommended case studies" icon={BookOpen}>
              {(roadmap.recommended_case_studies ?? []).map(
                (r: { code: string; title: string; reason: string }, i: number) => (
                  <li key={i} className="flex gap-3 py-3 border-b border-border/50 last:border-0">
                    <span className="mono text-xs mt-1 text-accent min-w-[4rem]">{r.code}</span>
                    <div>
                      <div className="text-sm font-medium">{r.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{r.reason}</div>
                    </div>
                  </li>
                ),
              )}
            </ListCard>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <TagCard title="Strong skills" items={roadmap.strong_skills ?? []} tone="success" />
            <TagCard title="Weak skills" items={roadmap.weak_skills ?? []} tone="warning" />
            <TagCard title="Missing skills" items={roadmap.missing_skills ?? []} tone="accent" />
          </div>

          <div className="flex justify-end">
            <Link
              to="/roadmap"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              View full roadmap <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  bar,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  label: string;
  value: string;
  bar?: number;
}) {
  return (
    <div className="surface-panel p-5">
      <div className="flex items-center justify-between">
        <p className="mono text-[10px] text-muted-foreground tracking-widest">
          {label.toUpperCase()}
        </p>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      {typeof bar === "number" && <Progress className="mt-3 h-1.5" value={bar} />}
    </div>
  );
}

function ListCard({
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
    <div className="surface-panel p-6">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <ul>{children}</ul>
    </div>
  );
}

function TagCard({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "success" | "warning" | "accent";
}) {
  const toneClass =
    tone === "success"
      ? "bg-success/15 text-success border-success/30"
      : tone === "warning"
        ? "bg-warning/15 text-warning border-warning/30"
        : "bg-accent/15 text-accent border-accent/30";
  return (
    <div className="surface-panel p-6">
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {items.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
        {items.map((it) => (
          <span key={it} className={`mono text-[11px] px-2 py-1 rounded-md border ${toneClass}`}>
            {it}
          </span>
        ))}
      </div>
    </div>
  );
}
