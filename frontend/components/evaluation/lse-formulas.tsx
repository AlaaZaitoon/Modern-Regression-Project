"use client";

import "katex/dist/katex.min.css";

import { BookOpen } from "lucide-react";
import { BlockMath } from "react-katex";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/* ═══════════════════════════════════════════════════════════════════════════
 * Shared wrapper — gives every formula section a consistent look.
 * ═══════════════════════════════════════════════════════════════════════════ */

function FormulaCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BookOpen className="size-5" aria-hidden />
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function FormulaBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-muted/40 px-5 py-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * 1. MODEL FORMULAS — regression model + LSE coefficient estimation
 *    Shown before: EquationDisplay
 * ═══════════════════════════════════════════════════════════════════════════ */

interface ModelFormulasProps {
  modelType: "simple" | "multiple";
}

export function ModelFormulas({ modelType }: ModelFormulasProps) {
  const isSimple = modelType === "simple";
  return (
    <FormulaCard
      title="Regression Model & Coefficient Estimation"
      description={
        isSimple
          ? "Simple Linear Regression — Least Squares Estimation"
          : "Multiple Linear Regression — OLS Matrix Solution"
      }
    >
      {isSimple ? (
        <>
          <FormulaBlock label="Model Equation">
            <BlockMath math={String.raw`Y = \beta_0 + \beta_1 X + \varepsilon`} />
          </FormulaBlock>
          <FormulaBlock label="Slope (β̂₁)">
            <BlockMath
              math={String.raw`\hat{\beta}_1 = \frac{\displaystyle\sum_{i}(x_i - \bar{x})(y_i - \bar{y})}{\displaystyle\sum_{i}(x_i - \bar{x})^2}`}
            />
          </FormulaBlock>
          <FormulaBlock label="Intercept (β̂₀)">
            <BlockMath math={String.raw`\hat{\beta}_0 = \bar{y} - \hat{\beta}_1 \bar{x}`} />
          </FormulaBlock>
          <FormulaBlock label="Sample Means">
            <BlockMath
              math={String.raw`\bar{x} = \frac{\displaystyle\sum_{i} x_i}{n} \qquad,\qquad \bar{y} = \frac{\displaystyle\sum_{i} y_i}{n}`}
            />
          </FormulaBlock>
        </>
      ) : (
        <>
          <FormulaBlock label="Model Equation">
            <BlockMath
              math={String.raw`Y = \beta_0 + \beta_1 X_1 + \beta_2 X_2 + \cdots + \beta_p X_p + \varepsilon`}
            />
          </FormulaBlock>
          <FormulaBlock label="Matrix Notation">
            <BlockMath
              math={String.raw`\mathbf{Y} = \mathbf{X} \boldsymbol{\beta} + \boldsymbol{\varepsilon}`}
            />
          </FormulaBlock>
          <FormulaBlock label="OLS Solution — Matrix Form">
            <BlockMath math={String.raw`\hat{\beta} = (X^T X)^{-1} X^T Y`} />
          </FormulaBlock>
          <FormulaBlock label="Residual Sum of Squares">
            <BlockMath
              math={String.raw`S(\boldsymbol{\beta}) = \sum\left(Y_i - \hat{Y}_i\right)^2`}
            />
          </FormulaBlock>
          <FormulaBlock label="Normal Equations">
            <BlockMath
              math={String.raw`\sum_{i=1}^{n} y_i = n\hat{\beta}_0 + \hat{\beta}_1 \sum_{i=1}^{n} x_{i1} + \cdots + \hat{\beta}_k \sum_{i=1}^{n} x_{ik}`}
            />
            <div className="my-2 text-center text-xs text-muted-foreground">⋮</div>
            <BlockMath
              math={String.raw`\sum_{i=1}^{n} x_{ik}\, y_i = \hat{\beta}_0 \sum_{i=1}^{n} x_{ik} + \hat{\beta}_1 \sum_{i=1}^{n} x_{ik}\, x_{i1} + \cdots + \hat{\beta}_k \sum_{i=1}^{n} x_{ik}^2`}
            />
          </FormulaBlock>
        </>
      )}
    </FormulaCard>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * 2. R² & SE FORMULAS
 *    Shown before: MetricsGrid + R2Gauge
 * ═══════════════════════════════════════════════════════════════════════════ */

interface R2FormulaProps {
  modelType: "simple" | "multiple";
}

export function R2Formula({ modelType }: R2FormulaProps) {
  const isSimple = modelType === "simple";
  return (
    <FormulaCard
      title="Model Evaluation Formulas"
      description="R² (Coefficient of Determination) and Standard Error"
    >
      <FormulaBlock label="Coefficient of Determination (R²)">
        <BlockMath
          math={String.raw`R^2 = \frac{SSR}{SST} = \frac{\displaystyle\sum(\hat{Y}_i - \bar{Y})^2}{\displaystyle\sum(Y_i - \bar{Y})^2}`}
        />
      </FormulaBlock>
      {!isSimple && (
        <FormulaBlock label="Adjusted R²">
          <BlockMath
            math={String.raw`R^2_{adj} = 1 - \left[ \frac{(1 - R^2)(n - 1)}{n - k - 1} \right]`}
          />
        </FormulaBlock>
      )}
      <FormulaBlock label="Standard Error of Estimate (SE)">
        <BlockMath
          math={
            isSimple
              ? String.raw`SE = \sqrt{\frac{\displaystyle\sum_{i}(Y_i - \hat{Y}_i)^2}{n - 2}}`
              : String.raw`SE = \sqrt{\frac{\displaystyle\sum_{i}(Y_i - \hat{Y}_i)^2}{n - k - 1}}`
          }
        />
      </FormulaBlock>
    </FormulaCard>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * 3. SUM OF SQUARES & F-STATISTIC FORMULAS
 *    Shown before: AnovaTable
 * ═══════════════════════════════════════════════════════════════════════════ */

export function SumOfSquaresFormulas() {
  return (
    <FormulaCard
      title="Sum of Squares & F-Statistic"
      description="ANOVA decomposition formulas"
    >
      <FormulaBlock label="Fundamental Relationship">
        <BlockMath math={String.raw`SST = SSR + SSE`} />
      </FormulaBlock>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormulaBlock label="SST — Total">
          <BlockMath math={String.raw`\sum_{i}(Y_i - \bar{Y})^2`} />
        </FormulaBlock>
        <FormulaBlock label="SSR — Explained">
          <BlockMath math={String.raw`\sum_{i}(\hat{Y}_i - \bar{Y})^2`} />
        </FormulaBlock>
        <FormulaBlock label="SSE — Unexplained">
          <BlockMath math={String.raw`\sum_{i}(Y_i - \hat{Y}_i)^2`} />
        </FormulaBlock>
      </div>
      <FormulaBlock label="F-Statistic (ANOVA)">
        <BlockMath
          math={String.raw`F = \frac{MSR}{MSE} = \frac{SSR / k}{SSE / (n - k - 1)}`}
        />
      </FormulaBlock>
    </FormulaCard>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * 4. INFERENCE FORMULAS — SE(β), σ², t, H₀/H₁
 *    Shown before: TTestTable
 * ═══════════════════════════════════════════════════════════════════════════ */

interface InferenceFormulasProps {
  modelType: "simple" | "multiple";
}

export function InferenceFormulas({ modelType }: InferenceFormulasProps) {
  const isSimple = modelType === "simple";
  return (
    <FormulaCard
      title="Statistical Inference Formulas"
      description="Standard errors, t-statistic, and hypothesis testing"
    >
      {isSimple ? (
        <>
          <FormulaBlock label="Standard Error of Slope — SE(β₁)">
            <BlockMath
              math={String.raw`SE(\beta_1) = \frac{SE}{\sqrt{\displaystyle\sum_{i}(X_i - \bar{X})^2}}`}
            />
          </FormulaBlock>
          <FormulaBlock label="Standard Error of Intercept — SE(β₀)">
            <BlockMath
              math={String.raw`SE(\beta_0) = SE \sqrt{\frac{1}{n} + \frac{\bar{X}^2}{\displaystyle\sum_{i}(X_i - \bar{X})^2}}`}
            />
          </FormulaBlock>
        </>
      ) : (
        <>
          <FormulaBlock label="Residual Variance (σ²)">
            <BlockMath
              math={String.raw`\hat{\sigma}^2 = \frac{\displaystyle\sum_{i=1}^{n} e_i^{\,2}}{n - p - 1}`}
            />
          </FormulaBlock>
          <FormulaBlock label="Standard Error of Coefficients">
            <BlockMath
              math={String.raw`SE(\hat{\beta}_j) = \sqrt{\hat{\sigma}^2 \cdot (X^T X)^{-1}_{jj}}`}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Where (X<sup>T</sup>X)<sup>−1</sup><sub>jj</sub> is the j-th diagonal element of the inverse matrix.
            </p>
          </FormulaBlock>
        </>
      )}

      <FormulaBlock label="Hypotheses for Each Coefficient">
        <BlockMath math={String.raw`H_0 : \beta_j = 0 \qquad \text{(no effect)}`} />
        <BlockMath math={String.raw`H_1 : \beta_j \neq 0 \qquad \text{(significant effect)}`} />
      </FormulaBlock>

      <FormulaBlock label="t-Statistic">
        <BlockMath math={String.raw`t_j = \frac{\hat{\beta}_j}{SE(\hat{\beta}_j)}`} />
        <p className="mt-2 text-xs text-muted-foreground">
          Decision rule: Reject H₀ if |t<sub>j</sub>| &gt; t<sub>critical</sub> at α = 0.05
        </p>
      </FormulaBlock>
    </FormulaCard>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * 5. CONFIDENCE INTERVAL FORMULA
 *    Shown before: CiTable
 * ═══════════════════════════════════════════════════════════════════════════ */

export function CiFormula() {
  return (
    <FormulaCard
      title="Confidence Interval Formula"
      description="How the confidence intervals for each coefficient are computed"
    >
      <FormulaBlock label="Confidence Interval for Coefficients">
        <BlockMath
          math={String.raw`CI = \hat{\beta}_k \pm t_{(n-p,\;\frac{\alpha}{2})} \times SE(\hat{\beta}_k)`}
        />
      </FormulaBlock>

      <FormulaBlock label="95% Confidence Interval — Example Table">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-foreground/20">
                <th className="px-4 py-2.5 text-left font-bold italic">Coefficient</th>
                <th className="px-4 py-2.5 text-center font-bold italic">Estimate</th>
                <th className="px-4 py-2.5 text-center font-bold italic">Standard Error</th>
                <th className="px-4 py-2.5 text-center font-bold italic">95% Confidence Interval</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-foreground/10">
                <td className="px-4 py-2.5 text-left italic text-muted-foreground">Intercept</td>
                <td className="px-4 py-2.5 text-center tabular-nums">0.1</td>
                <td className="px-4 py-2.5 text-center tabular-nums">0.3</td>
                <td className="px-4 py-2.5 text-center tabular-nums">(-0.6, 0.8)</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-left italic text-muted-foreground">Slope</td>
                <td className="px-4 py-2.5 text-center tabular-nums">0.12</td>
                <td className="px-4 py-2.5 text-center tabular-nums">0.12</td>
                <td className="px-4 py-2.5 text-center tabular-nums">(0.10, 0.14)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          If the interval does not contain zero, the coefficient is statistically significant at the 95% confidence level.
        </p>
      </FormulaBlock>
    </FormulaCard>
  );
}
