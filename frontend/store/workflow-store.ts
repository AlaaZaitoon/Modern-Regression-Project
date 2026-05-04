/**
 * Global workflow store — in-memory only (no persistence).
 *
 * Downstream steps (charts, tables, prediction form) read from here so the
 * UI never needs to refetch the same dataset/model across navigation within
 * a single session. A full page reload resets the workflow, which matches
 * the backend's in-memory registries (dataset/model ids don't survive a
 * backend restart anyway).
 *
 * Workflow steps:
 *   1 — Upload
 *   2 — Configure model
 *   3 — Visualizations
 *   4 — Results + prediction
 *   5 — Report
 */

import { create } from "zustand";

import type {
  DatasetUploadResponse,
  PredictResponse,
  TrainResponse,
} from "@/lib/types";

export type WorkflowStep = 1 | 2 | 3 | 4 | 5;

interface WorkflowState {
  currentStep: WorkflowStep;
  datasetId: string | null;
  lastDataset: DatasetUploadResponse | null;
  modelId: string | null;
  lastTrainResponse: TrainResponse | null;
  lastPrediction: PredictResponse | null;
}

interface WorkflowActions {
  setStep: (step: WorkflowStep) => void;
  setDataset: (dataset: DatasetUploadResponse) => void;
  setModel: (response: TrainResponse) => void;
  setPrediction: (prediction: PredictResponse) => void;
  reset: () => void;
}

const INITIAL_STATE: WorkflowState = {
  currentStep: 1,
  datasetId: null,
  lastDataset: null,
  modelId: null,
  lastTrainResponse: null,
  lastPrediction: null,
};

export const useWorkflowStore = create<WorkflowState & WorkflowActions>()((set) => ({
  ...INITIAL_STATE,

  setStep: (step) => set({ currentStep: step }),

  setDataset: (dataset) =>
    set({
      datasetId: dataset.dataset_id,
      lastDataset: dataset,
      // Uploading a new dataset invalidates any previously trained model.
      modelId: null,
      lastTrainResponse: null,
      lastPrediction: null,
    }),

  setModel: (response) =>
    set({
      modelId: response.model_id,
      lastTrainResponse: response,
      lastPrediction: null,
    }),

  setPrediction: (prediction) => set({ lastPrediction: prediction }),

  reset: () => set({ ...INITIAL_STATE }),
}));
