import { Suspense } from "react";
import type { Metadata } from "next";

import { ReportClient } from "@/app/report/report-client";
import { Skeleton } from "@/components/ui/skeleton";

import "./report.css";

export const metadata: Metadata = {
  title: "Report — Smart Regression System",
  description:
    "Print-optimized consolidation of the Smart Regression System results, visualizations, and prediction summary.",
  robots: { index: false, follow: false },
  other: {
    "color-scheme": "light",
  },
};

/**
 * Standalone print-friendly route. `ReportClient` uses `useSearchParams` for
 * the `?model=<id>` fallback, which Next.js requires to be read inside a
 * Suspense boundary so the rest of the tree can be statically prepared.
 */
export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <main className="container space-y-4 py-12">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </main>
      }
    >
      <ReportClient />
    </Suspense>
  );
}
