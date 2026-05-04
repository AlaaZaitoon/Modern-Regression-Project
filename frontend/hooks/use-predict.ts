"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError, api } from "@/lib/api";
import type { PredictResponse } from "@/lib/types";
import { useWorkflowStore } from "@/store/workflow-store";

interface PredictArgs {
  modelId: string;
  xValues: Record<string, number>;
}

/**
 * Wraps the `/models/:id/predict` endpoint. On success caches the response
 * in the workflow store so the UI can render the prediction + interval
 * without refetching. Maps the `model_not_found` error to a helpful toast
 * instructing the user to retrain (the backend's in-memory registries are
 * reset on restart).
 */
export function usePredict() {
  const setPrediction = useWorkflowStore((s) => s.setPrediction);
  const setStep = useWorkflowStore((s) => s.setStep);

  return useMutation<PredictResponse, Error, PredictArgs>({
    mutationFn: ({ modelId, xValues }) => api.predict(modelId, xValues),
    onSuccess: (data) => {
      setPrediction(data);
    },
    onError: (error) => {
      let title = "Prediction failed";
      let description = error instanceof Error ? error.message : "Unexpected error.";

      if (error instanceof ApiError) {
        if (error.status === 404 || error.code === "model_not_found") {
          title = "Model no longer available";
          description =
            "The backend was restarted or the model expired. Re-train from Step 2 to continue.";
          // Send the user back to configure so they can retrain.
          setStep(2);
        } else if (error.code === "validation_error") {
          description = error.message;
        } else {
          description = error.message;
        }
      }

      toast.error(title, { description });
    },
  });
}
