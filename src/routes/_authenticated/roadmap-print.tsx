import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/roadmap-print")({
  head: () => ({
    meta: [{ title: "Roadmap Report — EEF" }, { name: "robots", content: "noindex" }],
  }),
  component: PrintPage,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

function PrintPage() {
  const [profile, setProfile] = useState<Any>(null);
  const [roadmap, setRoadmap] = useState<Any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("*").maybeSingle(),
        supabase.from("roadmaps").select("*").maybeSingle(),
      ]);
      setProfile(p);
      setRoadmap(r);
      setLoading(false);
    })();
  }, []);

  const print = () => window.print();

  if (loading)
    return (
      <div className="p-8 grid place-items-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );

  if (!roadmap)
    return (
      <div className="p-8 max-w-lg mx-auto text-center">
        <p className="text-sm text-muted-foreground">No roadmap yet — generate one first.</p>
      </div>
    );

  const gen = roadmap.generated_at ? new Date(roadmap.generated_at) : new Date();

  return (
    <div className="bg-background print:bg-white">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .print-page {
            color: black !important;
            background: white !important;
            padding: 32px !important;
            max-width: none !important;
          }
          .print-panel {
            border: 1px solid #ddd !important;
            background: white !important;
            page-break-inside: avoid;
          }
          .print-muted { color: #555 !important; }
          .print-accent { color: #2563eb !important; }
          .print-heading { color: black !important; }
          .print-tag {
            border: 1px solid #ccc !important;
            background: #f3f4f6 !important;
            color: #111 !important;
          }
          h1, h2, h3 { color: black !important; }
        }
        @page { margin: 16mm; }
      `}</style>

      <div className="no-print sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur px-6 py-3 flex items-center justify-between">
        <div className="mono text-xs text-muted-foreground tracking-widest">
          ROADMAP REPORT PREVIEW
        </div>
        <Button onClick={print}>
          <Printer className="mr-2 h-4 w-4" /> Print / Save as PDF
        </Button>
      </div>

      <div className="print-page p-8 lg:p-12 max-w-4xl mx-auto space-y-8">
        <header className="border-b border-border pb-6">
          <div className="mono text-[11px] text-primary tracking-widest print-accent">
            EZITECH ENGINEERING FRAMEWORK · ROADMAP REPORT
          </div>
          <h1 className="mt-2 text-3xl font-bold print-heading">
            {profile?.full_name || "Engineer"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground print-muted">
            {profile?.email} · {roadmap.current_level} → {profile?.target_role || "TBD"}
          </p>
          <p className="mt-3 mono text-xs text-muted-foreground print-muted">
            Generated {gen.toLocaleString()} · Estimated graduation{" "}
            {roadmap.estimated_graduation_date
              ? new Date(roadmap.estimated_graduation_date).toLocaleDateString()
              : "TBD"}
          </p>
        </header>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Promotion readiness" value={`${roadmap.promotion_readiness}%`} />
          <Stat label="Job readiness" value={`${roadmap.job_readiness}%`} />
          <Stat label="Attendance" value={`${profile?.attendance_score ?? 0}/100`} />
          <Stat label="Coding speed" value={`${profile?.coding_speed ?? 0}/100`} />
        </section>

        <section className="print-panel rounded-lg border border-border p-5">
          <p className="mono text-[10px] text-muted-foreground tracking-widest print-muted">
            NEXT TARGET
          </p>
          <p className="mt-2 text-xl font-semibold print-heading">{roadmap.next_target}</p>
          <p className="mt-2 text-sm text-muted-foreground print-muted">{roadmap.ai_summary}</p>
        </section>

        <Section title="Weekly goals">
          <ol className="space-y-3">
            {(roadmap.weekly_goals ?? []).map(
              (g: { week: number; title: string; description: string }, i: number) => (
                <li key={i} className="print-panel border border-border rounded-md p-4">
                  <div className="mono text-[10px] text-primary tracking-widest print-accent">
                    WEEK {g.week ?? i + 1}
                  </div>
                  <div className="font-medium mt-0.5 print-heading">{g.title}</div>
                  <div className="text-sm text-muted-foreground mt-1 print-muted">
                    {g.description}
                  </div>
                </li>
              ),
            )}
          </ol>
        </Section>

        <Section title="Monthly goals">
          <ol className="space-y-3">
            {(roadmap.monthly_goals ?? []).map(
              (g: { month: number; title: string; description: string }, i: number) => (
                <li key={i} className="print-panel border border-border rounded-md p-4">
                  <div className="mono text-[10px] text-primary tracking-widest print-accent">
                    MONTH {g.month ?? i + 1}
                  </div>
                  <div className="font-medium mt-0.5 print-heading">{g.title}</div>
                  <div className="text-sm text-muted-foreground mt-1 print-muted">
                    {g.description}
                  </div>
                </li>
              ),
            )}
          </ol>
        </Section>

        <div className="grid gap-6 md:grid-cols-3">
          <TagBlock title="Strong skills" items={roadmap.strong_skills ?? []} />
          <TagBlock title="Skills to reinforce" items={roadmap.weak_skills ?? []} />
          <TagBlock title="Missing skills" items={roadmap.missing_skills ?? []} />
        </div>

        <Section title="Recommended case studies">
          <ul className="space-y-2">
            {(roadmap.recommended_case_studies ?? []).map(
              (c: { code: string; title: string; reason: string }, i: number) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="mono text-xs print-accent min-w-[4rem]">{c.code}</span>
                  <div>
                    <div className="font-medium print-heading">{c.title}</div>
                    <div className="text-muted-foreground print-muted">{c.reason}</div>
                  </div>
                </li>
              ),
            )}
          </ul>
        </Section>

        <Section title="Technology dependencies">
          <div className="flex flex-wrap gap-2">
            {(roadmap.technology_dependencies ?? []).map((t: string) => (
              <span
                key={t}
                className="mono text-xs px-2 py-1 rounded-md border border-primary/30 bg-primary/10 text-primary print-tag"
              >
                {t}
              </span>
            ))}
          </div>
        </Section>

        <footer className="pt-6 border-t border-border text-center mono text-[10px] text-muted-foreground print-muted">
          Generated by EEF · AI-019 Internship Roadmap Generator · {new Date().toLocaleDateString()}
        </footer>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="print-panel rounded-lg border border-border p-4">
      <div className="mono text-[10px] text-muted-foreground tracking-widest print-muted">
        {label.toUpperCase()}
      </div>
      <div className="mt-2 text-2xl font-semibold print-heading">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-3 print-heading">{title}</h2>
      {children}
    </section>
  );
}

function TagBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="print-panel border border-border rounded-lg p-4">
      <div className="mono text-[10px] text-muted-foreground tracking-widest print-muted">
        {title.toUpperCase()}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
        {items.map((it) => (
          <span
            key={it}
            className="mono text-[11px] px-2 py-1 rounded-md border border-border bg-card/50 print-tag"
          >
            {it}
          </span>
        ))}
      </div>
    </div>
  );
}
