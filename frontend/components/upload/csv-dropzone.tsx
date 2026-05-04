"use client";

import * as React from "react";
import { CloudUpload, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUploadDataset } from "@/hooks/use-upload-dataset";

const DEFAULT_MAX_MB = 25;

function getMaxMb(): number {
  const raw = process.env.NEXT_PUBLIC_MAX_UPLOAD_MB;
  const parsed = raw ? Number.parseFloat(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_MB;
}

/**
 * Drag-and-drop CSV upload. Performs lightweight client-side validation
 * (extension, size, non-empty) and then hands the file to the typed
 * upload mutation. Errors come back through `useUploadDataset` and are
 * surfaced as toasts.
 */
export function CsvDropzone() {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setDragging] = React.useState(false);
  const upload = useUploadDataset();
  const maxMb = getMaxMb();

  const validate = React.useCallback(
    (file: File): string | null => {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        return "Only .csv files are supported.";
      }
      if (file.size === 0) {
        return "The file is empty.";
      }
      if (file.size > maxMb * 1024 * 1024) {
        return `File exceeds the ${maxMb} MB limit.`;
      }
      return null;
    },
    [maxMb],
  );

  const accept = React.useCallback(
    (file: File) => {
      const error = validate(file);
      if (error) {
        toast.error("Invalid file", { description: error });
        return;
      }
      upload.mutate(file);
    },
    [upload, validate],
  );

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) accept(file);
    // Allow re-selecting the same file consecutively.
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) accept(file);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isDragging) setDragging(true);
  };

  const onDragLeave = () => setDragging(false);

  const isPending = upload.isPending;

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className={cn(
        "group relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed bg-card/50 px-6 py-12 text-center transition-colors",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-muted/30",
        isPending && "pointer-events-none opacity-90",
      )}
    >
      <div
        className={cn(
          "flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform",
          isDragging && "scale-110",
        )}
        aria-hidden
      >
        {isPending ? (
          <Loader2 className="size-7 animate-spin" />
        ) : isDragging ? (
          <FileSpreadsheet className="size-7" />
        ) : (
          <CloudUpload className="size-7" />
        )}
      </div>

      <div className="space-y-1">
        <p className="text-base font-semibold">
          {isPending
            ? "Uploading & profiling…"
            : isDragging
              ? "Drop the CSV to upload"
              : "Drag & drop your CSV here"}
        </p>
        <p className="text-sm text-muted-foreground">
          or browse — must be UTF-8, ≤ {maxMb} MB, with at least one numeric column.
        </p>
      </div>

      <Button
        type="button"
        variant="default"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
      >
        {isPending ? "Uploading…" : "Choose file"}
      </Button>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        onChange={onPick}
        aria-label="Upload CSV file"
      />
    </div>
  );
}
