"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, PlayCircle, Sparkles } from "lucide-react";
import { z } from "zod";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { usePredict } from "@/hooks/use-predict";
import { formatNumber } from "@/lib/formatters";
import type { PredictResponse, TrainResponse } from "@/lib/types";

interface Props {
  model: TrainResponse;
  lastPrediction: PredictResponse | null;
}

/**
 * Builds a numeric input per predictor from `model.x_cols`. Seeds each field
 * with the corresponding mean from the training set (taken from the cached
 * `predictions` array, which we already have in the store) so the user has
 * a reasonable starting point.
 */
export function PredictionForm({ model, lastPrediction }: Props) {
  const { x_cols, y_col, model_id } = model;
  const predict = usePredict();

  // Build a dynamic Zod schema: one finite-number field per predictor.
  const schema = React.useMemo(() => {
    const shape: Record<string, z.ZodType<number>> = {};
    for (const col of x_cols) {
      shape[col] = z
        .number({ invalid_type_error: "Must be a number" })
        .finite("Value must be finite");
    }
    return z.object(shape);
  }, [x_cols]);

  type FormValues = Record<string, number>;

  const defaults = React.useMemo<FormValues>(() => {
    const init: FormValues = {};
    for (const col of x_cols) {
      // Mean of training X values for this predictor (backend-provided).
      const sample = model.predictions
        .map((p) => p.x_values[col])
        .filter((v): v is number => Number.isFinite(v));
      const mean =
        sample.length > 0 ? sample.reduce((a, b) => a + b, 0) / sample.length : 0;
      init[col] = Number(mean.toFixed(4));
    }
    return init;
  }, [x_cols, model.predictions]);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
    mode: "onBlur",
  });

  const onSubmit = handleSubmit((values) => {
    predict.mutate({ modelId: model_id, xValues: values });
  });

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-accent/15 text-accent-foreground">
            <Sparkles className="size-5" aria-hidden />
          </div>
          <div>
            <CardTitle>Predict</CardTitle>
            <CardDescription>
              Supply values for each predictor — the backend returns the point estimate and a{" "}
              {Math.round((lastPrediction?.confidence_level ?? 0.95) * 100)}% prediction interval.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {x_cols.map((col) => (
              <div key={col} className="space-y-1.5">
                <Label htmlFor={`predict-${col}`}>{col}</Label>
                <Input
                  id={`predict-${col}`}
                  type="number"
                  step="any"
                  inputMode="decimal"
                  aria-invalid={errors[col] ? "true" : "false"}
                  {...register(col, { valueAsNumber: true })}
                />
                {errors[col] ? (
                  <p className="text-xs text-destructive">
                    {errors[col]?.message?.toString() ?? "Invalid value"}
                  </p>
                ) : null}
              </div>
            ))}
          </div>

          <Button type="submit" disabled={!isValid || predict.isPending} className="w-full sm:w-auto">
            {predict.isPending ? (
              <>
                <Loader2 className="animate-spin" />
                Predicting…
              </>
            ) : (
              <>
                <PlayCircle />
                Predict {y_col}
              </>
            )}
          </Button>
        </form>

        {lastPrediction ? (
          <>
            <Separator />
            <PredictionResult response={lastPrediction} yCol={y_col} />
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

function PredictionResult({
  response,
  yCol,
}: {
  response: PredictResponse;
  yCol: string;
}) {
  const [lo, hi] = response.prediction_interval;
  const ciPct = Math.round(response.confidence_level * 100);

  return (
    <Alert variant="info" className="animate-fade-in">
      <Sparkles className="size-4" aria-hidden />
      <AlertTitle className="flex items-center gap-2">
        Predicted {yCol}
        <Badge variant="accent" className="text-[10px]">
          {ciPct}% PI
        </Badge>
      </AlertTitle>
      <AlertDescription className="space-y-2">
        <div className="text-3xl font-semibold tabular-nums text-foreground">
          {formatNumber(response.prediction, 4)}
        </div>
        <div className="text-xs text-muted-foreground">
          Interval:{" "}
          <span className="font-medium tabular-nums text-foreground">
            [{formatNumber(lo, 4)}, {formatNumber(hi, 4)}]
          </span>
        </div>
        <div className="text-sm">{response.interpretation}</div>
      </AlertDescription>
    </Alert>
  );
}
