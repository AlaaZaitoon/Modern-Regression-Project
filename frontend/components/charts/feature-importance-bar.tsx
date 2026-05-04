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
import type { FeatureImportance } from "@/lib/types";

const ReactECharts = dynamic(() => import("echarts-for-react"), {
  ssr: false,
  loading: () => <Skeleton className="h-[360px] w-full" />,
});

interface Props {
  items: FeatureImportance[];
}

/**
 * Horizontal bar chart ranking predictors by absolute standardized coefficient.
 * Gold bars = positive relationship with the target, coral bars = negative.
 */
export function FeatureImportanceBar({ items }: Props) {
  const theme = useChartTheme();

  // Sort ascending by |standardized_coef| so the largest ends up on top when
  // we use a category axis (ECharts draws bottom-up).
  const sorted = React.useMemo(
    () =>
      [...items].sort(
        (a, b) => Math.abs(a.standardized_coef) - Math.abs(b.standardized_coef),
      ),
    [items],
  );

  const categories = sorted.map((i) => i.variable);
  const values = sorted.map((i) => ({
    value: Math.abs(i.standardized_coef),
    itemStyle: {
      color: i.direction === "positive" ? theme.accent : theme.destructive,
      borderRadius: [0, 4, 4, 0] as const,
    },
    meta: i,
  }));

  const option = React.useMemo(
    () => ({
      animation: true,
      animationDuration: 500,
      tooltip: {
        ...tooltipStyle(theme),
        formatter: (p: { dataIndex: number }) => {
          const item = sorted[p.dataIndex];
          if (!item) return "";
          return `<div style="font-weight:600">${item.variable}</div>
                  <div>Standardized β: <b>${formatNumber(item.standardized_coef, 4)}</b></div>
                  <div>Importance: <b>${formatNumber(item.importance * 100, 1)}%</b></div>
                  <div>Direction: <b>${item.direction}</b></div>`;
        },
      },
      grid: { left: 30, right: 60, top: 20, bottom: 40, containLabel: true },
      xAxis: {
        type: "value",
        name: "|β̂ standardized|",
        nameLocation: "middle",
        nameGap: 28,
        axisLabel: { color: theme.ink },
        axisLine: { lineStyle: { color: theme.grid } },
        splitLine: { lineStyle: { color: theme.grid, type: "dashed" } },
      },
      yAxis: {
        type: "category",
        data: categories,
        axisLabel: { color: theme.ink, fontWeight: 500 },
        axisLine: { lineStyle: { color: theme.grid } },
        axisTick: { show: false },
      },
      series: [
        {
          type: "bar",
          data: values,
          barMaxWidth: 22,
          label: {
            show: true,
            position: "right",
            color: theme.ink,
            formatter: (p: { value: number }) => formatNumber(p.value, 3),
            fontWeight: 500,
          },
        },
      ],
    }),
    [theme, categories, values, sorted],
  );

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Feature importance</CardTitle>
          <CardDescription>No predictors available to rank.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature importance</CardTitle>
        <CardDescription>
          Predictors ranked by the absolute standardized coefficient — gold indicates a positive
          relationship with the target, red a negative one.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ReactECharts
          option={option}
          style={{ width: "100%", height: Math.max(280, items.length * 42 + 80) }}
          opts={{ renderer: "canvas" }}
          notMerge
        />
      </CardContent>
    </Card>
  );
}
