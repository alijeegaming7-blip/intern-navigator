import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — EEF" },
      { name: "description", content: "Sign in to your EEF console." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const passwordSchema = z.string().min(6, "At least 6 characters").max(72);
const nameSchema = z.string().trim().min(1, "Required").max(100);

const DEMO_ACCOUNTS = [
  { label: "Intern", email: "intern@eef.demo", password: "Demo@1234", color: "text-cyan-400" },
  { label: "Mentor", email: "mentor@eef.demo", password: "Demo@1234", color: "text-violet-400" },
  { label: "Admin",  email: "admin@eef.demo",  password: "Demo@1234", color: "text-emerald-400" },
];

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">(mode === "signup" ? "signup" : "signin");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const emailVal = emailSchema.safeParse(form.get("email"));
    const passwordVal = passwordSchema.safeParse(form.get("password"));
    if (!emailVal.success) return toast.error(emailVal.error.issues[0].message);
    if (!passwordVal.success) return toast.error(passwordVal.error.issues[0].message);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: emailVal.data,
      password: passwordVal.data,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    navigate({ to: "/dashboard", replace: true });
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = nameSchema.safeParse(form.get("name"));
    const emailVal = emailSchema.safeParse(form.get("email"));
    const passwordVal = passwordSchema.safeParse(form.get("password"));
    if (!name.success) return toast.error(name.error.issues[0].message);
    if (!emailVal.success) return toast.error(emailVal.error.issues[0].message);
    if (!passwordVal.success) return toast.error(passwordVal.error.issues[0].message);
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: emailVal.data,
      password: passwordVal.data,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: name.data },
      },
    });
    if (error) { setLoading(false); return toast.error(error.message); }
    if (data?.session) {
      setLoading(false);
      toast.success("Account created — welcome aboard");
      navigate({ to: "/dashboard", replace: true });
      return;
    }
    setLoading(false);
    toast.success("Account created. Check your email to confirm before signing in.");
  };

  const handleDemoLogin = async (account: typeof DEMO_ACCOUNTS[0]) => {
    setDemoLoading(account.label);
    const { error } = await supabase.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    });
    setDemoLoading(null);
    if (error) {
      toast.error(`Demo ${account.label} login failed. Run START.bat → Option 2 to create demo users first.`);
      return;
    }
    toast.success(`Signed in as Demo ${account.label}`);
    navigate({ to: "/dashboard", replace: true });
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setGoogleLoading(false);
      return toast.error(result.error.message || "Google sign-in failed");
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] hero-bg grid place-items-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 mb-4">
            <img
              src="/logo.svg"
              alt="EEF Logo"
              className="h-full w-full object-contain drop-shadow-[0_0_12px_rgba(6,182,212,0.6)]"
            />
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">Access the console</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your AI-powered engineering roadmap awaits.
          </p>
        </div>

        {/* Demo Login Panel */}
        <div className="surface-panel p-4 mb-4 border border-primary/20">
          <p className="mono text-[10px] text-primary tracking-widest mb-3">⚡ DEMO ACCOUNTS</p>
          <div className="grid grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.label}
                onClick={() => handleDemoLogin(acc)}
                disabled={demoLoading === acc.label}
                className="flex flex-col items-center gap-1 rounded-md border border-border bg-card/50 p-2.5 text-center hover:border-primary/50 hover:bg-primary/5 transition-all disabled:opacity-50"
              >
                {demoLoading === acc.label ? (
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                ) : (
                  <span className="text-lg">
                    {acc.label === "Intern" ? "🎓" : acc.label === "Mentor" ? "👨‍💻" : "⚙️"}
                  </span>
                )}
                <span className={`mono text-[10px] font-semibold tracking-wider ${acc.color}`}>
                  {acc.label.toUpperCase()}
                </span>
                <span className="text-[9px] text-muted-foreground truncate w-full text-center">
                  {acc.email}
                </span>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            Password: <span className="mono text-foreground">Demo@1234</span> for all accounts
          </p>
        </div>

        <div className="surface-panel p-6">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-6">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs mono tracking-wider text-muted-foreground">EMAIL</Label>
                  <Input id="email" name="email" type="email" placeholder="you@ezitech.dev" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs mono tracking-wider text-muted-foreground">PASSWORD</Label>
                  <Input id="password" name="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                <Button className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign in
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignUp} className="space-y-4">
                <Field label="Full name" name="name" placeholder="Ada Lovelace" />
                <Field label="Email" name="email" type="email" placeholder="you@ezitech.dev" />
                <Field label="Password" name="password" type="password" placeholder="At least 6 characters" />
                <Button className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase mono tracking-widest">
              <span className="bg-card px-3 text-muted-foreground">or</span>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={googleLoading}>
            {googleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
            Continue with Google
          </Button>
        </div>
      </div>
    </main>
  );
}

