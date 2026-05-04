"use client";

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CorrelationHeatmap } from "@/components/charts/correlation-heatmap";
import { DatasetPreviewTable } from "@/components/upload/dataset-preview-table";
import { DatasetStatsTable } from "@/components/upload/dataset-stats-table";
import { DatasetSummary } from "@/components/upload/dataset-summary";
import { MissingValuesCard } from "@/components/upload/missing-values-card";
import { UploadTabs } from "@/components/upload/upload-tabs";
import { useWorkflowStore } from "@/store/workflow-store";

/** Step 1 — Data upload & exploration. */
export function StepUpload() {
  const dataset = useWorkflowStore((s) => s.lastDataset);
  const setStep = useWorkflowStore((s) => s.setStep);

  if (!dataset) {
    return (
      <section className="space-y-6 animate-fade-in">
        <header>
          <h2 className="text-2xl font-semibold tracking-tight">Add a dataset</h2>
          <p className="text-sm text-muted-foreground">
            Drop a CSV file or build a small dataset by hand to profile its schema,
            descriptive statistics, and pairwise correlations.
          </p>
        </header>
        <UploadTabs />
      </section>
    );
  }

  return (
    <section className="space-y-6 animate-fade-in">
      <DatasetSummary dataset={dataset} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <DatasetPreviewTable dataset={dataset} />
          <DatasetStatsTable dataset={dataset} />
        </div>
        <div className="space-y-6">
          <MissingValuesCard dataset={dataset} />
          <UploadTabs />
        </div>
      </div>

      {dataset.numeric_columns.length >= 2 ? (
        <CorrelationHeatmap matrix={dataset.correlation_matrix} />
      ) : null}

      <div className="flex flex-wrap items-center gap-3 border-t pt-6">
        <Button size="lg" onClick={() => setStep(2)}>
          Continue to model configuration
          <ArrowRight />
        </Button>
        <p className="text-xs text-muted-foreground">
          Need different data? Drop another CSV above to replace the dataset.
        </p>
      </div>
    </section>
  );
}
