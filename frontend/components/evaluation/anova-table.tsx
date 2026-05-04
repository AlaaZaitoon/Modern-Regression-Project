"use client";

import { CheckCircle2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumber, formatPValue } from "@/lib/formatters";
import type { AnovaTable as AnovaData } from "@/lib/types";

interface Props {
  anova: AnovaData;
}

/**
 * Full ANOVA decomposition table. All values come straight from the backend;
 * this component only formats them for display. The reject / fail-to-reject
 * decision is already computed server-side.
 */
export function AnovaTable({ anova }: Props) {
  const reject = anova.decision === "reject_h0";

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>ANOVA decomposition</CardTitle>
          <CardDescription>
            F-test for overall model significance at α = 0.05.
          </CardDescription>
        </div>
        <Badge variant={reject ? "success" : "destructive"} className="shrink-0 gap-1">
          {reject ? (
            <>
              <CheckCircle2 className="size-3.5" aria-hidden />
              Reject H₀
            </>
          ) : (
            <>
              <XCircle className="size-3.5" aria-hidden />
              Fail to reject H₀
            </>
          )}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">SS</TableHead>
                <TableHead className="text-right">df</TableHead>
                <TableHead className="text-right">MS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Regression</TableCell>
                <TableCell className="text-right tabular-nums">{formatNumber(anova.SSR, 4)}</TableCell>
                <TableCell className="text-right tabular-nums">{anova.df_reg}</TableCell>
                <TableCell className="text-right tabular-nums">{formatNumber(anova.MSR, 4)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Residual</TableCell>
                <TableCell className="text-right tabular-nums">{formatNumber(anova.SSE, 4)}</TableCell>
                <TableCell className="text-right tabular-nums">{anova.df_res}</TableCell>
                <TableCell className="text-right tabular-nums">{formatNumber(anova.MSE, 4)}</TableCell>
              </TableRow>
              <TableRow className="bg-muted/40">
                <TableCell className="font-semibold">Total</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatNumber(anova.SST, 4)}
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{anova.df_tot}</TableCell>
                <TableCell className="text-right">—</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="F statistic" value={formatNumber(anova.F_stat, 4)} />
          <Stat label="F critical" value={formatNumber(anova.F_critical, 4)} />
          <Stat label="p-value" value={formatPValue(anova.p_value)} />
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/30 p-3 text-center">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-base font-semibold tabular-nums">{value}</div>
    </div>
  );
}
