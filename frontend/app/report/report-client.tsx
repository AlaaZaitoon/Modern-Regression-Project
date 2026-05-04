"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, Download, Loader2, Printer } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useModel } from "@/hooks/use-model";
import { ApiError } from "@/lib/api";
import { AnovaTable } from "@/components/evaluation/anova-table";
import { CiTable } from "@/components/evaluation/ci-table";
import { EquationDisplay } from "@/components/evaluation/equation-display";
import { MetricsGrid } from "@/components/evaluation/metrics-grid";
import { R2Gauge } from "@/components/evaluation/r2-gauge";
import { TTestTable } from "@/components/evaluation/t-test-table";
import { ActualVsPredicted } from "@/components/charts/actual-vs-predicted";
import { CooksDistance } from "@/components/charts/cooks-distance";
import { CorrelationHeatmap } from "@/components/charts/correlation-heatmap";
import { FeatureImportanceBar } from "@/components/charts/feature-importance-bar";
import { ResidualsBar } from "@/components/charts/residuals-bar";
import { ScatterRegression } from "@/components/charts/scatter-regression";
import { RecommendationsPanel } from "@/components/recommendations/recommendations-panel";
import {
  ModelFormulas,
  R2Formula,
  SumOfSquaresFormulas,
  InferenceFormulas,
  CiFormula,
} from "@/components/evaluation/lse-formulas";
import { DataTable } from "@/components/evaluation/data-table";
import { api } from "@/lib/api";
import { useWorkflowStore } from "@/store/workflow-store";

/**
 * Full on-one-page render of Steps 3 + 4 for printing or PDF export via
 * the browser's native print dialog.
 *
 * Resolution order for the model:
 *   1. The in-tab Zustand store (instant — same tab where the user trained).
 *   2. `?model=<id>` query param + `GET /models/:id` (new tab / shared link).
 * Finally, if neither is available, the empty state is shown.
 */
export function ReportClient() {
  const storeModel = useWorkflowStore((s) => s.lastTrainResponse);
  const searchParams = useSearchParams();
  const urlModelId = searchParams.get("model");

  // Only hit the API when the store is empty and a URL id is present.
  const fallbackId = storeModel ? null : urlModelId;
  const fallback = useModel(fallbackId);

  const model = storeModel ?? fallback.data ?? null;

  if (!model) {
    // 1. Still loading the URL-driven fallback.
    if (fallbackId && fallback.isLoading) {
      return (
        <main className="container space-y-4 py-12 animate-pulse">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin text-primary" aria-hidden />
            Loading model <span className="font-mono text-foreground">{fallbackId}</span>…
          </div>
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </main>
      );
    }

    // 2. Backend couldn't find the model (restarted or invalid ID).
    if (fallbackId && fallback.isError) {
      return (
        <main className="container max-w-2xl py-20 flex flex-col items-center justify-center text-center animate-fade-in">
          <div className="flex size-20 items-center justify-center rounded-full bg-red-500/10 text-red-500 mb-6">
            <AlertTriangle className="size-10" aria-hidden />
          </div>
          <h2 className="text-3xl font-bold tracking-tight mb-3">Model Not Found</h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-md">
            The backend no longer has this model in memory. This usually happens when the server restarts. Please re-train your model to generate a fresh report.
          </p>
          <Button asChild size="lg" className="rounded-full shadow-lg shadow-primary/20">
            <Link href="/">
              <ArrowLeft className="mr-2 size-4" />
              Back to Dashboard
            </Link>
          </Button>
        </main>
      );
    }

    // 3. No id at all — user opened /report cold.
    return (
      <main className="container max-w-2xl py-20 flex flex-col items-center justify-center text-center animate-fade-in">
        <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary mb-6">
          <Loader2 className="size-10" aria-hidden />
        </div>
        <h2 className="text-3xl font-bold tracking-tight mb-3">No Model Loaded</h2>
        <p className="text-muted-foreground text-lg mb-8 max-w-md">
          Reports are linked from the dashboard after training. Opening this route directly does not know which model to render.
        </p>
        <Button asChild size="lg" className="rounded-full shadow-lg shadow-primary/20">
          <Link href="/">
            <ArrowLeft className="mr-2 size-4" />
            Go to Dashboard
          </Link>
        </Button>
      </main>
    );
  }

  const pdfUrl = api.exportPdfUrl(model.model_id);
  const isSimple = model.model_type === "simple" && model.x_cols.length === 1;
  const modelVars = [model.y_col, ...model.x_cols];

  return <ReportBody model={model} pdfUrl={pdfUrl} isSimple={isSimple} modelVars={modelVars} />;
}

