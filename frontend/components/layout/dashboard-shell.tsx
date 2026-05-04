"use client";

import dynamic from "next/dynamic";

import { StepProgress } from "@/components/layout/step-progress";
import { StepConfigure } from "@/components/steps/step-configure";
import { StepUpload } from "@/components/steps/step-upload";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkflowStore } from "@/store/workflow-store";

// Steps 3 – 5 are never the initial step and each pull in heavy deps
// (ECharts, Framer Motion, RHF + Zod). Defer their chunks so the home
// route's First Load JS stays under budget.
const LazyStep = () => <Skeleton className="h-96 w-full" />;
const StepVisualize = dynamic(
  () => import("@/components/steps/step-visualize").then((m) => m.StepVisualize),
  { ssr: false, loading: LazyStep },
);
const StepResults = dynamic(
  () => import("@/components/steps/step-results").then((m) => m.StepResults),
  { ssr: false, loading: LazyStep },
);
const StepReport = dynamic(
  () => import("@/components/steps/step-report").then((m) => m.StepReport),
  { ssr: false, loading: LazyStep },
);

/**
 * Client-side step router. Reads the active step from the (in-memory)
 * workflow store and renders the matching panel.
 */
export function DashboardShell() {
  const currentStep = useWorkflowStore((s) => s.currentStep);

  return (
    <div className="space-y-8">
      <StepProgress />
      {currentStep === 1 ? (
        <StepUpload />
      ) : currentStep === 2 ? (
        <StepConfigure />
      ) : currentStep === 3 ? (
        <StepVisualize />
      ) : currentStep === 4 ? (
        <StepResults />
      ) : (
        <StepReport />
      )}
    </div>
  );
}
