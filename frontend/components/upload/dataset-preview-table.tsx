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
import type { DatasetUploadResponse } from "@/lib/types";

/** Formats an arbitrary preview cell into a string the table can render. */
function fmtCell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "—";
    if (Number.isInteger(value)) return value.toLocaleString();
    return value.toLocaleString(undefined, { maximumFractionDigits: 4 });
  }
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

/** First N rows of the uploaded dataset (N defaults to 10 from the backend). */
export function DatasetPreviewTable({ dataset }: { dataset: DatasetUploadResponse }) {
  const rows = dataset.preview;
  const cols = dataset.columns;
  const numericSet = new Set(dataset.numeric_columns);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview</CardTitle>
        <CardDescription>
          First {rows.length} row{rows.length === 1 ? "" : "s"} as parsed by the backend.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-muted-foreground">
            The dataset has no rows to preview.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-right">#</TableHead>
                {cols.map((c) => (
                  <TableHead
                    key={c}
                    className={numericSet.has(c) ? "text-right" : "text-left"}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {c}
                      </span>
                      <span className="text-[10px] font-normal normal-case tracking-normal text-muted-foreground/70">
                        {dataset.dtypes[c] ?? "—"}
                      </span>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {idx + 1}
                  </TableCell>
                  {cols.map((c) => (
                    <TableCell
                      key={c}
                      className={numericSet.has(c) ? "text-right" : "text-left"}
                    >
                      {fmtCell(row[c])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
