"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-client";
import type { DatasetUploadResponse } from "@/lib/types";

/**
 * Fetches a previously uploaded dataset by id. Generally not needed during
 * a fresh session because `useUploadDataset` already primes the cache, but
 * useful when navigating to the workflow with only a `dataset_id` in hand.
 */
export function useDataset(datasetId: string | null | undefined) {
  return useQuery<DatasetUploadResponse>({
    queryKey: datasetId ? queryKeys.dataset(datasetId) : ["dataset", "none"],
    queryFn: () => api.getDataset(datasetId as string),
    enabled: Boolean(datasetId),
  });
}
