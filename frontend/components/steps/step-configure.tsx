"use client";

import { ArrowLeft, Database } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ModelConfigForm } from "@/components/model/model-config-form";
import { useWorkflowStore } from "@/store/workflow-store";

/** Step 2 — Model configuration. */
export function StepConfigure() {
  const dataset = useWorkflowStore((s) => s.lastDataset);
  const setStep = useWorkflowStore((s) => s.setStep);

  if (!dataset) {
    return (
      <section className="space-y-4 animate-fade-in">
        <Alert variant="info">
          <Database className="size-4" aria-hidden />
          <AlertTitle>No dataset loaded.</AlertTitle>
          <AlertDescription>
            Upload a CSV first — the model configuration form needs to know which numeric columns
            are available.
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => setStep(1)}>
          <ArrowLeft />
          Back to upload
        </Button>
      </section>
    );
  }

  return (
    <section className="space-y-6 animate-fade-in">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-gradient">Configure your model</h2>
          <p className="text-sm text-muted-foreground">
            Working with <span className="font-medium text-foreground">{dataset.filename}</span> ·{" "}
            {dataset.numeric_columns.length} numeric columns available.
          </p>
        </div>
        <Button variant="outline" onClick={() => setStep(1)}>
          <ArrowLeft />
          Back
        </Button>
      </header>

      <ModelConfigForm dataset={dataset} />
    </section>
  );
}
