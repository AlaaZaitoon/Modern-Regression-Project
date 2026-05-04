/**
 * Canned responses used by both the MSW handlers and any test that needs
 * to seed the Zustand store directly (e.g. to test a step container in
 * isolation).
 *
 * Numbers are realistic outputs from a 2-predictor OLS fit so the UI paths
 * that branch on significance / influence still exercise both code paths.
 */

import type {
  DatasetUploadResponse,
  HealthResponse,
  PredictResponse,
  TrainResponse,
} from "@/lib/types";

export const DATASET_ID = "ds_fixture_001";
export const MODEL_ID = "mdl_fixture_001";

export const healthFixture: HealthResponse = {
  status: "ok",
  version: "1.0.0",
  uptime_seconds: 42.5,
};

export const datasetFixture: DatasetUploadResponse = {
  dataset_id: DATASET_ID,
  filename: "Salary_Data.csv",
  columns: ["YearsExperience", "Salary"],
  numeric_columns: ["YearsExperience", "Salary"],
  categorical_columns: [],
  dtypes: { YearsExperience: "float64", Salary: "float64" },
  shape: [30, 2],
  missing: { YearsExperience: 0, Salary: 0 },
  preview: [
    { YearsExperience: 1.1, Salary: 39343 },
    { YearsExperience: 1.3, Salary: 46205 },
    { YearsExperience: 1.5, Salary: 37731 },
  ],
  stats: {
    YearsExperience: {
      mean: 5.31,
      median: 4.7,
      std: 2.83,
      min: 1.1,
      max: 10.5,
      missing: 0,
      unique: 30,
    },
    Salary: {
      mean: 76003,
      median: 65237,
      std: 27414,
      min: 37731,
      max: 122391,
      missing: 0,
      unique: 30,
    },
  },
  correlation_matrix: {
    columns: ["YearsExperience", "Salary"],
    matrix: [
      [1.0, 0.978],
      [0.978, 1.0],
    ],
  },
  created_at: "2025-01-01T00:00:00Z",
};

export const trainResponseFixture: TrainResponse = {
  model_id: MODEL_ID,
  dataset_id: DATASET_ID,
  model_type: "simple",
  x_cols: ["YearsExperience"],
  y_col: "Salary",
  equation_str: "Salary = 25792.20 + 9449.96 · YearsExperience",
  coefficients: {
    intercept: 25792.2,
    slopes: { YearsExperience: 9449.96 },
  },
  metrics: {
    r2: 0.957,
    adj_r2: 0.955,
    mse: 31270951.7,
    rmse: 5592.04,
    mae: 4644.2,
    se: 5788.3,
  },
  anova: {
    SSR: 1.95e10,
    SSE: 8.77e8,
    SST: 2.04e10,
    df_reg: 1,
    df_res: 28,
    df_tot: 29,
    MSR: 1.95e10,
    MSE: 3.13e7,
    F_stat: 622.5,
    F_critical: 4.2,
    p_value: 1.14e-20,
    decision: "reject_h0",
  },
  t_tests: [
    {
      variable: "intercept",
      coefficient: 25792.2,
      std_error: 2273.0,
      t_stat: 11.35,
      p_value: 5.5e-12,
      significant: true,
    },
    {
      variable: "YearsExperience",
      coefficient: 9449.96,
      std_error: 378.8,
      t_stat: 24.95,
      p_value: 1.14e-20,
      significant: true,
    },
  ],
  confidence_intervals: [
    { variable: "intercept", lower: 21136.0, upper: 30448.4, level: 0.95 },
    { variable: "YearsExperience", lower: 8674.1, upper: 10225.8, level: 0.95 },
  ],
  feature_importance: [
    {
      variable: "YearsExperience",
      standardized_coef: 0.978,
      importance: 1.0,
      direction: "positive",
    },
  ],
  correlation_matrix: {
    columns: ["YearsExperience", "Salary"],
    matrix: [
      [1.0, 0.978],
      [0.978, 1.0],
    ],
  },
  cooks_distance: [
    { index: 0, value: 0.08, threshold: 0.133, high_influence: false },
    { index: 1, value: 0.02, threshold: 0.133, high_influence: false },
    { index: 29, value: 0.18, threshold: 0.133, high_influence: true },
  ],
  predictions: [
    { index: 0, x_values: { YearsExperience: 1.1 }, y_actual: 39343, y_predicted: 36187.4, residual: 3155.6 },
    { index: 1, x_values: { YearsExperience: 1.3 }, y_actual: 46205, y_predicted: 38077.4, residual: 8127.6 },
    { index: 2, x_values: { YearsExperience: 1.5 }, y_actual: 37731, y_predicted: 39967.4, residual: -2236.4 },
  ],
  created_at: "2025-01-01T00:05:00Z",
};

export function makePredictResponse(
  yearsExperience: number,
): PredictResponse {
  const prediction =
    trainResponseFixture.coefficients.intercept +
    trainResponseFixture.coefficients.slopes.YearsExperience * yearsExperience;
  const halfWidth = 1.96 * trainResponseFixture.metrics.se;
  return {
    model_id: MODEL_ID,
    prediction,
    prediction_interval: [prediction - halfWidth, prediction + halfWidth],
    confidence_level: 0.95,
    x_values: { YearsExperience: yearsExperience },
    interpretation: `For YearsExperience = ${yearsExperience}, the model predicts Salary ≈ ${prediction.toFixed(2)}.`,
  };
}
