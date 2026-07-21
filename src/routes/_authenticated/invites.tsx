import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  createAdminInvite,
  listInvites,
  revokeInvite,
  extendInvite,
} from "@/lib/admin-invites.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Copy, Loader2, ShieldCheck, Ticket, UserCog, Trash2, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/invites")({
  head: () => ({
    meta: [{ title: "Invites — EEF" }, { name: "robots", content: "noindex" }],
  }),
  component: InvitesPage,
});

type Profile = { full_name: string; email: string } | null;
type Invite = {
  id: string;
  code: string;
  role: string;
  used_by: string | null;
  used_at: string | null;
  expires_at: string;
  created_at: string;
  created_by: string | null;
  created_by_profile: Profile;
  used_by_profile: Profile;
};

function InvitesPage() {
  const create = useServerFn(createAdminInvite);
  const list = useServerFn(listInvites);
  const revoke = useServerFn(revokeInvite);
  const extend = useServerFn(extendInvite);

  const [rows, setRows] = useState<Invite[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await list();
      setRows(data as Invite[]);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [list]);

  useEffect(() => {
    void load();
  }, [load]);

  const make = async (role: "admin" | "mentor") => {
    setBusy(role);
    try {
      const { code } = await create({ data: { role, expires_in_days: days } });
      toast.success(`New ${role} invite created (expires in ${days} days)`);
      await load();
      await copy(code);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const copy = async (code: string) => {
    const url = `${window.location.origin}/redeem?code=${code}`;
    await navigator.clipboard.writeText(url);
    toast.success("Invite URL copied");
  };

  const doRevoke = async (id: string, code: string) => {
    if (
      !confirm(
        `Revoke invite ${code}? Anyone holding this link will no longer be able to redeem it.`,
      )
    )
      return;
    setBusy(id);
    try {
      await revoke({ data: { id } });
      toast.success("Invite revoked");
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const doExtend = async (id: string) => {
    setBusy(id);
    try {
      await extend({ data: { id, expires_in_days: 30 } });
      toast.success("Extended by 30 days");
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const activeCount = rows.filter((r) => !r.used_by && new Date(r.expires_at) > new Date()).length;
  const usedCount = rows.filter((r) => r.used_by).length;
  const expiredCount = rows.filter(
    (r) => !r.used_by && new Date(r.expires_at) <= new Date(),
  ).length;

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-6">
      <header>
        <p className="mono text-[11px] text-primary tracking-widest">ROLE INVITES</p>
        <h1 className="text-4xl font-bold tracking-tight mt-1">
          Elevate <span className="gradient-text">teammates</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
          Share an invite URL with someone who already has an account. Set expiration, revoke any
          time, and audit who used what.
        </p>
      </header>

      {error && (
        <div className="surface-panel p-6 border-warning/40 bg-warning/10 text-sm">{error}</div>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        <Stat label="Active" value={activeCount} tone="primary" />
        <Stat label="Redeemed" value={usedCount} tone="success" />
        <Stat label="Expired" value={expiredCount} tone="warn" />
      </div>

      <div className="surface-panel p-6 space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="grow max-w-[180px]">
            <Label htmlFor="days" className="text-xs mono tracking-widest text-muted-foreground">
              EXPIRES IN (DAYS)
            </Label>
            <Input
              id="days"
              type="number"
              min={1}
              max={365}
              value={days}
              onChange={(e) => setDays(Math.min(365, Math.max(1, Number(e.target.value) || 30)))}
              className="mt-1"
            />
          </div>
          <Button onClick={() => make("admin")} disabled={!!busy}>
            {busy === "admin" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="mr-2 h-4 w-4" />
            )}
            Create admin invite
          </Button>
          <Button variant="outline" onClick={() => make("mentor")} disabled={!!busy}>
            {busy === "mentor" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserCog className="mr-2 h-4 w-4" />
            )}
            Create mentor invite
          </Button>
        </div>
      </div>

      <div className="surface-panel p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Ticket className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm">Recent invites</h2>
          <span className="text-xs text-muted-foreground ml-auto">Last {rows.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-card/60 border-b border-border">
              <tr className="text-left mono text-[11px] text-muted-foreground tracking-widest">
                <th className="px-4 py-3">CODE</th>
                <th className="px-4 py-3">ROLE</th>
                <th className="px-4 py-3">STATUS</th>
                <th className="px-4 py-3">USED BY</th>
                <th className="px-4 py-3">EXPIRES</th>
                <th className="px-4 py-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    <Ticket className="mx-auto h-6 w-6 mb-2" />
                    No invites yet.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const used = !!r.used_by;
                  const expired = new Date(r.expires_at) < new Date();
                  const isBusy = busy === r.id;
                  return (
                    <tr key={r.id} className="border-b border-border/50 last:border-0">
                      <td className="px-4 py-3 mono text-xs">{r.code}</td>
                      <td className="px-4 py-3">
                        <span className="mono text-[11px] px-2 py-1 rounded-md bg-primary/15 text-primary border border-primary/30">
                          {r.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {used ? (
                          <span className="text-success">Redeemed</span>
                        ) : expired ? (
                          <span className="text-warning">Expired</span>
                        ) : (
                          <span className="text-muted-foreground">Pending</span>
                        )}
                        {used && r.used_at && (
                          <span className="block text-[10px] text-muted-foreground mt-0.5">
                            {new Date(r.used_at).toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {r.used_by_profile ? (
                          <div>
                            <div>{r.used_by_profile.full_name || "—"}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {r.used_by_profile.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 mono text-xs text-muted-foreground">
                        {new Date(r.expires_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!used && !expired && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copy(r.code)}
                              disabled={isBusy}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {!used && expired && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => doExtend(r.id)}
                              disabled={isBusy}
                              title="Extend by 30 days"
                            >
                              <Clock className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {!used && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => doRevoke(r.id, r.code)}
                              disabled={isBusy}
                              className="text-destructive hover:text-destructive"
                            >
                              {isBusy ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "primary" | "success" | "warn";
}) {
  const color =
    tone === "primary" ? "text-primary" : tone === "success" ? "text-success" : "text-warning";
  return (
    <div className="surface-panel p-5">
      <p className="mono text-[10px] text-muted-foreground tracking-widest">
        {label.toUpperCase()}
      </p>
      <p className={`mt-1 text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
