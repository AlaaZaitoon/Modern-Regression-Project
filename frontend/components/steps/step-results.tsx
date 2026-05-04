"use client";

import { ArrowLeft, ArrowRight, BarChart3, Database } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AnovaTable } from "@/components/evaluation/anova-table";
import { CiTable } from "@/components/evaluation/ci-table";
import { DataTable } from "@/components/evaluation/data-table";
import { EquationDisplay } from "@/components/evaluation/equation-display";
import {
  ModelFormulas,
  R2Formula,
  SumOfSquaresFormulas,
  InferenceFormulas,
  CiFormula,
} from "@/components/evaluation/lse-formulas";
import { MetricsGrid } from "@/components/evaluation/metrics-grid";
import { PredictionForm } from "@/components/evaluation/prediction-form";
import { R2Gauge } from "@/components/evaluation/r2-gauge";
import { TTestTable } from "@/components/evaluation/t-test-table";
import { RecommendationsTrigger } from "@/components/recommendations/recommendations-trigger";
import { useWorkflowStore } from "@/store/workflow-store";

/**
 * Step 4 — Results & Prediction.
 *
 * Layout: each **formula card** appears immediately before the
 * corresponding **computed result** so the user understands how
 * each value was derived.
 */
export function StepResults() {
  const model = useWorkflowStore((s) => s.lastTrainResponse);
  const dataset = useWorkflowStore((s) => s.lastDataset);
  const lastPrediction = useWorkflowStore((s) => s.lastPrediction);
  const setStep = useWorkflowStore((s) => s.setStep);

  if (!model) {
    return (
      <section className="space-y-4 animate-fade-in">
        <Alert variant="info">
          <Database className="size-4" aria-hidden />
          <AlertTitle>No trained model.</AlertTitle>
          <AlertDescription>
            Train a model in Step 2 — the evaluation reads directly from the backend&rsquo;s
            training response.
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => setStep(2)}>
          <ArrowLeft />
          Back to model configuration
        </Button>
      </section>
    );
  }

  const mt = model.model_type === "simple" ? "simple" : "multiple" as const;

  return (
    <section className="space-y-6 animate-fade-in">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <BarChart3 className="size-5" aria-hidden />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-gradient">Results &amp; prediction</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Equation, fit quality, statistical inference, and a live prediction form.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setStep(3)}>
            <ArrowLeft />
            Back to charts
          </Button>
          <Button onClick={() => setStep(5)}>
            Continue to report
            <ArrowRight />
          </Button>
        </div>
      </header>

      {/* 1. MODEL THEORY → EQUATION → DATA TABLE */}
      <ModelFormulas modelType={mt} />
      <EquationDisplay model={model} />
      <DataTable
        predictions={model.predictions}
        coefficients={model.coefficients}
        xCols={model.x_cols}
        yCol={model.y_col}
        sampleMeans={model.sample_means}
      />

      {/* 2. R² THEORY → METRICS → R² GAUGE */}
      <R2Formula modelType={mt} />
      <MetricsGrid metrics={model.metrics} modelType={mt} />

      <div className="grid gap-6 lg:grid-cols-2">
        <R2Gauge r2={model.metrics.r2} adjR2={model.metrics.adj_r2} modelType={mt} />
        <RecommendationsTrigger model={model} dataset={dataset} />
      </div>

      {/* 3. SST/SSR/SSE THEORY → ANOVA TABLE */}
      <SumOfSquaresFormulas />
      <AnovaTable anova={model.anova} />

      {/* 4. INFERENCE THEORY → T-TEST TABLE */}
      <InferenceFormulas modelType={mt} />
      <TTestTable rows={model.t_tests} />

      {/* 5. CI THEORY → CI TABLE */}
      <CiFormula />
      <CiTable intervals={model.confidence_intervals} />

      {/* 6. PREDICTION */}
      <PredictionForm model={model} lastPrediction={lastPrediction} />
    </section>
  );
}
