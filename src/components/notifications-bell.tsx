import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { scanNotifications } from "@/lib/notifications.functions";

export function NotificationsBell() {
  const [unread, setUnread] = useState(0);
  const scan = useServerFn(scanNotifications);

  const refresh = async () => {
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .is("read_at", null);
    setUnread(count ?? 0);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await scan();
      } catch {
        /* silent */
      }
      if (!cancelled) await refresh();
    })();
    const t = setInterval(refresh, 60_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Link
      to="/notifications"
      className="relative flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition border-l-2 border-transparent"
      activeProps={{ className: "bg-sidebar-accent text-foreground border-l-2 border-primary" }}
    >
      <Bell className="h-4 w-4" />
      <span>Notifications</span>
      {unread > 0 && (
        <span className="ml-auto grid h-5 min-w-[20px] place-items-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
