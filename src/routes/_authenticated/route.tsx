import { createFileRoute, Outlet, redirect, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  Map,
  User,
  BookOpen,
  Users,
  ShieldCheck,
  LogOut,
  Cpu,
  History,
  Ticket,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationsBell } from "@/components/notifications-bell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const [roles, setRoles] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    supabase
      .from("user_roles")
      .select("role")
      .then(({ data }) => setRoles((data ?? []).map((r) => r.role as string)));
  }, []);

  const isMentor = roles.includes("mentor") || roles.includes("admin");
  const isAdmin = roles.includes("admin");

  const signOut = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/", replace: true });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] grid md:grid-cols-[240px_1fr]">
      <aside className="hidden md:flex flex-col border-r border-border/60 bg-sidebar p-4">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Cpu className="h-4 w-4" />
          </div>
          <div className="mono text-[11px] text-muted-foreground tracking-widest">EEF CONSOLE</div>
        </div>
        <nav className="mt-6 space-y-1">
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/roadmap" icon={Map} label="My Roadmap" />
          <NavItem to="/profile" icon={User} label="Profile & Skills" />
          <NavItem to="/case-studies" icon={BookOpen} label="Case Studies" />
          <NotificationsBell />
          <NavItem to="/notification-settings" icon={Settings} label="Notification settings" />
          <NavItem to="/audit" icon={History} label="AI Audit Log" />
          {isMentor && <NavItem to="/mentor" icon={Users} label="Mentor Console" />}
          {isAdmin && <NavItem to="/admin" icon={ShieldCheck} label="Admin" />}
          {isAdmin && <NavItem to="/invites" icon={Ticket} label="Invites" />}
        </nav>
        <div className="mt-auto">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  );
}

function NavItem({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  label: string;
}) {
  return (
    <Link
      to={to}
      activeProps={{ className: "bg-sidebar-accent text-foreground border-l-2 border-primary" }}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition border-l-2 border-transparent",
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
}
