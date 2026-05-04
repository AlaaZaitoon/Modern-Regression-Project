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
import type { PredictionRow } from "@/lib/types";

const ReactECharts = dynamic(() => import("echarts-for-react"), {
  ssr: false,
  loading: () => <Skeleton className="h-[420px] w-full" />,
});

interface Props {
  yCol: string;
  predictions: PredictionRow[];
}

/**
 * Dual-line view of actual vs predicted Y per observation index. Works for
 * both simple and multiple regression. Reads exclusively from the backend's
 * `predictions` array — no client-side math.
 */
export function ActualVsPredicted({ yCol, predictions }: Props) {
  const theme = useChartTheme();

  const xs = React.useMemo(() => predictions.map((p) => p.index), [predictions]);
  const actual = React.useMemo(() => predictions.map((p) => p.y_actual), [predictions]);
  const predicted = React.useMemo(() => predictions.map((p) => p.y_predicted), [predictions]);

  const option = React.useMemo(
    () => ({
      animation: true,
      animationDuration: 500,
      tooltip: {
        trigger: "axis",
        ...tooltipStyle(theme),
        formatter: (
          params: Array<{ axisValue: number; seriesName: string; data: number }>,
        ) => {
          if (params.length === 0) return "";
          const [a, p] = params;
          return `<div style="font-weight:600">Observation #${a.axisValue}</div>
                  <div>${a.seriesName}: <b>${formatNumber(a.data, 4)}</b></div>
                  <div>${p.seriesName}: <b>${formatNumber(p.data, 4)}</b></div>`;
        },
      },
      legend: { top: 6, right: 12, textStyle: { color: theme.ink } },
      grid: { left: 60, right: 30, top: 40, bottom: 50, containLabel: true },
      xAxis: {
        type: "category",
        data: xs,
        name: "Observation",
        nameLocation: "middle",
        nameGap: 30,
        axisLabel: { color: theme.ink },
        axisLine: { lineStyle: { color: theme.grid } },
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
      series: [
        {
          name: "Actual",
          type: "line",
          data: actual,
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          lineStyle: { color: theme.primary, width: 2 },
          itemStyle: { color: theme.primary },
        },
        {
          name: "Predicted",
          type: "line",
          data: predicted,
          smooth: true,
          symbol: "diamond",
          symbolSize: 6,
          lineStyle: { color: theme.accent, width: 2, type: "dashed" },
          itemStyle: { color: theme.accent },
        },
      ],
    }),
    [theme, xs, actual, predicted, yCol],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actual vs predicted</CardTitle>
        <CardDescription>
          Observed <span className="font-medium text-foreground">{yCol}</span> compared to the
          fitted model&rsquo;s prediction, indexed by observation order.
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
