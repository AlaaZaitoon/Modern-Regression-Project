import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, GraduationCap, Sigma, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { HealthIndicator } from "@/components/layout/health-indicator";

export const metadata: Metadata = {
  title: "About — Smart Regression System",
  description:
    "The academic context and student team behind the Smart Regression System — a Horus University Egypt project supervised by Dr. Maha Hamed.",
};

interface TeamMember {
  num: string;
  name: string;
  role: string;
  track: string;
  photo: string | null;
  leader?: boolean;
  portfolio?: string;
}

/**
 * Roster is the source of truth for team member display. Photos live in
 * `/public/team/*` (copied from the legacy vanilla project during M2.5).
 */
const TEAM: TeamMember[] = [
  {
    num: "#01",
    name: "Alaa Saber Mohamed",
    role: "Full Stack Developer",
    track: "Intelligent System",
    photo: "/team/alaa.jpeg",
    leader: true,
    portfolio: "https://3laa.site",
  },
  { num: "#02", name: "Noor Walid Awad", role: "Developer", track: "Data Science", photo: "/team/noor.jpeg" },
  { num: "#03", name: "Mohamed Ahmed Aboalsaad", role: "Developer", track: "Intelligent System", photo: "/team/mohamed.jpeg" },
  { num: "#04", name: "Amgad Amr Ahmed", role: "Algorithm Developer", track: "Intelligent System", photo: "/team/amgad.jpeg" },
  { num: "#05", name: "Alaa Abdelmagid Mohamed", role: "Developer", track: "Intelligent System", photo: "/team/alaa2.jpeg" },
  { num: "#06", name: "Kenzy Farag Ebrahim Kassem", role: "Developer", track: "Intelligent System", photo: "/team/kenzy.jpeg" },
  { num: "#07", name: "Abdullah Elbadry", role: "Developer", track: "Intelligent System", photo: "/team/abdullah.png" },
  { num: "#08", name: "Yousef Ahmed Elsaeed", role: "Developer", track: "Data Science", photo: "/team/yousef.jpeg" },
  { num: "#09", name: "Hana Ahmed Haggag", role: "Developer", track: "Data Science", photo: "/team/hana.jpeg" },
  { num: "#10", name: "Nouran Abdel-hy Mosaad", role: "Developer", track: "Intelligent System", photo: "/team/nouran.jpeg" },
];

