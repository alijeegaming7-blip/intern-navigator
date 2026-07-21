import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  getNotificationPrefs,
  updateNotificationPrefs,
  DEFAULT_PREFS,
  type NotificationPrefs,
} from "@/lib/notification-prefs.functions";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Bell, Mail, Save } from "lucide-react";

export const Route = createFileRoute("/_authenticated/notification-settings")({
  head: () => ({
    meta: [{ title: "Notification settings — EEF" }, { name: "robots", content: "noindex" }],
  }),
  component: NotificationSettingsPage,
});

const ALERT_TYPES: { key: keyof NotificationPrefs; title: string; hint: string }[] = [
  {
    key: "roadmap_missing",
    title: "Roadmap missing",
    hint: "You haven't generated a roadmap yet.",
  },
  {
    key: "roadmap_stale",
    title: "Roadmap stale",
    hint: "It's been 14+ days since your last regeneration.",
  },
  { key: "goal_due", title: "Weekly goal in progress", hint: "The current week's goal is active." },
  { key: "goal_overdue", title: "Weekly goal overdue", hint: "A weekly goal passed its window." },
  {
    key: "review_due_soon",
    title: "Mentor review due soon",
    hint: "You're 14 days out from your next review.",
  },
  { key: "review_overdue", title: "Mentor review overdue", hint: "21+ days without a review." },
];

const FREQ_OPTIONS = [
  { hours: 1, label: "Hourly" },
  { hours: 4, label: "Every 4 hours" },
  { hours: 12, label: "Twice daily" },
  { hours: 24, label: "Daily" },
  { hours: 168, label: "Weekly" },
];

function NotificationSettingsPage() {
  const load = useServerFn(getNotificationPrefs);
  const save = useServerFn(updateNotificationPrefs);
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [email, setEmail] = useState<string | null>(null);
  const [lastDigest, setLastDigest] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await load();
        setPrefs(res.prefs);
        setEmail(res.email);
        setLastDigest(res.last_email_digest_at);
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  const set = <K extends keyof NotificationPrefs>(k: K, v: NotificationPrefs[K]) =>
    setPrefs((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    setSaving(true);
    try {
      await save({ data: prefs });
      toast.success("Notification settings saved");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto space-y-8">
      <header>
        <p className="mono text-[11px] text-primary tracking-widest">PREFERENCES</p>
        <h1 className="text-4xl font-bold tracking-tight mt-1">
          Notification <span className="gradient-text">settings</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
          Pick which reminders you want and how often. In-app alerts show in your bell; email
          digests bundle unread alerts into a single message.
        </p>
      </header>

      <section className="surface-panel p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">In-app alert types</h2>
        </div>
        <div className="divide-y divide-border/50">
          {ALERT_TYPES.map((t) => (
            <div key={t.key} className="flex items-center justify-between py-3 gap-4">
              <div>
                <Label htmlFor={t.key} className="text-sm font-medium">
                  {t.title}
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">{t.hint}</p>
              </div>
              <Switch
                id={t.key}
                checked={Boolean(prefs[t.key])}
                onCheckedChange={(v) => set(t.key, v as never)}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="surface-panel p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Email digest</h2>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="email_enabled" className="text-sm font-medium">
              Enable email notifications
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Send unread alerts as a bundled digest to {email ?? "your account email"}.
            </p>
          </div>
          <Switch
            id="email_enabled"
            checked={prefs.email_enabled}
            onCheckedChange={(v) => set("email_enabled", v)}
          />
        </div>

        <div className="pt-2">
          <Label className="text-sm font-medium">Digest frequency</Label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3">
            {FREQ_OPTIONS.map((f) => {
              const active = prefs.digest_frequency_hours === f.hours;
              return (
                <button
                  key={f.hours}
                  onClick={() => set("digest_frequency_hours", f.hours)}
                  disabled={!prefs.email_enabled}
                  className={`px-3 py-2 rounded-md text-xs border transition ${
                    active
                      ? "bg-primary/15 border-primary/50 text-primary"
                      : "border-border hover:border-primary/40"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">
            The digest runs hourly on the server and delivers to your inbox only if enough time has
            passed since your last one.
            {lastDigest && (
              <>
                {" "}
                Last sent: <span className="mono">{new Date(lastDigest).toLocaleString()}</span>.
              </>
            )}
          </p>
        </div>
      </section>

      <div className="flex justify-end">
        <Button onClick={submit} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save preferences
        </Button>
      </div>
    </div>
  );
}
