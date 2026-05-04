"use client";

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
import type { TTest } from "@/lib/types";

interface Props {
  rows: TTest[];
}

/**
 * Per-coefficient t-tests. The `significant` flag is computed by the
 * backend at α = 0.05 — we only render it.
 */
export function TTestTable({ rows }: Props) {
  const total = rows.length;
  const sig = rows.filter((r) => r.significant).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Coefficient t-tests</CardTitle>
          <CardDescription>
            Individual significance at α = 0.05 ({sig} of {total} coefficient
            {total === 1 ? "" : "s"} significant).
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Variable</TableHead>
                <TableHead className="text-right">Coefficient</TableHead>
                <TableHead className="text-right">Std. error</TableHead>
                <TableHead className="text-right">t-stat</TableHead>
                <TableHead className="text-right">p-value</TableHead>
                <TableHead className="text-center">α = 0.05</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.variable}>
                  <TableCell className="font-medium">
                    {r.variable === "intercept" ? (
                      <span className="italic text-muted-foreground">intercept</span>
                    ) : (
                      r.variable
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(r.coefficient, 4)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(r.std_error, 4)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(r.t_stat, 4)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatPValue(r.p_value)}</TableCell>
                  <TableCell className="text-center">
                    {r.significant ? (
                      <Badge variant="success">Significant</Badge>
                    ) : (
                      <Badge variant="secondary">Not significant</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
