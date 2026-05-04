import Image from "next/image";
import Link from "next/link";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { HealthIndicator } from "@/components/layout/health-indicator";
import { ThemeToggle } from "@/components/layout/theme-toggle";

/**
 * Resolve the FastAPI Swagger UI URL from the API base.
 *
 * The Swagger route (`/docs`) is mounted at the server root, not under
 * `/api/v1`, so we must replace the path with `/docs` rather than appending
 * relative segments (which the browser would collapse into `/api/docs`).
 */
function swaggerUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
  try {
    return new URL("/docs", base).toString();
  } catch {
    return "http://localhost:8000/docs";
  }
}

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
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
                Horus University Egypt · Analytics
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/about"
              className="hidden text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground sm:inline-block"
            >
              About
            </Link>
            <HealthIndicator />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container relative flex flex-1 flex-col gap-8 py-10 z-10">
        <DashboardShell />
      </main>

      <footer className="container flex flex-wrap items-center justify-between gap-2 border-t py-4 text-xs text-muted-foreground">
        <span>
          © 2026 Horus University Egypt · Faculty of AI &amp; Informatics · Supervisor:{" "}
          <strong className="text-foreground">Dr. Maha Hamed</strong>
        </span>
        <div className="flex items-center gap-4">
          <Link
            href="/about"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            About &amp; team
          </Link>
          <a
            href={swaggerUrl()}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            API docs
          </a>
        </div>
      </footer>
    </div>
  );
}