export default function AboutPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Clean, high-performance background */}
      <div className="pointer-events-none absolute inset-0 -z-20 bg-background" />
      <div className="bg-grid-slate pointer-events-none absolute inset-0 -z-10 opacity-60" />
      
      {/* Performant ambient glowing orbs without mix-blend-mode and smaller blur */}
      <div aria-hidden className="pointer-events-none absolute -top-40 -left-40 -z-10 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl dark:bg-primary/5" />
      <div aria-hidden className="pointer-events-none absolute top-20 -right-40 -z-10 h-[400px] w-[400px] rounded-full bg-accent/10 blur-3xl dark:bg-accent/5" />

      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 dark:border-white/5 glass">
        <div className="container flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-3 transition-all hover:scale-[1.02]">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg shadow-primary/25 transition-transform group-hover:rotate-3">
              <Image
                src="/hue-logo.png"
                alt="Horus University Egypt"
                width={30}
                height={30}
                className="rounded"
                priority
              />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-tight text-foreground group-hover:text-gradient transition-colors duration-300">
                Smart Regression System
              </div>
              <div className="text-[11px] font-medium text-muted-foreground">
                About The Project
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <HealthIndicator />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container relative z-10 flex flex-1 flex-col gap-12 py-10">
        {/* Hero */}
        <section className="flex flex-col items-start gap-5">
          <Button variant="outline" size="sm" asChild className="glass-card border-none shadow-sm hover:shadow-md">
            <Link href="/">
              <ArrowLeft />
              Back to dashboard
            </Link>
          </Button>
          <Badge variant="accent" className="uppercase tracking-wider shadow-sm shadow-accent/20">
            Academic Project · 2026
          </Badge>
          <h1 className="text-balance max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
            Smart Regression &amp;{" "}
            <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent animate-gradient-x">
              Data Insight System
            </span>
          </h1>
          <p className="max-w-2xl text-balance text-base text-muted-foreground md:text-lg">
            An enterprise-grade analytics platform born from the Modern Regression curriculum at Horus University Egypt. We transformed traditional statistical inference into a seamless digital experience. Powered by a high-performance FastAPI engine and a stunning Next.js 14 dashboard, the system delivers real-time Least Squares Estimation, ANOVA, rigorous hypothesis testing, and interactive diagnostic visualizations at scale.
          </p>
        </section>

        {/* Academic context */}
        <section aria-labelledby="context-heading" className="space-y-4">
          <h2 id="context-heading" className="text-2xl font-semibold tracking-tight">
            Academic context
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="glass-card border-primary/10">
              <CardHeader className="space-y-2">
                <div className="flex size-9 items-center justify-center rounded-md bg-gradient-to-br from-primary/20 to-accent/20 text-primary">
                  <GraduationCap className="size-5" />
                </div>
                <CardTitle>University</CardTitle>
                <CardDescription>
                  Horus University Egypt (HUE) — Faculty of AI &amp; Informatics.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="glass-card border-accent/10">
              <CardHeader className="space-y-2">
                <div className="flex size-9 items-center justify-center rounded-md bg-gradient-to-br from-accent/20 to-secondary/20 text-accent">
                  <Sigma className="size-5" />
                </div>
                <CardTitle>Course</CardTitle>
                <CardDescription>
                  Modern Regression — LSE, R², ANOVA, hypothesis testing, 95% CIs.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="glass-card border-secondary/10">
              <CardHeader className="space-y-2">
                <div className="flex size-9 items-center justify-center rounded-md bg-gradient-to-br from-secondary/20 to-primary/20 text-secondary">
                  <Users className="size-5" />
                </div>
                <CardTitle>Team</CardTitle>
                <CardDescription>
                  10 students from the AI &amp; Informatics faculty, academic year 2026.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* Supervisor */}
        <section aria-labelledby="supervisor-heading" className="space-y-4">
          <h2 id="supervisor-heading" className="text-2xl font-semibold tracking-tight">
            Course instructor
          </h2>
          <Card className="glass-card overflow-hidden animated-border">
            <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center relative z-10 bg-card/40 backdrop-blur-3xl m-[1px] rounded-xl">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 text-3xl shadow-inner">
                <span aria-hidden>👩‍🏫</span>
              </div>
              <div>
                <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">Dr. Maha Hamed</div>
                <div className="text-sm font-medium text-primary/80 dark:text-primary/60">
                  Course Instructor · Faculty of AI &amp; Informatics · Horus University Egypt
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Visionary academic supervisor bridging the gap between theoretical statistics and modern software engineering. This platform was architected under her guidance to translate complex syllabus concepts—Least Squares Estimation, ANOVA decomposition, and rigorous coefficient inference—into a production-grade, interactive analytics experience.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Team grid */}
        <section aria-labelledby="team-heading" className="space-y-6">
          <div>
            <h2 id="team-heading" className="text-2xl font-semibold tracking-tight">
              The team
            </h2>
            <p className="text-sm text-muted-foreground">
              10 students from the Faculty of AI &amp; Informatics, led by Alaa Saber Mohamed.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {TEAM.map((m) => (
              <Card
                key={m.num}
                className="group relative overflow-hidden glass-card transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10"
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
                  {m.photo ? (
                    <Image
                      src={m.photo}
                      alt={m.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 20vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-5xl bg-gradient-to-br from-muted to-muted/50 text-muted-foreground/40">
                      <span aria-hidden>👤</span>
                    </div>
                  )}
                  {/* Subtle overlay gradient on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  
                  <div className="absolute left-2 top-2 z-10 transition-transform duration-300 group-hover:-translate-y-1">
                    <Badge variant="secondary" className="font-mono backdrop-blur-md bg-secondary/80">
                      {m.num}
                    </Badge>
                  </div>
                  {m.leader ? (
                    <div className="absolute right-2 top-2 z-10 transition-transform duration-300 group-hover:-translate-y-1">
                      <Badge variant="accent" className="shadow-lg shadow-accent/30 animate-pulse">Team Lead</Badge>
                    </div>
                  ) : null}
                </div>
                <CardContent className="space-y-1 p-4 relative z-10 bg-card/80 backdrop-blur-sm border-t border-white/5">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-primary/80 dark:text-primary/70">
                    {m.role}
                  </div>
                  <div className="text-sm font-semibold leading-tight group-hover:text-primary transition-colors">{m.name}</div>
                  <div className="text-[11px] text-muted-foreground font-medium">{m.track}</div>
                  {m.portfolio ? (
                    <a
                      href={m.portfolio}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-[11px] font-bold text-accent transition-colors hover:text-primary"
                    >
                      {m.portfolio.replace(/^https?:\/\//, "")} <span aria-hidden>↗</span>
                    </a>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="container flex flex-wrap items-center justify-between gap-2 border-t py-4 text-xs text-muted-foreground">
        <span>
          © 2026 Horus University — Egypt · Faculty of AI &amp; Informatics · Supervisor:{" "}
          <strong className="text-foreground">Dr. Maha Hamed</strong>
        </span>
        <Link
          href="/"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Back to dashboard
        </Link>
      </footer>
    </div>
  );
}
