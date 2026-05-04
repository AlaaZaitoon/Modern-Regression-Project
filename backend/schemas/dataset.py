"""Dataset schemas for the /datasets/* endpoints."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class ColumnStats(BaseModel):
    mean: Optional[float] = None
    median: Optional[float] = None
    std: Optional[float] = None
    min: Optional[float] = None
    max: Optional[float] = None
    missing: int = 0
    unique: int = 0


class CorrelationMatrix(BaseModel):
    columns: list[str]
    matrix: list[list[float]]  # Pearson, symmetric; NaN -> 0.0


class DatasetUploadResponse(BaseModel):
    dataset_id: str
    filename: str
    columns: list[str]
    numeric_columns: list[str]
    categorical_columns: list[str]
    dtypes: dict[str, str]
    shape: tuple[int, int] = Field(..., description="(rows, cols)")
    missing: dict[str, int]
    preview: list[dict[str, Any]] = Field(
        ..., description="First 10 rows as JSON-safe records."
    )
    stats: dict[str, ColumnStats]
    correlation_matrix: CorrelationMatrix
    created_at: datetime
