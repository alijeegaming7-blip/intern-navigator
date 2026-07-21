import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — EEF" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

type UserRow = {
  id: string;
  full_name: string;
  email: string;
  current_level: string;
  target_role: string;
  roles: string[];
};

const ROLES = ["intern", "mentor", "admin"] as const;

function AdminPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    interns: 0,
    mentors: 0,
    admins: 0,
    roadmaps: 0,
    casesCompleted: 0,
  });

  const load = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: roles }, { data: rms }, { data: cc }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, current_level, target_role"),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("roadmaps").select("id", { count: "exact", head: false }),
      supabase.from("completed_case_studies").select("id", { count: "exact", head: false }),
    ]);
    const roleMap: Record<string, string[]> = {};
    (roles ?? []).forEach((r) => {
      const uid = r.user_id as string;
      (roleMap[uid] ??= []).push(r.role as string);
    });
    const list: UserRow[] = (profiles ?? []).map((p) => ({
      id: p.id as string,
      full_name: (p.full_name as string) || "—",
      email: p.email as string,
      current_level: p.current_level as string,
      target_role: p.target_role as string,
      roles: roleMap[p.id as string] ?? [],
    }));
    setUsers(list);
    setStats({
      interns: list.filter((u) => u.roles.includes("intern")).length,
      mentors: list.filter((u) => u.roles.includes("mentor")).length,
      admins: list.filter((u) => u.roles.includes("admin")).length,
      roadmaps: rms?.length ?? 0,
      casesCompleted: cc?.length ?? 0,
    });
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const toggleRole = async (userId: string, role: (typeof ROLES)[number], has: boolean) => {
    if (has) {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) return toast.error(error.message);
    }
    toast.success(`Role updated`);
    load();
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
        <p className="mono text-[11px] text-primary tracking-widest">ADMIN CONSOLE</p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight">
          Manage the <span className="gradient-text">organization</span>
        </h1>
      </header>

      <div className="grid gap-4 md:grid-cols-5">
        <Stat label="Interns" value={stats.interns} />
        <Stat label="Mentors" value={stats.mentors} />
        <Stat label="Admins" value={stats.admins} />
        <Stat label="Roadmaps" value={stats.roadmaps} />
        <Stat label="CS Completed" value={stats.casesCompleted} />
      </div>

      <div className="surface-panel p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-card/60 border-b border-border">
            <tr className="text-left mono text-[11px] text-muted-foreground tracking-widest">
              <th className="px-4 py-3">USER</th>
              <th className="px-4 py-3">LEVEL</th>
              <th className="px-4 py-3">TARGET</th>
              <th className="px-4 py-3">ROLES</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border/50 last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium">{u.full_name}</div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </td>
                <td className="px-4 py-3 mono text-xs text-muted-foreground">{u.current_level}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{u.target_role}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {ROLES.map((r) => {
                      const has = u.roles.includes(r);
                      return (
                        <Button
                          key={r}
                          size="sm"
                          variant={has ? "default" : "outline"}
                          className="h-7 text-xs px-2"
                          onClick={() => toggleRole(u.id, r, has)}
                        >
                          {has && <ShieldCheck className="mr-1 h-3 w-3" />}
                          {r}
                        </Button>
                      );
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="surface-panel p-5">
      <div className="mono text-[10px] text-muted-foreground tracking-widest">
        {label.toUpperCase()}
      </div>
      <div className="text-3xl font-bold mt-2 gradient-text">{value}</div>
    </div>
  );
}
