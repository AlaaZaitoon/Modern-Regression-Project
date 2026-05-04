"use client";

import * as React from "react";
import {
  Building2,
  Car,
  DollarSign,
  FileSpreadsheet,
  Loader2,
  Megaphone,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { useUploadDataset } from "@/hooks/use-upload-dataset";
import { cn } from "@/lib/utils";

interface Sample {
  id: string;
  /** File name inside `public/samples/` — served statically by Next. */
  filename: string;
  /** Button label. */
  title: string;
  /** One-line description of what the dataset is useful for. */
  description: string;
  /** Suggested target column; surfaced as a badge. */
  target: string;
  /** Number of rows (informational). */
  rows: number;
  icon: LucideIcon;
}

/**
 * Order roughly "simplest → richest" so the user can progress through
 * them while exploring the tool. Every file lives in
 * `frontend/public/samples/` and is served directly by Next.
 */
const SAMPLES: ReadonlyArray<Sample> = [
  {
    id: "salary",
    filename: "Salary_Data.csv",
    title: "Salary vs Experience",
    description: "Simple linear regression — one numeric predictor.",
    target: "Salary",
    rows: 30,
    icon: DollarSign,
  },
  {
    id: "advertising",
    filename: "Advertising.csv",
    title: "Advertising Spend",
    description: "Multiple regression — TV, Radio, Newspaper vs Sales.",
    target: "Sales",
    rows: 200,
    icon: Megaphone,
  },
  {
    id: "car-price",
    filename: "CarPrice.csv",
    title: "Car Price Prediction",
    description: "5 predictors (year, mileage, engine, hp, owners).",
    target: "Price_USD",
    rows: 30,
    icon: Car,
  },
  {
    id: "housing",
    filename: "housing.csv",
    title: "California Housing",
    description: "20,640 block groups — 8 numeric predictors (income, rooms, location, …) vs median house value.",
    target: "median_house_value",
    rows: 20640,
    icon: Building2,
  },
];

/**
 * Built-in datasets panel. Clicking a card fetches the bundled CSV,
 * wraps it in a `File`, and submits it through the existing
 * `useUploadDataset` mutation — so the rest of the workflow (profile,
 * train, predict, report) is entirely unaware of the source.
 *
 * No backend changes are required: the CSVs are served statically by
 * Next from `/samples/<filename>`.
 */
export function SampleDatasets() {
  const upload = useUploadDataset();
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const loadSample = React.useCallback(
    async (sample: Sample) => {
      setPendingId(sample.id);
      try {
        const res = await fetch(`/samples/${sample.filename}`, { cache: "force-cache" });
        if (!res.ok) {
          throw new Error(`Failed to load ${sample.filename} (${res.status}).`);
        }
        const blob = await res.blob();
        const file = new File([blob], sample.filename, { type: "text/csv" });
        upload.mutate(file, {
          onSettled: () => setPendingId(null),
        });
      } catch (err) {
        setPendingId(null);
        const message = err instanceof Error ? err.message : "Unable to load sample.";
        toast.error("Sample unavailable", { description: message });
      }
    },
    [upload],
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Try the app instantly with a curated CSV — one click uploads it through the same
        pipeline as a regular file.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {SAMPLES.map((sample) => {
          const Icon = sample.icon;
          const isPending = pendingId === sample.id;
          const isDisabled = upload.isPending; // disable all while any one loads

          return (
            <button
              key={sample.id}
              type="button"
              onClick={() => loadSample(sample)}
              disabled={isDisabled}
              aria-label={`Load sample dataset: ${sample.title}`}
              className={cn(
                "group flex flex-col gap-2 rounded-xl border bg-card p-4 text-left transition-all",
                "hover:border-primary/60 hover:bg-primary/5 hover:shadow-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-60",
                isPending && "border-primary/80 bg-primary/5",
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-lg",
                    "bg-primary/10 text-primary transition-colors",
                    "group-hover:bg-primary group-hover:text-primary-foreground",
                    isPending && "bg-primary text-primary-foreground",
                  )}
                  aria-hidden
                >
                  {isPending ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <Icon className="size-5" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{sample.title}</span>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {sample.rows} rows
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{sample.description}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Target:{" "}
                    <span className="font-mono text-foreground">{sample.target}</span>
                    <span className="mx-1">·</span>
                    <FileSpreadsheet className="inline-block size-3 align-text-bottom" aria-hidden />{" "}
                    <span className="font-mono">{sample.filename}</span>
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
