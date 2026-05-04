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
    <div className="relative flex min-h-screen flex-col">
      {/* Decorative backdrop */}
      <div className="bg-grid-slate pointer-events-none absolute inset-0 -z-10 opacity-30" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[280px] bg-gradient-to-b from-primary/10 via-transparent to-transparent"
      />

      <header className="container sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/hue-logo.png"
            alt="Horus University Egypt"
            width={36}
            height={36}
            className="rounded"
            priority
          />
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">Smart Regression System</div>
            <div className="text-xs text-muted-foreground">
              Horus University Egypt · Modern Regression
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/about"
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-block"
          >
            About
          </Link>
          <HealthIndicator />
          <ThemeToggle />
        </div>
      </header>

      <main className="container flex flex-1 flex-col gap-8 py-8">
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
