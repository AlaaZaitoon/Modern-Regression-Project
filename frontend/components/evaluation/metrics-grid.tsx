"use client";

import { Activity, Gauge, Ruler, Sigma, Target, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { formatNumber, formatPercent } from "@/lib/formatters";
import type { Metrics } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  metrics: Metrics;
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

export function MetricsGrid({ metrics }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {SPECS.map((spec) => {
        const Icon = spec.icon;
        return (
          <Card
            key={spec.key}
            className={cn(
              "transition-shadow hover:shadow-sm",
              spec.accent && "border-primary/30 bg-primary/[0.03]",
            )}
          >
            <CardContent className="space-y-1 p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="uppercase tracking-wider">{spec.label}</span>
                <Icon className="size-4" aria-hidden />
              </div>
              <div className="text-2xl font-semibold tabular-nums tracking-tight">
                {spec.format(metrics[spec.key])}
              </div>
              <div className="text-xs text-muted-foreground">{spec.help}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
