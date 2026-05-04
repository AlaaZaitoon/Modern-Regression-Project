"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { useWorkflowStore, type WorkflowStep } from "@/store/workflow-store";

interface StepDef {
  num: WorkflowStep;
  label: string;
  hint: string;
}

const STEPS: StepDef[] = [
  { num: 1, label: "Upload", hint: "Load a CSV" },
  { num: 2, label: "Configure", hint: "Pick predictors" },
  { num: 3, label: "Visualize", hint: "Diagnostics" },
  { num: 4, label: "Predict", hint: "Score new inputs" },
  { num: 5, label: "Report", hint: "Export PDF" },
];

/**
 * Persistent 5-step indicator. A step is *reachable* once its prerequisites
 * are present in the store (a dataset for Step 2; a trained model for 3+).
 */
export function StepProgress() {
  const currentStep = useWorkflowStore((s) => s.currentStep);
  const datasetId = useWorkflowStore((s) => s.datasetId);
  const modelId = useWorkflowStore((s) => s.modelId);
  const setStep = useWorkflowStore((s) => s.setStep);

  const reach = (n: WorkflowStep): boolean => {
    if (n === 1) return true;
    if (n === 2) return Boolean(datasetId);
    return Boolean(modelId);
  };

  return (
    <nav aria-label="Workflow steps" className="w-full">
      <ol className="flex w-full items-center gap-1 overflow-x-auto pb-2 sm:gap-2">
        {STEPS.map((step, idx) => {
          const isCurrent = step.num === currentStep;
          const isComplete = step.num < currentStep && reach(step.num);
          const isReachable = reach(step.num);

          return (
            <li key={step.num} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                disabled={!isReachable}
                onClick={() => isReachable && setStep(step.num)}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "group flex flex-1 items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors min-w-[160px]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isCurrent && "border-primary bg-primary/5",
                  isComplete && !isCurrent && "border-success/50 bg-success/5",
                  !isCurrent && !isComplete && isReachable && "border-border hover:bg-muted/50",
                  !isReachable && "cursor-not-allowed border-dashed opacity-60",
                )}
              >
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-1 ring-inset",
                    isCurrent && "bg-primary text-primary-foreground ring-primary",
                    isComplete && !isCurrent && "bg-success text-success-foreground ring-success",
                    !isCurrent &&
                      !isComplete &&
                      "bg-muted text-muted-foreground ring-border",
                  )}
                >
                  {isComplete ? <Check className="size-4" aria-hidden /> : step.num}
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-medium">{step.label}</span>
                  <span className="text-xs text-muted-foreground">{step.hint}</span>
                </div>
              </button>
              {idx < STEPS.length - 1 ? (
                <div
                  aria-hidden
                  className={cn(
                    "hidden h-px w-6 sm:block",
                    isComplete ? "bg-success/50" : "bg-border",
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
