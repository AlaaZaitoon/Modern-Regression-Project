"use client";

import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Sigma, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { VariablePicker } from "@/components/model/variable-picker";
import { useTrainModel } from "@/hooks/use-train-model";
import type { DatasetUploadResponse, ModelType, TrainRequest } from "@/lib/types";
import { formatPercent } from "@/lib/formatters";

/**
 * Zod schema mirrors the backend validation:
 *  - simple   => exactly 1 X
 *  - multiple => >= 2 X
 *  - y not in x_cols
 *  - confidence_level in [0.80, 0.99]
 */
const schema = z
  .object({
    model_type: z.enum(["simple", "multiple"]),
    x_cols: z.array(z.string()).min(1, "Pick at least one predictor."),
    y_col: z.string().min(1, "Pick a target variable."),
    confidence_level: z.number().min(0.8).max(0.99),
  })
  .superRefine((data, ctx) => {
    if (data.model_type === "simple" && data.x_cols.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["x_cols"],
        message: "Simple regression requires exactly one predictor.",
      });
    }
    if (data.model_type === "multiple" && data.x_cols.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["x_cols"],
        message: "Multiple regression requires at least two predictors.",
      });
    }
    if (data.x_cols.includes(data.y_col)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["y_col"],
        message: "The target variable cannot also be a predictor.",
      });
    }
  });

type FormValues = z.infer<typeof schema>;

export function ModelConfigForm({ dataset }: { dataset: DatasetUploadResponse }) {
  const numeric = dataset.numeric_columns;
  const train = useTrainModel();

  // The convention across every realistic regression dataset is that the
  // response variable is the last column (Salary, Sales, Price_USD,
  // price, …). Picking the last numeric column as the default Y saves
  // the user a click on every built-in sample while still letting them
  // override it via the Select below. X defaults to the first numeric
  // column, which is guaranteed to differ from Y when `numeric.length >= 2`
  // — and the `numeric.length < 2` guard below short-circuits the
  // degenerate case.
  const defaultValues = React.useMemo<FormValues>(() => {
    const lastNumeric = numeric[numeric.length - 1] ?? "";
    const firstNumeric = numeric[0] ?? "";
    const defaultX =
      numeric.length >= 2 && firstNumeric !== lastNumeric ? firstNumeric : "";
    return {
      model_type: "simple" as ModelType,
      x_cols: defaultX ? [defaultX] : [],
      y_col: lastNumeric,
      confidence_level: 0.95,
    };
  }, [numeric]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onChange",
  });

  const modelType = watch("model_type");
  const xCols = watch("x_cols");
  const yCol = watch("y_col");
  const confidence = watch("confidence_level");

  // When switching to "simple", trim X selection down to one.
  React.useEffect(() => {
    if (modelType === "simple" && xCols.length > 1) {
      setValue("x_cols", [xCols[0]], { shouldValidate: true });
    }
  }, [modelType, xCols, setValue]);

  const onSubmit = (values: FormValues) => {
    const req: TrainRequest = {
      dataset_id: dataset.dataset_id,
      x_cols: values.x_cols,
      y_col: values.y_col,
      model_type: values.model_type,
      confidence_level: values.confidence_level,
    };
    train.mutate(req);
  };

  if (numeric.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Model configuration</CardTitle>
          <CardDescription>Not enough numeric columns to train a model.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            OLS requires at least one numeric predictor and one numeric target. Upload a dataset
            with at least two numeric columns.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sigma className="size-5 text-primary" aria-hidden />
          Model configuration
        </CardTitle>
        <CardDescription>
          Pick the model type, predictors, target, and confidence level. The backend runs OLS and
          returns full inference.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
          {/* Model type */}
          <fieldset className="space-y-3">
            <Label>Model type</Label>
            <Controller
              control={control}
              name="model_type"
              render={({ field }) => (
                <ToggleGroup
                  type="single"
                  value={field.value}
                  onValueChange={(v) => v && field.onChange(v as ModelType)}
                  variant="outline"
                  className="w-full sm:w-fit"
                >
                  <ToggleGroupItem value="simple" className="flex-1 sm:flex-none">
                    Simple
                  </ToggleGroupItem>
                  <ToggleGroupItem value="multiple" className="flex-1 sm:flex-none">
                    Multiple
                  </ToggleGroupItem>
                </ToggleGroup>
              )}
            />
            <p className="text-xs text-muted-foreground">
              {modelType === "simple"
                ? "Exactly one predictor (X) → one target (Y)."
                : "Two or more predictors (X1…Xn) → one target (Y)."}
            </p>
          </fieldset>

          {/* Y target */}
          <fieldset className="space-y-3">
            <Label htmlFor="y_col">Target variable (Y)</Label>
            <Controller
              control={control}
              name="y_col"
              render={({ field }) => (
                <Select
                  value={field.value || undefined}
                  onValueChange={(v) => {
                    field.onChange(v);
                    // If the new Y is in X, drop it from X.
                    const next = xCols.filter((c) => c !== v);
                    if (next.length !== xCols.length) {
                      setValue("x_cols", next, { shouldValidate: true });
                    }
                  }}
                >
                  <SelectTrigger id="y_col" className="max-w-sm">
                    <SelectValue placeholder="Pick the variable to predict" />
                  </SelectTrigger>
                  <SelectContent>
                    {numeric.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.y_col ? (
              <p className="text-xs text-destructive">{errors.y_col.message}</p>
            ) : null}
          </fieldset>

          {/* X predictors */}
          <fieldset className="space-y-3">
            <Label>
              Predictors (X){" "}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                {modelType === "simple" ? "exactly 1" : "≥ 2"}
              </span>
            </Label>
            <Controller
              control={control}
              name="x_cols"
              render={({ field }) => (
                <VariablePicker
                  available={numeric}
                  value={field.value}
                  onChange={field.onChange}
                  disabledValue={yCol}
                  single={modelType === "simple"}
                />
              )}
            />
            {errors.x_cols ? (
              <p className="text-xs text-destructive">{errors.x_cols.message}</p>
            ) : null}
          </fieldset>

          {/* Confidence level */}
          <fieldset className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="confidence_level">Confidence level</Label>
              <span className="text-sm font-semibold tabular-nums text-primary">
                {formatPercent(confidence, 0)}
              </span>
            </div>
            <Controller
              control={control}
              name="confidence_level"
              render={({ field }) => (
                <Slider
                  id="confidence_level"
                  min={0.8}
                  max={0.99}
                  step={0.01}
                  value={[field.value]}
                  onValueChange={(v) => field.onChange(v[0])}
                  className="max-w-md"
                />
              )}
            />
            <p className="text-xs text-muted-foreground">
              Drives the width of confidence and prediction intervals returned by the backend.
            </p>
          </fieldset>

          <div className="flex flex-wrap items-center gap-3 border-t pt-6">
            <Button type="submit" size="lg" disabled={!isValid || isSubmitting || train.isPending}>
              {train.isPending ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden />
                  Training…
                </>
              ) : (
                <>
                  <Sparkles aria-hidden />
                  Train model
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              The full row payload stays on the backend — the request only carries the dataset id.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
