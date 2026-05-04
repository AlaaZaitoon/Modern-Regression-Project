"use client";

import { Database, Hash, Rows, Type } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatInt } from "@/lib/formatters";
import type { DatasetUploadResponse } from "@/lib/types";

/** Top-of-step summary chips: filename, row/column counts, dtype mix. */
export function DatasetSummary({ dataset }: { dataset: DatasetUploadResponse }) {
  const [rows, cols] = dataset.shape;
  const numeric = dataset.numeric_columns.length;
  const categorical = dataset.categorical_columns.length;

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-3 p-5">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Database className="size-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold" title={dataset.filename}>
              {dataset.filename}
            </div>
            <div className="text-xs text-muted-foreground">Loaded dataset</div>
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <Rows className="size-3" aria-hidden />
            {formatInt(rows)} rows
          </Badge>
          <Badge variant="secondary" className="gap-1.5">
            <Hash className="size-3" aria-hidden />
            {cols} columns
          </Badge>
          <Badge variant="outline" className="gap-1.5">
            <Type className="size-3" aria-hidden />
            {numeric} numeric · {categorical} categorical
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
