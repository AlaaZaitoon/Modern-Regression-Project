import { describe, expect, it, beforeEach } from "vitest";

import { useWorkflowStore } from "@/store/workflow-store";
import type {
  DatasetUploadResponse,
  PredictResponse,
  TrainResponse,
} from "@/lib/types";

function makeDataset(id = "ds-1"): DatasetUploadResponse {
  return {
    dataset_id: id,
    filename: "x.csv",
    columns: ["x", "y"],
    numeric_columns: ["x", "y"],
    categorical_columns: [],
    dtypes: { x: "float64", y: "float64" },
    shape: [10, 2],
    missing: { x: 0, y: 0 },
    preview: [],
    stats: {
      x: { mean: 0, median: 0, std: 1, min: 0, max: 0, missing: 0, unique: 10 },
      y: { mean: 0, median: 0, std: 1, min: 0, max: 0, missing: 0, unique: 10 },
    },
    correlation_matrix: { columns: ["x", "y"], matrix: [[1, 0.9], [0.9, 1]] },
    created_at: new Date().toISOString(),
  };
}

function makeTrain(modelId = "m-1", datasetId = "ds-1"): TrainResponse {
  return {
    model_id: modelId,
    dataset_id: datasetId,
    model_type: "simple",
    x_cols: ["x"],
    y_col: "y",
    equation_str: "y = 1 + 2x",
    coefficients: { intercept: 1, slopes: { x: 2 } },
    metrics: { r2: 0.99, adj_r2: 0.98, mse: 0.1, rmse: 0.3, mae: 0.2, se: 0.3 },
    anova: {
      SSR: 10, SSE: 1, SST: 11, df_reg: 1, df_res: 8, df_tot: 9,
      MSR: 10, MSE: 0.125, F_stat: 80, F_critical: 5, p_value: 0.0001,
      decision: "reject_h0",
    },
    t_tests: [],
    confidence_intervals: [],
    feature_importance: [],
    correlation_matrix: { columns: ["x", "y"], matrix: [[1, 0.9], [0.9, 1]] },
    cooks_distance: [],
    predictions: [],
    created_at: new Date().toISOString(),
  };
}

function makePredict(): PredictResponse {
  return {
    model_id: "m-1",
    prediction: 7,
    prediction_interval: [5, 9],
    confidence_level: 0.95,
    x_values: { x: 3 },
    interpretation: "Predicted y ~ 7 with a 95% prediction interval of [5, 9].",
  };
}

describe("useWorkflowStore", () => {
  beforeEach(() => {
    useWorkflowStore.getState().reset();
  });

  it("starts at step 1 with null payloads", () => {
    const state = useWorkflowStore.getState();
    expect(state.currentStep).toBe(1);
    expect(state.datasetId).toBeNull();
    expect(state.lastDataset).toBeNull();
    expect(state.modelId).toBeNull();
    expect(state.lastTrainResponse).toBeNull();
    expect(state.lastPrediction).toBeNull();
  });

  it("setDataset stores the payload and clears model state", () => {
    const s = useWorkflowStore.getState();
    s.setModel(makeTrain());
    s.setDataset(makeDataset("ds-2"));

    const next = useWorkflowStore.getState();
    expect(next.datasetId).toBe("ds-2");
    expect(next.lastDataset).not.toBeNull();
    expect(next.modelId).toBeNull();
    expect(next.lastTrainResponse).toBeNull();
    expect(next.lastPrediction).toBeNull();
  });

  it("setModel stores the train response and clears the last prediction", () => {
    const s = useWorkflowStore.getState();
    s.setPrediction(makePredict());
    s.setModel(makeTrain("m-42"));

    const next = useWorkflowStore.getState();
    expect(next.modelId).toBe("m-42");
    expect(next.lastPrediction).toBeNull();
  });

  it("reset returns to the initial state", () => {
    const s = useWorkflowStore.getState();
    s.setDataset(makeDataset());
    s.setModel(makeTrain());
    s.setPrediction(makePredict());
    s.setStep(4);

    s.reset();
    expect(useWorkflowStore.getState().currentStep).toBe(1);
    expect(useWorkflowStore.getState().datasetId).toBeNull();
  });
});
