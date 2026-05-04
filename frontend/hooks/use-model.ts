"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-client";
import type { TrainResponse } from "@/lib/types";

/**
 * Fetches a trained model by id. Useful when the user lands on a page
 * (e.g. `/report`) directly or in a new tab — the in-memory Zustand
 * store is empty there, but the backend still has the model cached.
 */
export function useModel(modelId: string | null | undefined) {
  return useQuery<TrainResponse>({
    queryKey: modelId ? queryKeys.model(modelId) : ["model", "none"],
    queryFn: () => api.getModel(modelId as string),
    enabled: Boolean(modelId),
  });
}
