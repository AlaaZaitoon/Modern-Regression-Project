"use client";

import { Activity, Gauge, Ruler, Sigma, Target, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { formatNumber, formatPercent } from "@/lib/formatters";
import type { Metrics } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  metrics: Metrics;
  modelType: "simple" | "multiple";
}

interface MetricSpec {
  key: keyof Metrics;
  label: string;
  help: string;
  icon: LucideIcon;
  format: (v: number) => string;
  accent?: boolean;
}

const SPECS: MetricSpec[] = [
  {
    key: "r2",
    label: "R²",
    help: "Variance explained",
    icon: Target,
    format: (v) => formatPercent(v, 2),
    accent: true,
  },
  {
    key: "adj_r2",
    label: "Adjusted R²",
    help: "Penalized for predictors",
    icon: TrendingUp,
    format: (v) => formatPercent(v, 2),
  },
  { key: "mse", label: "MSE", help: "Mean squared error", icon: Sigma, format: (v) => formatNumber(v, 4) },
  { key: "rmse", label: "RMSE", help: "Root mean squared error", icon: Activity, format: (v) => formatNumber(v, 4) },
  { key: "mae", label: "MAE", help: "Mean absolute error", icon: Ruler, format: (v) => formatNumber(v, 4) },
  { key: "se", label: "Std. error", help: "Std. error of estimate", icon: Gauge, format: (v) => formatNumber(v, 4) },
];

export function MetricsGrid({ metrics, modelType }: Props) {
  const visibleSpecs = SPECS.filter(spec => 
    modelType === "simple" ? spec.key !== "adj_r2" : true
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {visibleSpecs.map((spec) => {
        const Icon = spec.icon;
        return (
          <Card
            key={spec.key}
            className={cn(
              "overflow-hidden glass-card",
              spec.accent && "ring-1 ring-primary/20 shadow-md glow-primary",
            )}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20",
                  spec.accent ? "text-primary font-bold" : "text-muted-foreground",
                )}
              >
                <Icon className={cn("size-5", spec.accent && "animate-pulse")} aria-hidden />
              </div>
              <div className="space-y-0.5">
                <div className="text-2xl font-semibold tabular-nums tracking-tight">
                  {spec.format(metrics[spec.key])}
                </div>
                <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {spec.label}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
