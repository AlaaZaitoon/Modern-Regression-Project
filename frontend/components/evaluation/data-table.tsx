"use client";

import * as React from "react";
import { TableProperties } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/formatters";
import type { Coefficients, PredictionRow } from "@/lib/types";

interface Props {
  predictions: PredictionRow[];
  coefficients: Coefficients;
  xCols: string[];
  yCol: string;
  sampleMeans: Record<string, number>;
}

const INITIAL_ROWS = 15;

/**
 * Comprehensive data table showing all per-row computed values:
 * X columns, Y, Ŷ, eᵢ, eᵢ², (Yᵢ-Ȳ)², (Ŷᵢ-Ȳ)²
 *
 * Footer shows Σ totals (SSE, SST, SSR), coefficients, and means.
 */
export function DataTable({ predictions, coefficients, xCols, yCol, sampleMeans }: Props) {
  const [showAll, setShowAll] = React.useState(false);

  // Compute ȳ (mean of Y), fallback to 0 if sampleMeans is missing (e.g. old models)
  const safeSampleMeans = sampleMeans || {};
  const yMean = safeSampleMeans[yCol] ?? 0;

  // Build enriched rows
  const enrichedRows = React.useMemo(() => {
    return predictions.map((row) => {
      const e = row.residual;
      const eSq = e * e;
      const yDevSq = (row.y_actual - yMean) ** 2;   // (Yᵢ - Ȳ)²
      const yHatDevSq = (row.y_predicted - yMean) ** 2; // (Ŷᵢ - Ȳ)²
      return { ...row, eSq, yDevSq, yHatDevSq };
    });
  }, [predictions, yMean]);

  // Totals
  const totals = React.useMemo(() => {
    let sse = 0, sst = 0, ssr = 0;
    for (const r of enrichedRows) {
      sse += r.eSq;
      sst += r.yDevSq;
      ssr += r.yHatDevSq;
    }
    return { sse, sst, ssr };
  }, [enrichedRows]);

  const visibleRows = showAll ? enrichedRows : enrichedRows.slice(0, INITIAL_ROWS);
  const hasMore = enrichedRows.length > INITIAL_ROWS;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <TableProperties className="size-5" aria-hidden />
          </div>
          <div>
            <CardTitle>Computed Values Table</CardTitle>
            <CardDescription>
              Per-observation predicted values, residuals, and sum-of-squares components
              ({predictions.length} rows)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Coefficients & Means summary */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border bg-muted/30 p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Coefficients
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm tabular-nums">
              <span>
                <span className="text-muted-foreground">β̂₀ = </span>
                <span className="font-medium">{formatNumber(coefficients.intercept, 4)}</span>
              </span>
              {xCols.map((col, i) => (
                <span key={col}>
                  <span className="text-muted-foreground">β̂{i + 1} ({col}) = </span>
                  <span className="font-medium">{formatNumber(coefficients.slopes[col], 4)}</span>
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-md border bg-muted/30 p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sample Means
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm tabular-nums">
              {xCols.map((col) => (
                <span key={col}>
                  <span className="text-muted-foreground">{col} = </span>
                  <span className="font-medium">{formatNumber(safeSampleMeans[col] ?? 0, 4)}</span>
                </span>
              ))}
              <span>
                <span className="text-muted-foreground">ȳ ({yCol}) = </span>
                <span className="font-medium">{formatNumber(yMean, 4)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Main data table */}
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center w-12">#</TableHead>
                {xCols.map((col) => (
                  <TableHead key={col} className="text-right">{col}</TableHead>
                ))}
                <TableHead className="text-right">Y ({yCol})</TableHead>
                <TableHead className="text-right">Ŷ</TableHead>
                <TableHead className="text-right">eᵢ = Y-Ŷ</TableHead>
                <TableHead className="text-right">eᵢ²</TableHead>
                <TableHead className="text-right">(Yᵢ-Ȳ)²</TableHead>
                <TableHead className="text-right">(Ŷᵢ-Ȳ)²</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.map((row) => (
                <TableRow key={row.index}>
                  <TableCell className="text-center text-muted-foreground tabular-nums">
                    {row.index + 1}
                  </TableCell>
                  {xCols.map((col) => (
                    <TableCell key={col} className="text-right tabular-nums">
                      {formatNumber(row.x_values[col], 4)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(row.y_actual, 4)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(row.y_predicted, 4)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(row.residual, 4)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(row.eSq, 4)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(row.yDevSq, 4)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(row.yHatDevSq, 4)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-muted/60 font-semibold">
                <TableCell colSpan={xCols.length + 3} className="text-right text-xs uppercase tracking-wider">
                  Σ Totals
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(totals.sse, 4)}
                  <div className="text-[10px] font-normal text-muted-foreground">SSE</div>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(totals.sst, 4)}
                  <div className="text-[10px] font-normal text-muted-foreground">SST</div>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(totals.ssr, 4)}
                  <div className="text-[10px] font-normal text-muted-foreground">SSR</div>
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>

        {/* Show more / less toggle */}
        {hasMore && (
          <div className="flex justify-center">
            <Button variant="outline" size="sm" onClick={() => setShowAll(!showAll)}>
              {showAll
                ? `Show first ${INITIAL_ROWS} rows`
                : `Show all ${enrichedRows.length} rows`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
