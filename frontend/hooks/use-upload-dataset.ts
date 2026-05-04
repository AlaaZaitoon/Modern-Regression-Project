"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError, api } from "@/lib/api";
import { queryKeys } from "@/lib/query-client";
import type { DatasetUploadResponse } from "@/lib/types";
import { useWorkflowStore } from "@/store/workflow-store";

/** Uploads a CSV and persists the response into the workflow store. */
export function useUploadDataset() {
  const queryClient = useQueryClient();
  const setDataset = useWorkflowStore((s) => s.setDataset);
  const setStep = useWorkflowStore((s) => s.setStep);

  return useMutation<DatasetUploadResponse, Error, File>({
    mutationFn: (file) => api.uploadDataset(file),
    onSuccess: (data) => {
      setDataset(data);
      // Cache the full response for any subsequent /datasets/{id} reads.
      queryClient.setQueryData(queryKeys.dataset(data.dataset_id), data);
      // Stay on Step 1 so the user can review the dataset summary.
      setStep(1);
      toast.success(`Loaded ${data.filename}`, {
        description: `${data.shape[0].toLocaleString()} rows · ${data.shape[1]} columns`,
      });
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : "Unable to upload the dataset.";
      const description =
        error instanceof ApiError && error.code !== "http_500"
          ? `Code: ${error.code}`
          : undefined;
      toast.error("Upload failed", { description: description ?? message });
    },
  });
}
