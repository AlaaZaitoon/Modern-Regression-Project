"use client";

import { Pencil, Sparkles, Upload } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CsvDropzone } from "@/components/upload/csv-dropzone";
import { ManualEntryGrid } from "@/components/upload/manual-entry-grid";
import { SampleDatasets } from "@/components/upload/sample-datasets";

/**
 * Step 1 entry points, from easiest to most flexible:
 *   • Built-in — one-click load of a curated CSV from `/samples/`.
 *   • Upload CSV — drag-and-drop any local CSV.
 *   • Enter manually — spreadsheet-style grid for tiny ad-hoc datasets.
 *
 * All three feed the same `/datasets/upload` endpoint via
 * `useUploadDataset`, so the rest of the workflow is unaware of which
 * path produced the dataset.
 */
export function UploadTabs() {
  return (
    <Tabs defaultValue="samples" className="w-full">
      <TabsList aria-label="Data source">
        <TabsTrigger value="samples">
          <Sparkles className="mr-1.5 size-4" aria-hidden />
          Built-in
        </TabsTrigger>
        <TabsTrigger value="upload">
          <Upload className="mr-1.5 size-4" aria-hidden />
          Upload CSV
        </TabsTrigger>
        <TabsTrigger value="manual">
          <Pencil className="mr-1.5 size-4" aria-hidden />
          Enter manually
        </TabsTrigger>
      </TabsList>
      <TabsContent value="samples">
        <SampleDatasets />
      </TabsContent>
      <TabsContent value="upload">
        <CsvDropzone />
      </TabsContent>
      <TabsContent value="manual">
        <ManualEntryGrid />
      </TabsContent>
    </Tabs>
  );
}
