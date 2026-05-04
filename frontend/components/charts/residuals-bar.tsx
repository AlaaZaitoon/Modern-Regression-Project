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
  loading: () => <Skeleton className="h-[360px] w-full" />,
});

interface Props {
  predictions: PredictionRow[];
}

/**
 * Residuals per observation. Positive residuals (over-prediction) are gold,
 * negative residuals (under-prediction) are navy. Includes a zero reference
 * line to make the distribution easy to read.
 */
export function ResidualsBar({ predictions }: Props) {
  const theme = useChartTheme();

  const data = React.useMemo(
    () =>
      predictions.map((p) => ({
        value: p.residual,
        itemStyle: {
          color: p.residual >= 0 ? theme.accent : theme.primary,
          opacity: 0.9,
        },
      })),
    [predictions, theme],
  );

  const xs = React.useMemo(() => predictions.map((p) => p.index), [predictions]);

  const option = React.useMemo(
    () => ({
      animation: true,
      animationDuration: 500,
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        ...tooltipStyle(theme),
        formatter: (params: Array<{ axisValue: number; data: { value: number } }>) => {
          if (params.length === 0) return "";
          const { axisValue, data: d } = params[0];
          const v = d.value;
          return `<div style="font-weight:600">Observation #${axisValue}</div>
                  <div>Residual: <b>${formatNumber(v, 4)}</b></div>
                  <div>${v >= 0 ? "Over-predicted" : "Under-predicted"}</div>`;
        },
      },
      grid: { left: 60, right: 30, top: 30, bottom: 50, containLabel: true },
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
        name: "Residual (y − ŷ)",
        nameLocation: "middle",
        nameGap: 60,
        axisLabel: { color: theme.ink },
        axisLine: { lineStyle: { color: theme.grid } },
        splitLine: { lineStyle: { color: theme.grid, type: "dashed" } },
      },
      series: [
        {
          name: "Residual",
          type: "bar",
          data,
          barMaxWidth: 18,
          markLine: {
            silent: true,
            symbol: "none",
            lineStyle: { color: theme.ink, type: "solid", width: 1 },
            label: { show: false },
            data: [{ yAxis: 0 }],
          },
        },
      ],
    }),
    [theme, data, xs],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Residuals</CardTitle>
        <CardDescription>
          Positive bars (gold) → over-predicted · Negative bars (navy) → under-predicted.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ReactECharts
          option={option}
          style={{ width: "100%", height: 360 }}
          opts={{ renderer: "canvas" }}
          notMerge
        />
      </CardContent>
    </Card>
  );
}
