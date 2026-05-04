"use client";

import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Lightbulb,
  ListChecks,
  Ruler,
  Star,
  TrendingUp,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatNumber, formatPercent, r2Band } from "@/lib/formatters";
import type { DatasetUploadResponse, TrainResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  model: TrainResponse;
  /**
   * Optional dataset profile. When provided, the panel appends up to four
   * additional data-quality recommendations (missing values, tiny sample,
   * near-constant predictors, scale disparity). All decisions read fields
   * the backend already produced — no client-side statistics are computed.
   */
  dataset?: DatasetUploadResponse | null;
}

type Tone = "success" | "warning" | "info" | "destructive";

interface Recommendation {
  id: string;
  tone: Tone;
  icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * Auto-generated insights derived purely from existing backend fields
 * (no client-side statistics — every numeric threshold decision was
 * computed by the backend). This is presentation of existing values,
 * not new math.
 */
export function buildRecommendations(
  model: TrainResponse,
  dataset?: DatasetUploadResponse | null,
): Recommendation[] {
  const recs: Recommendation[] = [];
  const { metrics, anova, t_tests, cooks_distance, feature_importance } = model;

  // 1. Overall fit quality from R² band.
  const band = r2Band(metrics.r2);
  if (band === "excellent") {
    recs.push({
      id: "fit",
      tone: "success",
      icon: CheckCircle2,
      title: `Excellent fit — R² = ${formatPercent(metrics.r2, 2)}`,
      description:
        "The model explains a large share of the variance in the target. Residual diagnostics should still be checked before relying on the predictions.",
    });
  } else if (band === "moderate") {
    recs.push({
      id: "fit",
      tone: "info",
      icon: TrendingUp,
      title: `Moderate fit — R² = ${formatPercent(metrics.r2, 2)}`,
      description:
        "The model captures a useful portion of the variance but leaves meaningful structure unexplained. Consider adding predictors or reviewing data quality.",
    });
  } else {
    recs.push({
      id: "fit",
      tone: "warning",
      icon: AlertTriangle,
      title: `Weak fit — R² = ${formatPercent(metrics.r2, 2)}`,
      description:
        "Less than half of the variance is explained. The current predictors may be insufficient or the relationship may not be linear.",
    });
  }

  // 2. Overall ANOVA decision (backend-computed).
  if (anova.decision === "reject_h0") {
    recs.push({
      id: "anova",
      tone: "success",
      icon: CheckCircle2,
      title: "Overall model is statistically significant",
      description: `The F-test rejects H₀ at α = 0.05 (F = ${formatNumber(
        anova.F_stat,
        3,
      )}, p ≈ ${formatNumber(anova.p_value, 4)}). At least one predictor has a non-zero effect.`,
    });
  } else {
    recs.push({
      id: "anova",
      tone: "destructive",
      icon: XCircle,
      title: "Overall model is not statistically significant",
      description: `The F-test fails to reject H₀ at α = 0.05 (F = ${formatNumber(
        anova.F_stat,
        3,
      )}, p ≈ ${formatNumber(anova.p_value, 4)}). The model's predictors jointly do not explain the target.`,
    });
  }

  // 3. Coefficient-level significance summary.
  const slopeTests = t_tests.filter((t) => t.variable !== "intercept");
  const sigCount = slopeTests.filter((t) => t.significant).length;
  if (slopeTests.length > 0) {
    const allSig = sigCount === slopeTests.length;
    const noneSig = sigCount === 0;
    recs.push({
      id: "ttests",
      tone: allSig ? "success" : noneSig ? "warning" : "info",
      icon: Lightbulb,
      title: `${sigCount} of ${slopeTests.length} predictor${
        slopeTests.length === 1 ? "" : "s"
      } significant at α = 0.05`,
      description: allSig
        ? "Every predictor contributes individually."
        : noneSig
          ? "No predictor contributes individually at the 5% level — consider collinearity or dropping variables."
          : `Insignificant predictors: ${slopeTests
              .filter((t) => !t.significant)
              .map((t) => t.variable)
              .join(", ")}.`,
    });
  }

  // 4. Strongest predictor by standardized coefficient.
  if (feature_importance.length > 0) {
    const top = [...feature_importance].sort(
      (a, b) => Math.abs(b.standardized_coef) - Math.abs(a.standardized_coef),
    )[0];
    recs.push({
      id: "top-predictor",
      tone: "info",
      icon: Star,
      title: `Strongest predictor: ${top.variable}`,
      description: `Standardized β = ${formatNumber(top.standardized_coef, 3)} (${
        top.direction
      } relationship). Explains ${formatPercent(top.importance, 1)} of the combined importance.`,
    });
  }

  // 5. Influential observations from Cook's distance.
  const influential = cooks_distance.filter((c) => c.high_influence);
  if (influential.length > 0) {
    const sample = influential.slice(0, 3).map((c) => `#${c.index}`).join(", ");
    const more = influential.length > 3 ? ` (+${influential.length - 3} more)` : "";
    recs.push({
      id: "cooks",
      tone: "warning",
      icon: AlertTriangle,
      title: `${influential.length} potentially influential observation${
        influential.length === 1 ? "" : "s"
      }`,
      description: `Cook's D above the 4/n threshold at: ${sample}${more}. Review these rows for data-entry errors or legitimate outliers before trusting the fit.`,
    });
  } else {
    recs.push({
      id: "cooks",
      tone: "success",
      icon: CheckCircle2,
      title: "No influential observations detected",
      description: "Every observation sits below the 4/n Cook's distance threshold.",
    });
  }

  // ── Data quality recommendations (Gap 3) ─────────────────────────
  // These only run when the dataset profile is available and only READ
  // fields produced by the backend (`missing`, `shape`, `stats[*].std`,
  // `stats[*].unique`). No new statistics are computed here.
  if (dataset) {
    const totalRows = dataset.shape[0];

    // 6. Missing values per column.
    const missingCols = Object.entries(dataset.missing)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);
    if (missingCols.length > 0 && totalRows > 0) {
      const worstPct = missingCols[0][1] / totalRows;
      const summary = missingCols
        .slice(0, 3)
        .map(([col, count]) => `${col} (${count})`)
        .join(", ");
      const more = missingCols.length > 3 ? ` (+${missingCols.length - 3} more)` : "";
      recs.push({
        id: "dq-missing",
        tone: worstPct > 0.05 ? "warning" : "info",
        icon: AlertTriangle,
        title: `Missing values in ${missingCols.length} column${missingCols.length === 1 ? "" : "s"}`,
        description: `Affected: ${summary}${more}. ${
          worstPct > 0.05
            ? "More than 5% of rows are missing in at least one column — consider imputation or removing the column."
            : "Few enough to impute or drop the offending rows without harming the fit."
        }`,
      });
    }

    // 7. Tiny dataset warning.
    if (totalRows > 0 && totalRows < 30) {
      recs.push({
        id: "dq-small",
        tone: "warning",
        icon: Database,
        title: `Small sample size — only ${totalRows} row${totalRows === 1 ? "" : "s"}`,
        description:
          "Coefficient inference (t-tests, confidence intervals) is unreliable below ~30 observations. Treat the report as exploratory and gather more data before relying on it.",
      });
    }

    // 8. Near-constant predictor detection (low information).
    const nearConstant = model.x_cols.filter((col) => {
      const stat = dataset.stats?.[col];
      return stat && stat.unique <= 2;
    });
    if (nearConstant.length > 0) {
      recs.push({
        id: "dq-near-constant",
        tone: "warning",
        icon: ListChecks,
        title: `Near-constant predictor${nearConstant.length === 1 ? "" : "s"}: ${nearConstant.join(", ")}`,
        description:
          "Columns with two or fewer unique values carry almost no information for a linear regression. Consider removing them or replacing with a more informative feature.",
      });
    }

    // 9. Scale disparity across selected predictors.
    const stds = model.x_cols
      .map((col) => dataset.stats?.[col]?.std)
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v) && v > 0);
    if (stds.length >= 2) {
      const maxStd = Math.max(...stds);
      const minStd = Math.min(...stds);
      const ratio = maxStd / minStd;
      if (ratio > 100) {
        recs.push({
          id: "dq-scale",
          tone: "info",
          icon: Ruler,
          title: "Predictors are on very different scales",
          description: `The largest std is ≈${formatNumber(ratio, 0)}× the smallest. Standardising or rescaling the features will make coefficients directly comparable and improve numerical stability.`,
        });
      }
    }
  }

  return recs;
}

