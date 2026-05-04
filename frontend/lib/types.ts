/**
 * TypeScript mirror of the FastAPI backend Pydantic schemas.
 *
 * Source of truth: backend/schemas/*.py. Every field name, optionality,
 * and enum value here MUST match the backend exactly. If the backend
 * changes within /api/v1 this file must be updated in lock-step.
 */

// ---------- Common ----------

export interface ErrorResponse {
  detail: string;
  code: string;
  field?: string | null;
}

export interface HealthResponse {
  status: "ok";
  version: string;
  uptime_seconds: number;
}

// ---------- Dataset ----------

export interface ColumnStats {
  mean: number | null;
  median: number | null;
  std: number | null;
  min: number | null;
  max: number | null;
  missing: number;
  unique: number;
}

export interface CorrelationMatrix {
  columns: string[];
  /** Symmetric Pearson matrix; NaN already replaced with 0 by the backend. */
  matrix: number[][];
}

export interface DatasetUploadResponse {
  dataset_id: string;
  filename: string;
  columns: string[];
  numeric_columns: string[];
  categorical_columns: string[];
  dtypes: Record<string, string>;
  /** [rows, cols] */
  shape: [number, number];
  missing: Record<string, number>;
  /** First 10 rows as JSON-safe records. */
  preview: Array<Record<string, unknown>>;
  stats: Record<string, ColumnStats>;
  correlation_matrix: CorrelationMatrix;
  /** ISO 8601 timestamp. */
  created_at: string;
}

// ---------- Model ----------

export type ModelType = "simple" | "multiple";

export interface TrainRequest {
  dataset_id: string;
  x_cols: string[];
  y_col: string;
  model_type: ModelType;
  confidence_level?: number;
}

export interface Coefficients {
  intercept: number;
  slopes: Record<string, number>;
}

export interface Metrics {
  r2: number;
  adj_r2: number;
  mse: number;
  rmse: number;
  mae: number;
  /** Standard error of the estimate. */
  se: number;
}

export type AnovaDecision = "reject_h0" | "fail_to_reject_h0";

export interface AnovaTable {
  SSR: number;
  SSE: number;
  SST: number;
  df_reg: number;
  df_res: number;
  df_tot: number;
  MSR: number;
  MSE: number;
  F_stat: number;
  F_critical: number;
  p_value: number;
  decision: AnovaDecision;
}

export interface TTest {
  /** "intercept" or an x_col name. */
  variable: string;
  coefficient: number;
  std_error: number;
  t_stat: number;
  p_value: number;
  significant: boolean;
}

export interface ConfidenceInterval {
  variable: string;
  lower: number;
  upper: number;
  level: number;
}

export interface FeatureImportance {
  variable: string;
  standardized_coef: number;
  /** Normalized to [0, 1]. */
  importance: number;
  direction: "positive" | "negative";
}

export interface CookDistance {
  index: number;
  value: number;
  threshold: number;
  high_influence: boolean;
}

export interface PredictionRow {
  index: number;
  x_values: Record<string, number>;
  y_actual: number;
  y_predicted: number;
  residual: number;
}

export interface TrainResponse {
  model_id: string;
  dataset_id: string;
  model_type: ModelType;
  x_cols: string[];
  y_col: string;
  equation_str: string;
  coefficients: Coefficients;
  metrics: Metrics;
  anova: AnovaTable;
  t_tests: TTest[];
  confidence_intervals: ConfidenceInterval[];
  feature_importance: FeatureImportance[];
  correlation_matrix: CorrelationMatrix;
  cooks_distance: CookDistance[];
  predictions: PredictionRow[];
  /** Sample means: { x_col: x̄, y_col: ȳ }. */
  sample_means: Record<string, number>;
  created_at: string;
}

export interface PredictRequest {
  x_values: Record<string, number>;
}

export interface PredictResponse {
  model_id: string;
  prediction: number;
  /** [lower, upper] prediction interval. */
  prediction_interval: [number, number];
  confidence_level: number;
  x_values: Record<string, number>;
  interpretation: string;
}
