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
import { Badge } from "@/components/ui/badge";
import { formatInt, formatNumber } from "@/lib/formatters";
import type { DatasetUploadResponse } from "@/lib/types";

/** Per-column descriptive statistics straight from the backend. */
export function DatasetStatsTable({ dataset }: { dataset: DatasetUploadResponse }) {
  const numericSet = new Set(dataset.numeric_columns);
  const entries = Object.entries(dataset.stats);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Descriptive statistics</CardTitle>
        <CardDescription>
          Mean, median, dispersion, range, and cardinality for each column.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Column</TableHead>
              <TableHead className="text-right">Mean</TableHead>
              <TableHead className="text-right">Median</TableHead>
              <TableHead className="text-right">Std</TableHead>
              <TableHead className="text-right">Min</TableHead>
              <TableHead className="text-right">Max</TableHead>
              <TableHead className="text-right">Missing</TableHead>
              <TableHead className="text-right">Unique</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map(([col, s]) => {
              const isNumeric = numericSet.has(col);
              return (
                <TableRow key={col}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span>{col}</span>
                      {!isNumeric ? (
                        <Badge variant="outline" className="text-[10px]">
                          categorical
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(s.mean)}</TableCell>
                  <TableCell className="text-right">{formatNumber(s.median)}</TableCell>
                  <TableCell className="text-right">{formatNumber(s.std)}</TableCell>
                  <TableCell className="text-right">{formatNumber(s.min)}</TableCell>
                  <TableCell className="text-right">{formatNumber(s.max)}</TableCell>
                  <TableCell className="text-right">{formatInt(s.missing)}</TableCell>
                  <TableCell className="text-right">{formatInt(s.unique)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
