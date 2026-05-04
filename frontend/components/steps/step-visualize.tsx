"use client";

import { ArrowLeft, ArrowRight, BarChart3, Database } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActualVsPredicted } from "@/components/charts/actual-vs-predicted";
import { CooksDistance } from "@/components/charts/cooks-distance";
import { CorrelationHeatmap } from "@/components/charts/correlation-heatmap";
import { FeatureImportanceBar } from "@/components/charts/feature-importance-bar";
import { ResidualsBar } from "@/components/charts/residuals-bar";
import { ScatterRegression } from "@/components/charts/scatter-regression";
import { useWorkflowStore } from "@/store/workflow-store";

/**
 * Step 3 — Visualizations. Reads the cached TrainResponse from the workflow
 * store and dispatches to the six chart components. No API calls happen here.
 */
export function StepVisualize() {
  const trainResponse = useWorkflowStore((s) => s.lastTrainResponse);
  const setStep = useWorkflowStore((s) => s.setStep);

  if (!trainResponse) {
    return (
      <section className="space-y-4 animate-fade-in">
        <Alert variant="info">
          <Database className="size-4" aria-hidden />
          <AlertTitle>No trained model.</AlertTitle>
          <AlertDescription>
            Configure and train a model in Step 2 — the visualizations read directly from the
            backend&rsquo;s training response.
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => setStep(2)}>
          <ArrowLeft />
          Back to model configuration
        </Button>
      </section>
    );
  }

  const {
    model_type,
    x_cols,
    y_col,
    predictions,
    coefficients,
    feature_importance,
    cooks_distance,
    correlation_matrix,
    metrics,
  } = trainResponse;

  const isSimple = model_type === "simple" && x_cols.length === 1;

  // Restrict the correlation heatmap to the modeled variables to keep it legible.
  const modelVars = [y_col, ...x_cols];

  return (
    <section className="space-y-6 animate-fade-in">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <BarChart3 className="size-5" aria-hidden />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-gradient">Visualizations</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSimple ? "Simple" : "Multiple"} regression · {x_cols.length} predictor
            {x_cols.length === 1 ? "" : "s"} · R² ={" "}
            <span className="font-medium text-foreground">{metrics.r2.toFixed(4)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setStep(2)}>
            <ArrowLeft />
            Back
          </Button>
          <Button onClick={() => setStep(4)}>
            Continue to results
            <ArrowRight />
          </Button>
        </div>
      </header>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 p-4 text-xs text-muted-foreground">
          <Badge variant="outline">Every chart reads from the cached TrainResponse.</Badge>
          <span>Nothing is recomputed on the client.</span>
        </CardContent>
      </Card>

      <Tabs defaultValue={isSimple ? "scatter" : "fit"} className="w-full">
        <TabsList className="flex w-full flex-wrap overflow-x-auto">
          {isSimple ? <TabsTrigger value="scatter">Scatter + line</TabsTrigger> : null}
          <TabsTrigger value="fit">Actual vs predicted</TabsTrigger>
          <TabsTrigger value="residuals">Residuals</TabsTrigger>
          <TabsTrigger value="importance">Feature importance</TabsTrigger>
          <TabsTrigger value="cooks">Cook&rsquo;s distance</TabsTrigger>
          <TabsTrigger value="correlation">Correlation</TabsTrigger>
        </TabsList>

        {isSimple ? (
          <TabsContent value="scatter">
            <ScatterRegression
              xCol={x_cols[0]}
              yCol={y_col}
              predictions={predictions}
              coefficients={coefficients}
            />
          </TabsContent>
        ) : null}

        <TabsContent value="fit">
          <ActualVsPredicted yCol={y_col} predictions={predictions} />
        </TabsContent>

        <TabsContent value="residuals">
          <ResidualsBar predictions={predictions} />
        </TabsContent>

        <TabsContent value="importance">
          <FeatureImportanceBar items={feature_importance} />
        </TabsContent>

        <TabsContent value="cooks">
          <CooksDistance points={cooks_distance} />
        </TabsContent>

        <TabsContent value="correlation">
          <CorrelationHeatmap
            matrix={correlation_matrix}
            filterColumns={modelVars}
            title="Correlation (model variables)"
            description="Pairwise Pearson correlation between the target and the selected predictors."
          />
        </TabsContent>
      </Tabs>
    </section>
  );
}
