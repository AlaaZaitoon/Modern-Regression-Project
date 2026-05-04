"use client";

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
import { formatNumber, formatPercent } from "@/lib/formatters";
import type { ConfidenceInterval } from "@/lib/types";

interface Props {
  intervals: ConfidenceInterval[];
}

export function CiTable({ intervals }: Props) {
  const level = intervals[0]?.level ?? 0.95;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Confidence intervals</CardTitle>
        <CardDescription>
          {formatPercent(level, 0)} intervals for each coefficient.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Variable</TableHead>
                <TableHead className="text-right">Lower</TableHead>
                <TableHead className="text-right">Upper</TableHead>
                <TableHead className="text-right">Width</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {intervals.map((ci) => (
                <TableRow key={ci.variable}>
                  <TableCell className="font-medium">
                    {ci.variable === "intercept" ? (
                      <span className="italic text-muted-foreground">intercept</span>
                    ) : (
                      ci.variable
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(ci.lower, 4)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(ci.upper, 4)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(ci.upper - ci.lower, 4)}
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
