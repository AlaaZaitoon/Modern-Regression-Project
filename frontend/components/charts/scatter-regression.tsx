"use client";

import * as React from "react";
import dynamic from "next/dynamic";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { tooltipStyle, useChartTheme } from "@/lib/chart-theme";
import { formatNumber } from "@/lib/formatters";
import type { Coefficients, PredictionRow } from "@/lib/types";

const ReactECharts = dynamic(() => import("echarts-for-react"), {
  ssr: false,
  loading: () => <Skeleton className="h-[420px] w-full" />,
});

interface Props {
  xCol: string;
  yCol: string;
  predictions: PredictionRow[];
  coefficients: Coefficients;
}

/**
 * Simple-regression chart: scatter of observed (X, Y) pairs overlaid with the
 * fitted regression line. Line is drawn from `β₀ + β₁·x_min` to `β₀ + β₁·x_max`.
 * Multiple regression falls back to the Actual-vs-Predicted chart (rendered
 * elsewhere), so this component is only mounted when there is a single X.
 */
export function ScatterRegression({ xCol, yCol, predictions, coefficients }: Props) {
  const theme = useChartTheme();

  const slope = coefficients.slopes[xCol] ?? 0;
  const intercept = coefficients.intercept;

  const scatter = React.useMemo(
    () =>
      predictions
        .map((p) => [p.x_values[xCol], p.y_actual] as [number, number])
        .filter(
          ([x, y]) => Number.isFinite(x) && Number.isFinite(y),
        ),
    [predictions, xCol],
  );

  const line = React.useMemo(() => {
    if (scatter.length === 0) return [] as [number, number][];
    let minX = scatter[0][0];
    let maxX = scatter[0][0];
    for (const [x] of scatter) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
    }
    return [
      [minX, intercept + slope * minX],
      [maxX, intercept + slope * maxX],
    ] as [number, number][];
  }, [scatter, intercept, slope]);

  const option = React.useMemo(
    () => ({
      animation: true,
      animationDuration: 500,
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "cross" },
        ...tooltipStyle(theme),
        formatter: (params: Array<{ seriesName: string; data: [number, number] }>) => {
          const point = params.find((p) => p.seriesName === "Observed");
          if (!point) return "";
          const [x, y] = point.data;
          const yHat = intercept + slope * x;
          return `<div style="font-weight:600">${xCol} = ${formatNumber(x, 4)}</div>
                  <div>${yCol} (actual): <b>${formatNumber(y, 4)}</b></div>
                  <div>${yCol} (predicted): <b>${formatNumber(yHat, 4)}</b></div>`;
        },
      },
      grid: { left: 60, right: 30, top: 40, bottom: 60, containLabel: true },
      xAxis: {
        type: "value",
        name: xCol,
        nameLocation: "middle",
        nameGap: 32,
        axisLabel: { color: theme.ink },
        axisLine: { lineStyle: { color: theme.grid } },
        splitLine: { lineStyle: { color: theme.grid, type: "dashed" } },
      },
      yAxis: {
        type: "value",
        name: yCol,
        nameLocation: "middle",
        nameGap: 60,
        axisLabel: { color: theme.ink },
        axisLine: { lineStyle: { color: theme.grid } },
        splitLine: { lineStyle: { color: theme.grid, type: "dashed" } },
      },
      legend: {
        top: 6,
        right: 12,
        textStyle: { color: theme.ink },
      },
      series: [
        {
          name: "Observed",
          type: "scatter",
          data: scatter,
          symbolSize: 9,
          itemStyle: {
            color: theme.primary,
            borderColor: theme.surface,
            borderWidth: 1,
            opacity: 0.85,
          },
          emphasis: {
            itemStyle: { shadowBlur: 10, shadowColor: theme.primary, opacity: 1 },
          },
        },
        {
          name: "Regression line",
          type: "line",
          data: line,
          showSymbol: false,
          smooth: false,
          lineStyle: { color: theme.accent, width: 3 },
          z: 3,
        },
      ],
    }),
    [xCol, yCol, scatter, line, intercept, slope, theme],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scatter &amp; regression line</CardTitle>
        <CardDescription>
          Observed pairs of <span className="font-medium text-foreground">{xCol}</span> vs{" "}
          <span className="font-medium text-foreground">{yCol}</span>, with the fitted OLS line.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ReactECharts
          option={option}
          style={{ width: "100%", height: 420 }}
          opts={{ renderer: "canvas" }}
          notMerge
        />
      </CardContent>
    </Card>
  );
}
