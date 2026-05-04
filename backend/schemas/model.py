"""Model schemas for the /models/* endpoints."""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from schemas.dataset import CorrelationMatrix

# Pydantic reserves the "model_" namespace; our domain uses `model_type`,
# `model_id`, etc. Disable the namespace check at the module level.
_MODEL_CONFIG = ConfigDict(protected_namespaces=())


class ModelType(str, Enum):
    simple = "simple"
    multiple = "multiple"


# ---------- Train ----------

class TrainRequest(BaseModel):
    model_config = _MODEL_CONFIG

    dataset_id: str
    x_cols: list[str] = Field(..., min_length=1)
    y_col: str
    model_type: ModelType
    confidence_level: float = Field(default=0.95, ge=0.5, lt=1.0)


class Coefficients(BaseModel):
    intercept: float
    slopes: dict[str, float]


class Metrics(BaseModel):
    r2: float
    adj_r2: float
    mse: float
    rmse: float
    mae: float
    se: float  # standard error of estimate


class AnovaTable(BaseModel):
    SSR: float
    SSE: float
    SST: float
    df_reg: int
    df_res: int
    df_tot: int
    MSR: float
    MSE: float
    F_stat: float
    F_critical: float
    p_value: float
    decision: Literal["reject_h0", "fail_to_reject_h0"]


class TTest(BaseModel):
    variable: str  # "intercept" or x_col name
    coefficient: float
    std_error: float
    t_stat: float
    p_value: float
    significant: bool


class ConfidenceInterval(BaseModel):
    variable: str
    lower: float
    upper: float
    level: float


class FeatureImportance(BaseModel):
    variable: str
    standardized_coef: float
    importance: float  # normalized to [0, 1]
    direction: Literal["positive", "negative"]


class CookDistance(BaseModel):
    index: int
    value: float
    threshold: float  # 4 / n convention
    high_influence: bool


class PredictionRow(BaseModel):
    index: int
    x_values: dict[str, float]
    y_actual: float
    y_predicted: float
    residual: float


class TrainResponse(BaseModel):
    model_config = _MODEL_CONFIG

    model_id: str
    dataset_id: str
    model_type: ModelType
    x_cols: list[str]
    y_col: str
    equation_str: str
    coefficients: Coefficients
    metrics: Metrics
    anova: AnovaTable
    t_tests: list[TTest]
    confidence_intervals: list[ConfidenceInterval]
    feature_importance: list[FeatureImportance]
    correlation_matrix: CorrelationMatrix
    cooks_distance: list[CookDistance]
    predictions: list[PredictionRow]
    created_at: datetime


# ---------- Predict ----------

class PredictRequest(BaseModel):
    x_values: dict[str, float]


class PredictResponse(BaseModel):
    model_config = _MODEL_CONFIG

    model_id: str
    prediction: float
    prediction_interval: tuple[float, float]
    confidence_level: float
    x_values: dict[str, float]
    interpretation: str
