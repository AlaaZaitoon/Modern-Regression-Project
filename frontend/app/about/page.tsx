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
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[320px] bg-gradient-to-b from-primary/10 via-transparent to-transparent"
      />

      <header className="container sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/hue-logo.png"
            alt="Horus University Egypt"
            width={32}
            height={32}
            className="rounded"
            priority
          />
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">Smart Regression System</div>
            <div className="text-xs text-muted-foreground">About</div>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <HealthIndicator />
          <ThemeToggle />
        </div>
      </header>

      <main className="container flex flex-1 flex-col gap-12 py-10">
        {/* Hero */}
        <section className="flex flex-col items-start gap-5">
          <Button variant="outline" size="sm" asChild>
            <Link href="/">
              <ArrowLeft />
              Back to dashboard
            </Link>
          </Button>
          <Badge variant="accent" className="uppercase tracking-wider">
            Academic Project · 2026
          </Badge>
          <h1 className="text-balance max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
            Smart Regression &amp;{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Data Insight System
            </span>
          </h1>
          <p className="max-w-2xl text-balance text-base text-muted-foreground md:text-lg">
            A production-grade reimagining of a Modern Regression course project at Horus University
            Egypt. The system implements Simple and Multiple Linear Regression with full statistical
            inference — Least Squares Estimation, ANOVA, t-tests, 95% confidence intervals, and
            diagnostic plots — delivered through a FastAPI backend and a Next.js 14 dashboard.
          </p>
        </section>

        {/* Academic context */}
        <section aria-labelledby="context-heading" className="space-y-4">
          <h2 id="context-heading" className="text-2xl font-semibold tracking-tight">
            Academic context
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="space-y-2">
                <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <GraduationCap className="size-5" />
                </div>
                <CardTitle>University</CardTitle>
                <CardDescription>
                  Horus University Egypt (HUE) — Faculty of AI &amp; Informatics.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="space-y-2">
                <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Sigma className="size-5" />
                </div>
                <CardTitle>Course</CardTitle>
                <CardDescription>
                  Modern Regression — LSE, R², ANOVA, hypothesis testing, 95% CIs.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="space-y-2">
                <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
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
          <Card>
            <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-3xl">
                <span aria-hidden>👩‍🏫</span>
              </div>
              <div>
                <div className="text-xl font-semibold">Dr. Maha Hamed</div>
                <div className="text-sm text-muted-foreground">
                  Course Instructor · Faculty of AI &amp; Informatics · Horus University Egypt
                </div>
                <p className="mt-2 max-w-2xl text-sm">
                  Academic supervisor for the Modern Regression course. The system&rsquo;s statistical
                  outputs map 1-to-1 to the syllabus: Least Squares Estimation, coefficient
                  inference, ANOVA decomposition, t-tests at α = 0.05, and 95% confidence intervals.
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
                className="group relative overflow-hidden transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
                  {m.photo ? (
                    <Image
                      src={m.photo}
                      alt={m.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 20vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-5xl text-muted-foreground/40">
                      <span aria-hidden>👤</span>
                    </div>
                  )}
                  <div className="absolute left-2 top-2">
                    <Badge variant="secondary" className="font-mono">
                      {m.num}
                    </Badge>
                  </div>
                  {m.leader ? (
                    <div className="absolute right-2 top-2">
                      <Badge variant="accent">Team Lead</Badge>
                    </div>
                  ) : null}
                </div>
                <CardContent className="space-y-1 p-4">
                  <div className="text-xs font-medium uppercase tracking-wider text-primary">
                    {m.role}
                  </div>
                  <div className="text-sm font-semibold leading-tight">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.track}</div>
                  {m.portfolio ? (
                    <a
                      href={m.portfolio}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-xs font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {m.portfolio.replace(/^https?:\/\//, "")}
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
