import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Cpu, Clock, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/audit")({
  head: () => ({
    meta: [{ title: "AI Audit Log — EEF" }, { name: "robots", content: "noindex" }],
  }),
  component: AuditPage,
});

type Row = {
  id: string;
  created_at: string;
  model: string;
  duration_ms: number | null;
  inputs: Record<string, unknown>;
  scores: Record<string, unknown>;
  summary: string | null;
};

function AuditPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from("roadmap_generations")
        .select("id, created_at, model, duration_ms, inputs, scores, summary")
        .eq("user_id", u.user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setRows((data ?? []) as Row[]);
      setLoading(false);
    })();
  }, []);

  if (loading)
    return (
      <div className="p-8 grid place-items-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-6">
      <header>
        <p className="mono text-[11px] text-primary tracking-widest">TRANSPARENCY</p>
        <h1 className="text-4xl font-bold tracking-tight mt-1">
          <span className="gradient-text">AI audit log</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Every roadmap generation, the signals it used, and the scores it produced.
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="surface-panel p-10 text-center text-sm text-muted-foreground">
          No generations yet. Trigger one from the dashboard.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const isOpen = open === r.id;
            const scores = r.scores ?? {};
            const inputs = r.inputs ?? {};
            return (
              <div key={r.id} className="surface-panel overflow-hidden">
                <button
                  onClick={() => setOpen(isOpen ? null : r.id)}
                  className="w-full text-left p-5 hover:bg-card/60 transition"
                >
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/15 text-primary">
                      <Cpu className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">
                        {r.summary?.slice(0, 90) || "Roadmap generated"}
                      </div>
                      <div className="mono text-[11px] text-muted-foreground mt-1 flex flex-wrap gap-3">
                        <span>{new Date(r.created_at).toLocaleString()}</span>
                        <span>· {r.model}</span>
                        {r.duration_ms != null && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {(r.duration_ms / 1000).toFixed(1)}s
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-4 text-right">
                      <ScorePill label="Promo" value={scores.promotion_readiness as number} />
                      <ScorePill label="Job" value={scores.job_readiness as number} />
                    </div>
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-border/60 p-5 grid gap-6 md:grid-cols-2 bg-card/30">
                    <Panel title="Inputs" data={inputs} />
                    <Panel title="Scores & outcome" data={scores} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ScorePill({ label, value }: { label: string; value?: number }) {
  return (
    <div className="text-right">
      <div className="mono text-[9px] text-muted-foreground tracking-widest">
        {label.toUpperCase()}
      </div>
      <div className="flex items-center gap-1 justify-end mt-0.5">
        <TrendingUp className="h-3 w-3 text-primary" />
        <span className="text-sm font-semibold">
          {typeof value === "number" ? `${value}%` : "—"}
        </span>
      </div>
    </div>
  );
}

function Panel({ title, data }: { title: string; data: Record<string, unknown> }) {
  const entries = Object.entries(data ?? {});
  return (
    <div>
      <p className="mono text-[10px] text-muted-foreground tracking-widest mb-3">
        {title.toUpperCase()}
      </p>
      <dl className="space-y-2">
        {entries.length === 0 && <p className="text-xs text-muted-foreground">—</p>}
        {entries.map(([k, v]) => (
          <div
            key={k}
            className="flex justify-between gap-4 text-sm border-b border-border/40 pb-2"
          >
            <dt className="mono text-xs text-muted-foreground">{k}</dt>
            <dd className="text-right font-medium truncate max-w-[60%]">
              {typeof v === "object" ? JSON.stringify(v) : String(v)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
