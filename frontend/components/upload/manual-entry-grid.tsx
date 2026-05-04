"use client";

import * as React from "react";
import { Loader2, Plus, RotateCcw, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUploadDataset } from "@/hooks/use-upload-dataset";
import { cn } from "@/lib/utils";

type ColumnType = "numeric" | "text";

interface ColumnDef {
  /** Stable id so renames + reorders don't lose row data. */
  id: string;
  name: string;
  type: ColumnType;
}

type RowMap = Record<string, string>;

const MIN_ROWS = 5;
const MIN_COLUMNS = 2;
const COLUMN_NAME_RE = /^[A-Za-z_][A-Za-z0-9_ ]{0,30}$/;

/** RFC-4180-ish escaping for CSV cells. */
function escapeCsv(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildCsv(columns: ColumnDef[], rows: RowMap[]): string {
  const header = columns.map((c) => escapeCsv(c.name)).join(",");
  const lines = rows.map((row) =>
    columns.map((c) => escapeCsv((row[c.id] ?? "").trim())).join(","),
  );
  return [header, ...lines].join("\n") + "\n";
}

function newColumn(name: string, type: ColumnType = "numeric"): ColumnDef {
  // crypto.randomUUID is widely available in modern browsers; fall back
  // to a counter-style id for older Node environments used in tests.
  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `col_${Math.random().toString(36).slice(2, 10)}`;
  return { id, name, type };
}

function defaultColumns(): ColumnDef[] {
  return [newColumn("x", "numeric"), newColumn("y", "numeric")];
}

function defaultRows(columns: ColumnDef[], n: number): RowMap[] {
  return Array.from({ length: n }, () =>
    Object.fromEntries(columns.map((c) => [c.id, ""])) as RowMap,
  );
}

/**
 * Spreadsheet-style manual data entry. Submitting builds an in-memory
 * CSV and reuses the existing `useUploadDataset` mutation, so the rest
 * of the workflow (preview, train, predict, report) is unchanged.
 *
 * No client-side statistics are computed: every metric still comes from
 * the backend's profiling response.
 */
export function ManualEntryGrid() {
  const [columns, setColumns] = React.useState<ColumnDef[]>(defaultColumns);
  const [rows, setRows] = React.useState<RowMap[]>(() =>
    defaultRows(defaultColumns(), MIN_ROWS),
  );
  const upload = useUploadDataset();

  // ── derived validation state ──────────────────────────────────────
  const columnErrors = React.useMemo(() => {
    const errs: Record<string, string> = {};
    const seen = new Set<string>();
    for (const col of columns) {
      const trimmed = col.name.trim();
      if (!trimmed) {
        errs[col.id] = "Name required";
      } else if (!COLUMN_NAME_RE.test(trimmed)) {
        errs[col.id] = "Letters / digits / underscore";
      } else if (seen.has(trimmed.toLowerCase())) {
        errs[col.id] = "Duplicate name";
      }
      seen.add(trimmed.toLowerCase());
    }
    return errs;
  }, [columns]);

  /** Map of `${rowIndex}|${colId}` → error message. */
  const cellErrors = React.useMemo(() => {
    const errs: Record<string, string> = {};
    rows.forEach((row, ri) => {
      for (const col of columns) {
        const raw = (row[col.id] ?? "").trim();
        if (!raw) continue; // empty cells are tolerated; backend handles missing
        if (col.type === "numeric" && !Number.isFinite(Number(raw))) {
          errs[`${ri}|${col.id}`] = "Not a number";
        }
      }
    });
    return errs;
  }, [rows, columns]);

  const filledRowCount = React.useMemo(() => {
    return rows.filter((row) =>
      columns.some((c) => (row[c.id] ?? "").trim().length > 0),
    ).length;
  }, [rows, columns]);

  const hasColumnErrors = Object.keys(columnErrors).length > 0;
  const hasCellErrors = Object.keys(cellErrors).length > 0;
  const enoughRows = filledRowCount >= MIN_ROWS;
  const enoughColumns = columns.length >= MIN_COLUMNS;
  const canSubmit =
    enoughRows && enoughColumns && !hasColumnErrors && !hasCellErrors && !upload.isPending;

  // ── mutators ──────────────────────────────────────────────────────
  const addColumn = () => {
    const next = newColumn(`col${columns.length + 1}`, "numeric");
    setColumns((c) => [...c, next]);
    setRows((rs) => rs.map((r) => ({ ...r, [next.id]: "" })));
  };

  const removeColumn = (id: string) => {
    if (columns.length <= MIN_COLUMNS) {
      toast.error("At least two columns are required.");
      return;
    }
    setColumns((c) => c.filter((col) => col.id !== id));
    setRows((rs) =>
      rs.map((r) => {
        const copy = { ...r };
        delete copy[id];
        return copy;
      }),
    );
  };

  const updateColumn = (id: string, patch: Partial<ColumnDef>) => {
    setColumns((c) => c.map((col) => (col.id === id ? { ...col, ...patch } : col)));
  };

  const addRow = () => {
    setRows((rs) => [...rs, Object.fromEntries(columns.map((c) => [c.id, ""])) as RowMap]);
  };

  const removeRow = (index: number) => {
    setRows((rs) => rs.filter((_, i) => i !== index));
  };

  const updateCell = (rowIndex: number, colId: string, value: string) => {
    setRows((rs) =>
      rs.map((r, i) => (i === rowIndex ? { ...r, [colId]: value } : r)),
    );
  };

  const reset = () => {
    const cols = defaultColumns();
    setColumns(cols);
    setRows(defaultRows(cols, MIN_ROWS));
  };

  // ── submit ────────────────────────────────────────────────────────
  const onSubmit = () => {
    if (!canSubmit) return;
    // Drop trailing fully-empty rows so the user can hit submit even if
    // they padded the grid. Any row with at least one non-empty cell is
    // forwarded as-is to the backend (which handles missing values).
    const cleanedRows = rows.filter((row) =>
      columns.some((c) => (row[c.id] ?? "").trim().length > 0),
    );
    const csv = buildCsv(columns, cleanedRows);
    const file = new File([csv], "manual_entry.csv", { type: "text/csv" });
    upload.mutate(file);
  };

  // ── render ────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card/50 p-4">
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="w-10 pb-2 text-left font-medium text-muted-foreground">#</th>
                {columns.map((col) => {
                  const err = columnErrors[col.id];
                  return (
                    <th key={col.id} className="min-w-[160px] pb-2 pr-2 text-left">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Input
                            value={col.name}
                            onChange={(e) => updateColumn(col.id, { name: e.target.value })}
                            aria-label={`Column ${col.id} name`}
                            className={cn(
                              "h-8 font-medium",
                              err && "border-destructive focus-visible:ring-destructive",
                            )}
                          />
                          <button
                            type="button"
                            onClick={() => removeColumn(col.id)}
                            className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            aria-label={`Remove column ${col.name}`}
                            title="Remove column"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1">
                          <ColumnTypeToggle
                            value={col.type}
                            onChange={(t) => updateColumn(col.id, { type: t })}
                          />
                          {err ? (
                            <span className="text-[11px] text-destructive">{err}</span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">
                              {col.type === "numeric" ? "decimal" : "free text"}
                            </span>
                          )}
                        </div>
                      </div>
                    </th>
                  );
                })}
                <th className="w-10 pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri}>
                  <td className="py-1 pr-2 text-xs text-muted-foreground">{ri + 1}</td>
                  {columns.map((col) => {
                    const err = cellErrors[`${ri}|${col.id}`];
                    return (
                      <td key={col.id} className="py-1 pr-2 align-top">
                        <Input
                          value={row[col.id] ?? ""}
                          onChange={(e) => updateCell(ri, col.id, e.target.value)}
                          inputMode={col.type === "numeric" ? "decimal" : "text"}
                          aria-label={`Row ${ri + 1} column ${col.name}`}
                          aria-invalid={Boolean(err)}
                          className={cn(
                            "h-8",
                            err && "border-destructive focus-visible:ring-destructive",
                          )}
                        />
                        {err ? (
                          <p className="mt-0.5 text-[11px] text-destructive">{err}</p>
                        ) : null}
                      </td>
                    );
                  })}
                  <td className="py-1 align-top">
                    <button
                      type="button"
                      onClick={() => removeRow(ri)}
                      disabled={rows.length <= 1}
                      className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Remove row ${ri + 1}`}
                      title="Remove row"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
          <Button type="button" size="sm" variant="outline" onClick={addRow}>
            <Plus />
            Add row
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={addColumn}>
            <Plus />
            Add column
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={reset}>
            <RotateCcw />
            Reset
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">
            {filledRowCount} / {MIN_ROWS} rows · {columns.length} columns
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          aria-label="Use this dataset"
        >
          {upload.isPending ? (
            <>
              <Loader2 className="animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <Send />
              Use this dataset
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground">
          Need at least <strong>{MIN_ROWS}</strong> filled rows and{" "}
          <strong>{MIN_COLUMNS}</strong> columns before you can submit. Empty cells are
          treated as missing values by the backend.
        </p>
      </div>
    </div>
  );
}

interface ColumnTypeToggleProps {
  value: ColumnType;
  onChange: (next: ColumnType) => void;
}

function ColumnTypeToggle({ value, onChange }: ColumnTypeToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Column type"
      className="inline-flex h-6 items-center rounded-md border bg-background p-0.5 text-[11px]"
    >
      {(["numeric", "text"] as const).map((t) => (
        <button
          key={t}
          role="radio"
          aria-checked={value === t}
          type="button"
          onClick={() => onChange(t)}
          className={cn(
            "rounded-sm px-2 py-0.5 font-medium transition-colors",
            value === t
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t === "numeric" ? "123" : "Aa"}
        </button>
      ))}
    </div>
  );
}