function Field({ label, name, type = "text", placeholder }: {
  label: string; name: string; type?: string; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="text-xs mono tracking-wider text-muted-foreground">
        {label.toUpperCase()}
      </Label>
      <Input id={name} name={name} type={type} placeholder={placeholder} required />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.68 4.1-5.5 4.1-3.3 0-6-2.74-6-6.1s2.7-6.1 6-6.1c1.9 0 3.16.8 3.9 1.5l2.65-2.55C16.9 3.36 14.7 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12S6.7 21.6 12 21.6c6.9 0 11.4-4.85 11.4-11.7 0-.78-.08-1.38-.2-1.7H12z" />
    </svg>
  );
}

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — EEF" },
      { name: "description", content: "Sign in to your EEF console." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const passwordSchema = z.string().min(6, "At least 6 characters").max(72);
const nameSchema = z.string().trim().min(1, "Required").max(100);

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">(mode === "signup" ? "signup" : "signin");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = emailSchema.safeParse(form.get("email"));
    const password = passwordSchema.safeParse(form.get("password"));
    if (!email.success) return toast.error(email.error.issues[0].message);
    if (!password.success) return toast.error(password.error.issues[0].message);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.data,
      password: password.data,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    navigate({ to: "/dashboard", replace: true });
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = nameSchema.safeParse(form.get("name"));
    const email = emailSchema.safeParse(form.get("email"));
    const password = passwordSchema.safeParse(form.get("password"));
    if (!name.success) return toast.error(name.error.issues[0].message);
    if (!email.success) return toast.error(email.error.issues[0].message);
    if (!password.success) return toast.error(password.error.issues[0].message);
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.data,
      password: password.data,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: name.data },
      },
    });

    if (error) {
      setLoading(false);
      return toast.error(error.message);
    }

    if (data?.session) {
      setLoading(false);
      toast.success("Account created — welcome aboard");
      navigate({ to: "/dashboard", replace: true });
      return;
    }

    setLoading(false);
    if (data?.user) {
      toast.success("Account created. Check your email to confirm before signing in.");
      return;
    }

    toast.success("Account created. Please sign in to continue.");
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setGoogleLoading(false);
      return toast.error(result.error.message || "Google sign-in failed");
    }
    if (result.redirected) return;
    // Session set (popup flow)
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] hero-bg grid place-items-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 mb-4">
            <img 
              src="/logo.svg" 
              alt="EEF Logo" 
              className="h-full w-full object-contain drop-shadow-[0_0_12px_rgba(6,182,212,0.6)]"
            />
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">Access the console</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your AI-powered engineering roadmap awaits.
          </p>
        </div>

        <div className="surface-panel p-6">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-6">
              <form onSubmit={handleSignIn} className="space-y-4">
                <Field label="Email" name="email" type="email" placeholder="you@ezitech.dev" />
                <Field label="Password" name="password" type="password" placeholder="••••••••" />
                <Button className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign in
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignUp} className="space-y-4">
                <Field label="Full name" name="name" placeholder="Ada Lovelace" />
                <Field label="Email" name="email" type="email" placeholder="you@ezitech.dev" />
                <Field
                  label="Password"
                  name="password"
                  type="password"
                  placeholder="At least 6 characters"
                />
                <Button className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase mono tracking-widest">
              <span className="bg-card px-3 text-muted-foreground">or</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogle}
            disabled={googleLoading}
          >
            {googleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
            Continue with Google
          </Button>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="text-xs mono tracking-wider text-muted-foreground">
        {label.toUpperCase()}
      </Label>
      <Input id={name} name={name} type={type} placeholder={placeholder} required />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.68 4.1-5.5 4.1-3.3 0-6-2.74-6-6.1s2.7-6.1 6-6.1c1.9 0 3.16.8 3.9 1.5l2.65-2.55C16.9 3.36 14.7 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12S6.7 21.6 12 21.6c6.9 0 11.4-4.85 11.4-11.7 0-.78-.08-1.38-.2-1.7H12z"
      />
    </svg>
  );
}