const TONE_STYLES: Record<Tone, { ring: string; tint: string; label: string }> = {
  success: {
    ring: "border-success/40",
    tint: "bg-success/10 text-success",
    label: "text-success",
  },
  warning: {
    ring: "border-warning/40",
    tint: "bg-warning/15 text-warning",
    label: "text-warning",
  },
  info: {
    ring: "border-primary/30",
    tint: "bg-primary/10 text-primary",
    label: "text-primary",
  },
  destructive: {
    ring: "border-destructive/40",
    tint: "bg-destructive/10 text-destructive",
    label: "text-destructive",
  },
};

export function RecommendationsPanel({ model, dataset }: Props) {
  const recs = React.useMemo(
    () => buildRecommendations(model, dataset),
    [model, dataset],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="size-5 text-accent" aria-hidden />
          Recommendations
        </CardTitle>
        <CardDescription>
          Plain-language interpretation of the backend&rsquo;s statistical output
          {dataset ? " and dataset profile." : "."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {recs.map((r) => {
            const Icon = r.icon;
            const style = TONE_STYLES[r.tone];
            return (
              <li
                key={r.id}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-4 transition-shadow",
                  style.ring,
                )}
              >
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-md",
                    style.tint,
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                </div>
                <div className="space-y-1">
                  <div className={cn("text-sm font-semibold", style.label)}>{r.title}</div>
                  <p className="text-sm text-muted-foreground">{r.description}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
