import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { redeemInvite, bootstrapFirstAdmin } from "@/lib/admin-invites.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { KeyRound, Loader2, Sparkles, ShieldCheck } from "lucide-react";

const searchSchema = z.object({ code: z.string().optional() });

export const Route = createFileRoute("/redeem")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [{ title: "Redeem invite — EEF" }, { name: "robots", content: "noindex" }],
  }),
  component: RedeemPage,
});

function RedeemPage() {
  const { code: urlCode } = Route.useSearch();
  const [code, setCode] = useState(urlCode ?? "");
  const [loading, setLoading] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [noAdmin, setNoAdmin] = useState(false);
  const redeem = useServerFn(redeemInvite);
  const bootstrap = useServerFn(bootstrapFirstAdmin);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setSignedIn(!!data.user);
      // Check if the org has any admin at all — enables the bootstrap CTA
      const { count } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");
      setNoAdmin((count ?? 0) === 0);
    })();
  }, []);

  const submit = async () => {
    if (!code.trim()) return toast.error("Enter your invite code");
    setLoading(true);
    try {
      const { role } = await redeem({ data: { code } });
      toast.success(`You're now ${role}`);
      router.navigate({ to: role === "admin" ? "/admin" : "/mentor" });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const claimBootstrap = async () => {
    setLoading(true);
    try {
      const { promoted } = await bootstrap();
      if (promoted) {
        toast.success("You are now admin");
        router.navigate({ to: "/admin" });
      } else {
        toast.error("An admin already exists — ask them for an invite");
        setNoAdmin(false);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (signedIn === false) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <div className="surface-panel p-8 max-w-md text-center">
          <KeyRound className="mx-auto h-8 w-8 text-primary" />
          <h1 className="mt-3 text-2xl font-semibold">Sign in to redeem</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You need an account to accept an invite. Sign in, then reopen the link.
          </p>
          <Link to="/auth">
            <Button className="mt-6 w-full">Sign in</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="surface-panel p-8 max-w-md w-full">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary">
          <KeyRound className="h-5 w-5" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold">Redeem your invite</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Paste the invite code your admin shared with you.
        </p>
        <div className="mt-6 space-y-3">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="INVITE CODE"
            className="mono tracking-widest"
          />
          <Button onClick={submit} disabled={loading} className="w-full">
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Redeem invite
          </Button>
        </div>

        {noAdmin && (
          <div className="mt-8 pt-6 border-t border-border">
            <p className="mono text-[10px] text-warning tracking-widest">FIRST-ADMIN BOOTSTRAP</p>
            <p className="mt-2 text-sm text-muted-foreground">
              This workspace has no admin yet. Claim admin now with one click.
            </p>
            <Button
              variant="outline"
              onClick={claimBootstrap}
              disabled={loading}
              className="mt-3 w-full border-warning/40 text-warning hover:bg-warning/10 hover:text-warning"
            >
              <ShieldCheck className="mr-2 h-4 w-4" /> Claim first admin
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
