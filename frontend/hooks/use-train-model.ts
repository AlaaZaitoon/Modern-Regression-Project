"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError, api } from "@/lib/api";
import { queryKeys } from "@/lib/query-client";
import type { TrainRequest, TrainResponse } from "@/lib/types";
import { useWorkflowStore } from "@/store/workflow-store";

/** Trains a regression model and stores the response, then advances to Step 3. */
export function useTrainModel() {
  const queryClient = useQueryClient();
  const setModel = useWorkflowStore((s) => s.setModel);
  const setStep = useWorkflowStore((s) => s.setStep);

  return useMutation<TrainResponse, Error, TrainRequest>({
    mutationFn: (req) => api.trainModel(req),
    onSuccess: (data) => {
      setModel(data);
      queryClient.setQueryData(queryKeys.model(data.model_id), data);
      setStep(3);
      toast.success("Model trained", {
        description: `R² = ${data.metrics.r2.toFixed(3)} · ${data.x_cols.length} predictor${
          data.x_cols.length === 1 ? "" : "s"
        }`,
      });
    },
    onError: (error) => {
      let title = "Training failed";
      let description = error instanceof Error ? error.message : "Unexpected error.";

      if (error instanceof ApiError) {
        if (error.code === "singular_matrix") {
          title = "Singular design matrix";
          description =
            "Your predictors are perfectly collinear. Drop a redundant column or pick different X variables.";
        } else if (error.code === "categorical_x_unsupported") {
          title = "Categorical predictor";
          description =
            "OLS only accepts numeric X columns. Encode the variable first or pick a numeric one.";
        } else {
          description = error.message;
        }
      }

      toast.error(title, { description });
    },
  });
}
