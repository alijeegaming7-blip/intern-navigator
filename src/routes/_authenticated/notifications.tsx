import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { scanNotifications } from "@/lib/notifications.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Bell, CheckCheck, Loader2, RefreshCw, AlertTriangle, Info } from "lucide-react";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [{ title: "Notifications — EEF" }, { name: "robots", content: "noindex" }],
  }),
  component: NotificationsPage,
});

type Row = {
  id: string;
  kind: string;
  title: string;
  message: string;
  link: string | null;
  severity: string;
  read_at: string | null;
  created_at: string;
};

function NotificationsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const scan = useServerFn(scanNotifications);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("id, kind, title, message, link, severity, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    setRows((data ?? []) as Row[]);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const rescan = async () => {
    setScanning(true);
    try {
      const res = await scan();
      toast.success(`Scanned — ${res.inserted} new`);
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setScanning(false);
    }
  };

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    load();
  };

  const markAllRead = async () => {
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .is("read_at", null);
    load();
  };

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mono text-[11px] text-primary tracking-widest">INBOX</p>
          <h1 className="text-4xl font-bold tracking-tight mt-1">
            <span className="gradient-text">Notifications</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Reminders for upcoming and missed weekly goals and mentor reviews.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={rescan} disabled={scanning}>
            {scanning ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Re-scan
          </Button>
          <Button variant="outline" onClick={markAllRead}>
            <CheckCheck className="mr-2 h-4 w-4" /> Mark all read
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="p-8 grid place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : rows.length === 0 ? (
        <div className="surface-panel p-10 text-center">
          <Bell className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">You're all caught up.</p>
        </div>
      ) : (
        <div className="surface-panel divide-y divide-border/60">
          {rows.map((n) => {
            const Icon = n.severity === "warn" ? AlertTriangle : Info;
            const tone =
              n.severity === "warn"
                ? "text-warning border-warning/40 bg-warning/10"
                : "text-primary border-primary/30 bg-primary/10";
            return (
              <div key={n.id} className={`p-4 flex gap-4 ${!n.read_at ? "bg-primary/5" : ""}`}>
                <div className={`grid h-8 w-8 place-items-center rounded-md border ${tone}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-medium truncate">{n.title}</h3>
                    <span className="mono text-[10px] text-muted-foreground whitespace-nowrap">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                  <div className="mt-2 flex gap-2">
                    {n.link && (
                      <Link to={n.link} className="text-xs text-primary hover:underline">
                        Open →
                      </Link>
                    )}
                    {!n.read_at && (
                      <button
                        onClick={() => markRead(n.id)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
