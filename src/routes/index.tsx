import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Brain,
  GitBranch,
  Gauge,
  Sparkles,
  Target,
  Users,
  Zap,
  ArrowRight,
  Rocket,
  ShieldCheck,
  LineChart,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EEF — AI Internship Roadmap Engine | Ezitech" },
      {
        name: "description",
        content:
          "An AI engine that generates dynamic, personalized engineering roadmaps for every Ezitech intern — with mentor and admin consoles.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <main>
      {/* HERO */}
      <section className="hero-bg relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 pt-24 pb-32 lg:pt-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex flex-col items-center gap-3 mb-6">
              <img 
                src="/logo.svg" 
                alt="EEF Logo" 
                className="h-20 w-20 object-contain drop-shadow-[0_0_16px_rgba(6,182,212,0.7)] animate-float"
              />
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 mono text-[11px] text-primary tracking-widest">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                EEF · AI-019 · v1.0
              </div>
            </div>
            <h1 className="mt-6 text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
              Every intern deserves <br />
              their own <span className="gradient-text">engineering roadmap</span>.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              EEF generates dynamic, personalized learning journeys from real signals — GitHub
              activity, completed case studies, mentor reviews, coding speed and attendance — and
              re-plans automatically as interns grow.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 glow-cyan"
              >
                Launch my roadmap <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#how"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card/40 px-6 py-3 text-sm font-medium text-foreground hover:bg-card"
              >
                See how it works
              </a>
            </div>

            <div className="mono mt-10 text-[11px] text-muted-foreground tracking-widest">
              BUILT ON THE EZITECH ENGINEERING FRAMEWORK
            </div>
          </div>

          {/* Terminal-style preview */}
          <div className="mt-16 mx-auto max-w-4xl surface-panel p-1 glow-violet">
            <div className="rounded-[calc(var(--radius-xl)-4px)] bg-background/80 p-6">
              <div className="flex items-center gap-1.5 pb-4 border-b border-border/60">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
                <span className="mono ml-3 text-[11px] text-muted-foreground">
                  ~/eef/roadmap/generate.ts
                </span>
              </div>
              <pre className="mono mt-4 text-[12px] leading-relaxed text-muted-foreground overflow-x-auto">
                {`> analyzing intern signals...
  ✓ 14 skills scored     ✓ 3 case studies completed
  ✓ github: 47 commits   ✓ mentor rating: 4.2/5
  ✓ coding speed: 68     ✓ attendance: 96%

> generating roadmap...
  ┌─ WEEK 1  Ship a realtime chat prototype
  ├─ WEEK 2  Learn Redis + queue patterns
  ├─ WEEK 3  Own CS-002 mentor review
  └─ WEEK 4  Kick off CS-006 (AI Resume Screener)

`}
                <span className="text-primary">
                  promotion_readiness = 62% · job_readiness = 45%
                </span>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="max-w-2xl">
          <p className="mono text-xs text-primary tracking-widest">CAPABILITIES</p>
          <h2 className="mt-2 text-4xl font-bold tracking-tight">
            One engine. Every signal. A roadmap that{" "}
            <span className="gradient-text">learns you.</span>
          </h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="surface-panel p-6 hover:border-primary/40 transition-colors"
            >
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="border-y border-border/60 bg-card/30">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <p className="mono text-xs text-primary tracking-widest">HOW IT WORKS</p>
          <h2 className="mt-2 text-4xl font-bold tracking-tight max-w-2xl">
            From intern signals to a live, evolving plan.
          </h2>
          <div className="mt-14 grid gap-6 md:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative surface-panel p-6">
                <div className="mono absolute -top-3 left-6 rounded-md bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                  STEP {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROLES */}
      <section id="roles" className="mx-auto max-w-7xl px-6 py-24">
        <p className="mono text-xs text-primary tracking-widest">ROLE-BASED CONSOLES</p>
        <h2 className="mt-2 text-4xl font-bold tracking-tight max-w-2xl">
          Built for interns, mentors and admins.
        </h2>
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {ROLES.map((r) => (
            <div key={r.title} className="surface-panel p-8">
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-accent/15 text-accent border border-accent/30">
                <r.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-xl font-semibold">{r.title}</h3>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {r.items.map((it) => (
                  <li key={it} className="flex gap-2">
                    <span className="text-primary">→</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="surface-panel p-12 text-center glow-cyan">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Ready to replace the static roadmap?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Sign up in seconds, drop your current skills, and let EEF chart the rest.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Create your account <Rocket className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-8 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="mono">EEF · AI-019 · Ezitech Engineering Framework</span>
          <span>© {new Date().getFullYear()} Ezitech. Built for engineers.</span>
        </div>
      </footer>
    </main>
  );
}

const FEATURES = [
  {
    icon: Brain,
    title: "AI roadmap generation",
    desc: "Weekly and monthly goals synthesized from every signal in your profile — powered by advanced AI.",
  },
  {
    icon: GitBranch,
    title: "Dynamic re-planning",
    desc: "Complete a case study, miss a deadline, learn a new skill — the roadmap regenerates automatically.",
  },
  {
    icon: Target,
    title: "Missing-skill detection",
    desc: "Explicit gaps between your current stack and target role, with dependency graph.",
  },
  {
    icon: Gauge,
    title: "Promotion & job readiness",
    desc: "Two live scores that tell you exactly where you stand and what unlocks the next level.",
  },
  {
    icon: Sparkles,
    title: "Recommended case studies",
    desc: "Curated CS-XXX picks with a reason — sized to your current difficulty band.",
  },
  {
    icon: LineChart,
    title: "Mentor insights",
    desc: "Mentors see AI-suggested next projects and difficulty per intern, at a glance.",
  },
];

const STEPS = [
  {
    title: "Ingest signals",
    desc: "Skills, GitHub, case studies, reviews, coding speed, attendance.",
  },
  { title: "AI plan", desc: "Our AI engine produces goals, gaps, dependencies and readiness scores." },
  {
    title: "Ship & review",
    desc: "Interns execute; mentors verify and rate; events feed back in.",
  },
  {
    title: "Regenerate",
    desc: "The roadmap evolves after every completion, review or failed check.",
  },
];

const ROLES = [
  {
    icon: Zap,
    title: "Intern",
    items: [
      "Personalized weekly + monthly goals",
      "Strong / weak skill heatmap",
      "Recommended case studies with reasons",
      "Estimated graduation date & job readiness",
    ],
  },
  {
    icon: Users,
    title: "Mentor",
    items: [
      "Full view of assigned interns",
      "AI-suggested next project & difficulty",
      "One-click roadmap regeneration",
      "Rate reviews that feed the engine",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Admin",
    items: [
      "Manage roles across the org",
      "Curate the case-study catalog",
      "See engagement across all interns",
      "Trigger org-wide re-planning",
    ],
  },
];