interface ReportBodyProps {
  model: NonNullable<ReturnType<typeof useWorkflowStore.getState>["lastTrainResponse"]>;
  pdfUrl: string;
  isSimple: boolean;
  modelVars: string[];
}

function ReportBody({ model, pdfUrl, isSimple, modelVars }: ReportBodyProps) {
  // The dataset profile lives only in the tab where it was uploaded.
  // When `/report` is opened in a fresh tab via `?model=<id>`, this is
  // `null` and `RecommendationsPanel` simply skips the data-quality
  // section — exactly the desired graceful-degradation behaviour.
  const dataset = useWorkflowStore((s) => s.lastDataset);
  // ── Chart-aware `beforeprint` / `afterprint` handler ──
  // ECharts attaches its canvas at a size derived from its parent on first
  // paint. When the browser switches to the print media type the viewport
  // changes but ECharts doesn't observe it — firing a synthetic `resize`
  // makes every chart redraw at the new print dimensions.
  //
  // We fire the resize twice: once immediately (so ECharts starts the
  // reflow), and once after a short delay (so canvas painting completes
  // before the browser rasterizes the page). `afterprint` restores the
  // on-screen sizes.
  React.useEffect(() => {
    const redraw = () => {
      window.dispatchEvent(new Event("resize"));
      // Second deferred resize — gives ECharts time to finish painting
      // the canvas at the print viewport before Chrome captures it.
      setTimeout(() => window.dispatchEvent(new Event("resize")), 200);
    };
    window.addEventListener("beforeprint", redraw);
    window.addEventListener("afterprint", redraw);
    return () => {
      window.removeEventListener("beforeprint", redraw);
      window.removeEventListener("afterprint", redraw);
    };
  }, []);

  // The report always has charts in this mode, so mark the root with
  // `.has-charts` to activate the chart-specific print CSS rules.
  // The tables-only backend-PDF export never hits this component.
  const hasCharts = true;

  return (
    <div className={`report-root${hasCharts ? " has-charts" : ""}`}>
      {/* Toolbar (hidden on print). */}
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/">
            <ArrowLeft />
            Back to dashboard
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer />
            Print / Save as PDF
          </Button>
          <Button asChild size="sm" variant="accent">
            <a href={pdfUrl} target="_blank" rel="noreferrer" download>
              <Download />
              Backend PDF
            </a>
          </Button>
        </div>
      </div>

      {/* ── Header ── */}
      <header className="report-section report-header flex items-center gap-4 border-b pb-4">
        <Image
          src="/hue-logo.png"
          alt="Horus University Egypt"
          width={44}
          height={44}
          className="rounded"
        />
        <div className="flex-1">
          <h1 className="report-title text-2xl font-semibold tracking-tight">Smart Regression Report</h1>
          <p className="text-xs text-muted-foreground">
            Horus University Egypt · Faculty of AI &amp; Informatics · Supervisor: Dr. Maha Hamed
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2 text-xs">
          <Badge variant="secondary">
            {isSimple ? "Simple" : "Multiple"} regression
          </Badge>
          <Badge variant="outline">Target: {model.y_col}</Badge>
          <Badge variant="outline">
            {model.x_cols.length} predictor{model.x_cols.length === 1 ? "" : "s"}
          </Badge>
        </div>
      </header>

      {/* ── 1. MODEL THEORY → EQUATION → DATA TABLE ── */}
      <section className="report-section">
        <ModelFormulas modelType={model.model_type === "simple" ? "simple" : "multiple"} />
      </section>
      <section className="report-section">
        <EquationDisplay model={model} />
      </section>
      <section className="report-section">
        <DataTable
          predictions={model.predictions}
          coefficients={model.coefficients}
          xCols={model.x_cols}
          yCol={model.y_col}
          sampleMeans={model.sample_means}
        />
      </section>

      {/* ── 2. R² THEORY → METRICS → R² GAUGE ── */}
      <section className="report-section">
        <R2Formula modelType={model.model_type === "simple" ? "simple" : "multiple"} />
      </section>
      <section className="report-section">
        <MetricsGrid metrics={model.metrics} modelType={model.model_type === "simple" ? "simple" : "multiple"} />
      </section>
      <section className="report-section grid gap-4 lg:grid-cols-2">
        <R2Gauge r2={model.metrics.r2} adjR2={model.metrics.adj_r2} modelType={model.model_type === "simple" ? "simple" : "multiple"} />
        <RecommendationsPanel model={model} dataset={dataset} />
      </section>

      {/* ── 3. SST/SSR/SSE THEORY → ANOVA ── */}
      <section className="report-section">
        <SumOfSquaresFormulas />
      </section>
      <section className="report-section">
        <AnovaTable anova={model.anova} />
      </section>

      {/* ── 4. INFERENCE THEORY → T-TESTS ── */}
      <section className="report-section">
        <InferenceFormulas modelType={model.model_type === "simple" ? "simple" : "multiple"} />
      </section>
      <section className="report-section">
        <TTestTable rows={model.t_tests} />
      </section>

      {/* ── 5. CI THEORY → CI TABLE ── */}
      <section className="report-section">
        <CiFormula />
      </section>
      <section className="report-section">
        <CiTable intervals={model.confidence_intervals} />
      </section>

      {/* ── Diagnostics: each chart gets its OWN page ──
           The .diagnostics-section wrapper starts on a new page.
           Every .diagnostic-chart-wrapper has break-before: page
           so charts NEVER overlap or share a page.
           The first chart skips its break to stay with the heading. */}
      <div className="diagnostics-section">
        <div className="diagnostics-section-header">
          <h2 className="mb-3 text-lg font-semibold tracking-tight">Diagnostics</h2>
        </div>

        <div className="diagnostics-chart-grid">
        {/* Scatter plot (simple regression only) */}
        {isSimple ? (
          <div className="diagnostic-chart-wrapper">
            <ScatterRegression
              xCol={model.x_cols[0]}
              yCol={model.y_col}
              predictions={model.predictions}
              coefficients={model.coefficients}
            />
          </div>
        ) : null}

        {/* Actual vs Predicted */}
        <div className="diagnostic-chart-wrapper">
          <ActualVsPredicted yCol={model.y_col} predictions={model.predictions} />
        </div>

        {/* Residuals */}
        <div className="diagnostic-chart-wrapper">
          <ResidualsBar predictions={model.predictions} />
        </div>

        {/* Feature importance */}
        <div className="diagnostic-chart-wrapper">
          <FeatureImportanceBar items={model.feature_importance} />
        </div>

        {/* Cook's distance */}
        <div className="diagnostic-chart-wrapper">
          <CooksDistance points={model.cooks_distance} />
        </div>

        {/* Correlation heatmap */}
        <div className="diagnostic-chart-wrapper">
          <CorrelationHeatmap
            matrix={model.correlation_matrix}
            filterColumns={modelVars}
            title="Correlation (model variables)"
            description="Pairwise Pearson correlation between the target and the selected predictors."
          />
        </div>
      </div>

      </div>
      {/* ── Footer ── */}
      <footer className="report-footer mt-8 border-t pt-4 text-center text-xs text-muted-foreground">
        Generated by the Smart Regression System · Model ID:{" "}
        <span className="font-mono">{model.model_id}</span>
      </footer>
    </div>
  );
}
