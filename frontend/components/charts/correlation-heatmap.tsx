"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { CorrelationMatrix } from "@/lib/types";

// Apache ECharts is heavy — defer to the client to keep the initial JS budget
// well under 250 KB and avoid SSR'ing canvas-bound code.
const ReactECharts = dynamic(() => import("echarts-for-react"), {
  ssr: false,
  loading: () => <Skeleton className="h-[420px] w-full" />,
});

interface Props {
  matrix: CorrelationMatrix;
  /** Optional subset of columns to render (used by Step 3 to scope to model vars). */
  filterColumns?: string[];
  title?: string;
  description?: string;
}

/**
 * Symmetric Pearson correlation heatmap. The diverging color scale and axis
 * labels read from CSS variables so light/dark themes look consistent.
 */
export function CorrelationHeatmap({
  matrix,
  filterColumns,
  title = "Correlation matrix",
  description = "Pearson correlation between every numeric column.",
}: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Compute the subset to render, preserving the requested ordering.
  const indices = React.useMemo(() => {
    if (!filterColumns || filterColumns.length === 0) {
      return matrix.columns.map((_, i) => i);
    }
    return filterColumns
      .map((c) => matrix.columns.indexOf(c))
      .filter((i) => i >= 0);
  }, [filterColumns, matrix.columns]);

  const cols = indices.map((i) => matrix.columns[i]);
  const data = React.useMemo(() => {
    const out: [number, number, number][] = [];
    for (let r = 0; r < indices.length; r++) {
      for (let c = 0; c < indices.length; c++) {
        const v = matrix.matrix[indices[r]]?.[indices[c]];
        if (typeof v === "number" && Number.isFinite(v)) {
          out.push([c, r, Number(v.toFixed(4))]);
        }
      }
    }
    return out;
  }, [indices, matrix.matrix]);

  const axisColor = isDark ? "rgba(226, 232, 240, 0.85)" : "rgba(15, 23, 42, 0.85)";
  const splitColor = isDark ? "rgba(148, 163, 184, 0.18)" : "rgba(148, 163, 184, 0.32)";

  const option = React.useMemo(() => {
    return {
      animation: true,
      animationDuration: 350,
      tooltip: {
        position: "top",
        backgroundColor: isDark ? "#0f172a" : "#ffffff",
        borderColor: splitColor,
        textStyle: { color: axisColor, fontSize: 12 },
        formatter: (p: { data: [number, number, number] }) => {
          const [c, r, v] = p.data;
          return `<div style="font-weight:600">${cols[r]} × ${cols[c]}</div>
                  <div>r = <b>${v.toFixed(4)}</b></div>`;
        },
      },
      grid: { left: 100, right: 30, top: 40, bottom: 90, containLabel: true },
      xAxis: {
        type: "category",
        data: cols,
        splitArea: { show: false },
        axisLabel: { rotate: 35, color: axisColor, fontSize: 11 },
        axisLine: { lineStyle: { color: splitColor } },
        axisTick: { show: false },
      },
      yAxis: {
        type: "category",
        data: cols,
        inverse: true,
        splitArea: { show: false },
        axisLabel: { color: axisColor, fontSize: 11 },
        axisLine: { lineStyle: { color: splitColor } },
        axisTick: { show: false },
      },
      visualMap: {
        min: -1,
        max: 1,
        calculable: true,
        orient: "horizontal",
        left: "center",
        bottom: 4,
        textStyle: { color: axisColor, fontSize: 11 },
        inRange: {
          color: ["#b91c1c", "#fde68a", "#f8fafc", "#bae6fd", "#1e3a8a"],
        },
      },
      series: [
        {
          name: "Correlation",
          type: "heatmap",
          data,
          label: {
            show: indices.length <= 12,
            color: axisColor,
            fontSize: 10,
            fontWeight: 500,
            formatter: (p: { data: [number, number, number] }) => {
              const v = p.data[2];
              if (Math.abs(v) < 0.005) return "0";
              return v.toFixed(2);
            },
          },
          itemStyle: {
            borderColor: isDark ? "rgba(15, 23, 42, 0.85)" : "rgba(255, 255, 255, 0.85)",
            borderWidth: 1,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 8,
              shadowColor: "rgba(0,0,0,0.35)",
            },
          },
        },
      ],
    } as const;
  }, [axisColor, cols, data, indices.length, isDark, splitColor]);

  if (cols.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No columns to correlate.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ReactECharts
          option={option}
          style={{ width: "100%", height: Math.max(360, cols.length * 36 + 120) }}
          opts={{ renderer: "canvas" }}
          notMerge
        />
      </CardContent>
    </Card>
  );
}
