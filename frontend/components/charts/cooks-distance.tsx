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
import type { CookDistance } from "@/lib/types";

const ReactECharts = dynamic(() => import("echarts-for-react"), {
  ssr: false,
  loading: () => <Skeleton className="h-[360px] w-full" />,
});

interface Props {
  points: CookDistance[];
}

/**
 * Cook's distance scatter with the 4/n threshold line. Influential points
 * (`high_influence === true`) are highlighted in the destructive color with
 * an enlarged marker for immediate visibility.
 */
export function CooksDistance({ points }: Props) {
  const theme = useChartTheme();

  const threshold = points[0]?.threshold ?? 0;
  const influentialCount = points.filter((p) => p.high_influence).length;

  const scatter = React.useMemo(
    () =>
      points.map((p) => ({
        value: [p.index, p.value] as [number, number],
        itemStyle: {
          color: p.high_influence ? theme.destructive : theme.primary,
          opacity: p.high_influence ? 1 : 0.75,
        },
        symbolSize: p.high_influence ? 14 : 8,
        meta: p,
      })),
    [points, theme],
  );

  const option = React.useMemo(
    () => ({
      animation: true,
      animationDuration: 500,
      tooltip: {
        trigger: "item",
        ...tooltipStyle(theme),
        formatter: (p: { data: { value: [number, number]; meta: CookDistance } }) => {
          const { value, meta } = p.data;
          const [idx, cd] = value;
          return `<div style="font-weight:600">Observation #${idx}</div>
                  <div>Cook's D: <b>${formatNumber(cd, 5)}</b></div>
                  <div>Threshold (4/n): <b>${formatNumber(meta.threshold, 5)}</b></div>
                  <div style="color:${meta.high_influence ? theme.destructive : theme.inkMuted}">
                    ${meta.high_influence ? "Influential observation" : "Normal"}
                  </div>`;
        },
      },
      grid: { left: 60, right: 30, top: 30, bottom: 50, containLabel: true },
      xAxis: {
        type: "value",
        name: "Observation index",
        nameLocation: "middle",
        nameGap: 30,
        axisLabel: { color: theme.ink },
        axisLine: { lineStyle: { color: theme.grid } },
        splitLine: { lineStyle: { color: theme.grid, type: "dashed" } },
      },
      yAxis: {
        type: "value",
        name: "Cook's D",
        nameLocation: "middle",
        nameGap: 60,
        axisLabel: { color: theme.ink },
        axisLine: { lineStyle: { color: theme.grid } },
        splitLine: { lineStyle: { color: theme.grid, type: "dashed" } },
      },
      series: [
        {
          name: "Cook's D",
          type: "scatter",
          data: scatter,
          markLine: {
            silent: true,
            symbol: "none",
            lineStyle: {
              color: theme.threshold,
              type: "dashed",
              width: 2,
            },
            label: {
              show: true,
              position: "end",
              color: theme.destructive,
              fontSize: 11,
              fontWeight: 600,
              formatter: `Threshold 4/n = ${formatNumber(threshold, 4)}`,
            },
            data: [{ yAxis: threshold }],
          },
        },
      ],
    }),
    [theme, scatter, threshold],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cook&rsquo;s distance</CardTitle>
        <CardDescription>
          Influence of each observation on the fit. Points above the 4/n threshold are flagged as
          potentially influential.
          {influentialCount > 0 ? (
            <>
              {" "}
              <span className="font-medium text-destructive">
                {influentialCount} influential point
                {influentialCount === 1 ? "" : "s"} detected.
              </span>
            </>
          ) : (
            <>
              {" "}
              <span className="font-medium text-success">
                No influential observations.
              </span>
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ReactECharts
          option={option}
          style={{ width: "100%", height: 380 }}
          opts={{ renderer: "canvas" }}
          notMerge
        />
      </CardContent>
    </Card>
  );
}
