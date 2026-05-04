/**
 * TanStack Query v5 client configuration.
 *
 * - Caches keyed by `dataset_id` / `model_id` for fast back-and-forth navigation.
 * - `ApiError` instances are never retried; they carry actionable backend codes.
 */

import { QueryClient } from "@tanstack/react-query";

import { ApiError } from "@/lib/api";

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (error instanceof ApiError) return false;
          return failureCount < 2;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/** Stable key factory so components never drift out of sync. */
export const queryKeys = {
  health: () => ["health"] as const,
  dataset: (datasetId: string) => ["dataset", datasetId] as const,
  model: (modelId: string) => ["model", modelId] as const,
};
