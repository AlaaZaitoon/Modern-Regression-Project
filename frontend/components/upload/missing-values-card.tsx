"use client";

import { CircleCheck } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatInt, formatPercent } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { DatasetUploadResponse } from "@/lib/types";

/** Per-column missing-value summary with a tiny inline bar gauge. */
export function MissingValuesCard({ dataset }: { dataset: DatasetUploadResponse }) {
  const totalRows = dataset.shape[0];
  const entries = Object.entries(dataset.missing).sort(([, a], [, b]) => b - a);
  const totalMissing = entries.reduce((acc, [, v]) => acc + v, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Missing values</CardTitle>
        <CardDescription>
          {totalMissing === 0
            ? "No missing values detected."
            : `${formatInt(totalMissing)} cell${totalMissing === 1 ? "" : "s"} missing across ${entries.filter(([, v]) => v > 0).length} column(s).`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {totalMissing === 0 ? (
          <div className="flex items-center gap-2 rounded-md bg-success/10 p-3 text-sm text-success">
            <CircleCheck className="size-4" aria-hidden />
            <span>Every column is fully populated.</span>
          </div>
        ) : (
          <ul className="space-y-2">
            {entries.map(([col, missing]) => {
              const pct = totalRows > 0 ? missing / totalRows : 0;
              return (
                <li key={col} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{col}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatInt(missing)} ({formatPercent(pct, 1)})
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-valuenow={pct * 100}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                  >
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        pct < 0.05
                          ? "bg-success"
                          : pct < 0.2
                            ? "bg-warning"
                            : "bg-destructive",
                      )}
                      style={{ width: `${Math.max(pct * 100, missing > 0 ? 2 : 0)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
