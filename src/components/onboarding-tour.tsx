import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { RESTART_TOUR_EVENT } from "./onboarding-tour.events";
import { Sparkles, User, Wrench, Rocket, CheckCircle2, X } from "lucide-react";

type Step = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  cta?: { label: string; to: string };
};

const STEPS: Step[] = [
  {
    icon: Sparkles,
    title: "Welcome to EEF",
    body: "In 4 quick steps you'll set up your profile, add your skills, and generate your first AI-powered roadmap.",
  },
  {
    icon: User,
    title: "Step 1 — Complete your profile",
    body: "Tell us your GitHub, target role, and current level so the engine can tune to you.",
    cta: { label: "Open Profile", to: "/profile" },
  },
  {
    icon: Wrench,
    title: "Step 2 — Add a few skills",
    body: "Rate your proficiency on 3–5 skills. The AI uses these to find your gaps.",
    cta: { label: "Add skills", to: "/profile" },
  },
  {
    icon: Rocket,
    title: "Step 3 — Generate your roadmap",
    body: "Click Generate on the dashboard. In a few seconds you'll get personalized weekly and monthly goals.",
    cta: { label: "Go to Dashboard", to: "/dashboard" },
  },
  {
    icon: CheckCircle2,
    title: "You're set",
    body: "You can retake this tour anytime from your dashboard header. Now: build.",
  },
];

export function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", u.user.id)
        .maybeSingle();
      if (data && !data.onboarding_completed) setOpen(true);
    })();

    const handler = () => {
      setStep(0);
      setOpen(true);
    };
    window.addEventListener(RESTART_TOUR_EVENT, handler);
    return () => window.removeEventListener(RESTART_TOUR_EVENT, handler);
  }, []);

  const complete = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (u.user) {
      await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", u.user.id);
    }
    setOpen(false);
  };

  if (!open) return null;
  const s = STEPS[step];
  const Icon = s.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur-sm p-4">
      <div className="surface-panel relative w-full max-w-md p-6 border-primary/30">
        <button
          onClick={complete}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
          aria-label="Skip tour"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-border"}`}
            />
          ))}
        </div>
        <div className="mt-6 flex items-start gap-4">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="mono text-[10px] text-muted-foreground tracking-widest">
              STEP {step + 1} / {STEPS.length}
            </p>
            <h2 className="mt-1 text-xl font-semibold">{s.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={complete}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Skip tour
          </button>
          <div className="flex gap-2">
            {s.cta && (
              <Link to={s.cta.to} onClick={() => setStep((n) => Math.min(STEPS.length - 1, n + 1))}>
                <Button variant="outline" size="sm">
                  {s.cta.label}
                </Button>
              </Link>
            )}
            {!isLast ? (
              <Button size="sm" onClick={() => setStep((n) => n + 1)}>
                Next
              </Button>
            ) : (
              <Button size="sm" onClick={complete}>
                Finish
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
