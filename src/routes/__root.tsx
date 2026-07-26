import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Cpu, LogOut } from "lucide-react";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center hero-bg px-4">
      <div className="max-w-md text-center surface-panel p-10">
        <p className="mono text-xs text-primary tracking-widest">ERR_404</p>
        <h1 className="mt-2 text-6xl font-bold gradient-text">Route not found</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The path you requested is not registered in the roadmap engine.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 glow-cyan"
          >
            Return to base
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center hero-bg px-4">
      <div className="max-w-md text-center surface-panel p-10">
        <p className="mono text-xs text-destructive tracking-widest">SYSTEM_FAULT</p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Something went sideways</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The roadmap engine hit an unexpected error. Try again, or return home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Try again
          </Button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "EEF — AI Internship Roadmap Engine | Ezitech" },
      {
        name: "description",
        content:
          "Ezitech Engineering Framework: an AI engine that generates dynamic, personalized internship roadmaps, weekly goals and case-study recommendations for every intern.",
      },
      { name: "author", content: "Ezitech" },
      { property: "og:title", content: "EEF — AI Internship Roadmap Engine" },
      {
        property: "og:description",
        content:
          "Personalized engineering journeys, generated and evolved by AI. Interns, mentors and admins in one console.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#0b0f1e" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "alternate icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function TopNav() {
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setEmail(data.session?.user.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user.email ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 backdrop-blur-xl bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative h-10 w-10 group-hover:scale-105 transition-transform">
            <img 
              src="/logo.svg" 
              alt="EEF Logo" 
              className="h-full w-full object-contain drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]"
            />
          </div>
          <div className="leading-tight">
            <div className="text-lg font-bold tracking-tight gradient-text">EEF</div>
            <div className="mono text-[10px] text-muted-foreground -mt-0.5 tracking-wider">ROADMAP_ENGINE</div>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="/#features" className="hover:text-foreground transition">
            Features
          </a>
          <a href="/#how" className="hover:text-foreground transition">
            How it works
          </a>
          <a href="/#roles" className="hover:text-foreground transition">
            Roles
          </a>
        </nav>
        <div className="flex items-center gap-2">
          {email ? (
            <>
              <Link
                to="/dashboard"
                className="hidden sm:inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Dashboard
              </Link>
              <Button variant="ghost" size="sm" onClick={signOut} title="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link
                to="/auth"
                className="text-sm text-muted-foreground hover:text-foreground px-3 py-2"
              >
                Sign in
              </Link>
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 glow-cyan"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [queryClient, router]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen">
        <TopNav />
        <Outlet />
      </div>
      <Toaster richColors theme="dark" position="top-right" />
    </QueryClientProvider>
  );
}
