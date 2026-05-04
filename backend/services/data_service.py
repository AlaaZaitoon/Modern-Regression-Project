"""CSV parsing, validation, and dataset profiling."""
from __future__ import annotations

import io
from typing import Any

import numpy as np
import pandas as pd

from config import settings
from schemas.dataset import ColumnStats, CorrelationMatrix
from utils.errors import FileTooLargeError, InvalidDataError
from utils.json_safe import safe_float, to_json_safe

_PREVIEW_ROWS = 10


def parse_csv(file_bytes: bytes) -> pd.DataFrame:
    """Parse and validate an uploaded CSV payload."""
    size_mb = len(file_bytes) / (1024 * 1024)
    if size_mb > settings.MAX_UPLOAD_MB:
        raise FileTooLargeError(
            f"File size {size_mb:.2f} MB exceeds the {settings.MAX_UPLOAD_MB} MB limit."
        )
    if not file_bytes:
        raise InvalidDataError("Uploaded file is empty.")

    try:
        df = pd.read_csv(io.BytesIO(file_bytes), encoding="utf-8")
    except UnicodeDecodeError as exc:
        raise InvalidDataError(
            "CSV must be UTF-8 encoded."
        ) from exc
    except pd.errors.EmptyDataError as exc:
        raise InvalidDataError("CSV has no parseable content.") from exc
    except pd.errors.ParserError as exc:
        raise InvalidDataError(f"Malformed CSV: {exc}") from exc
    except Exception as exc:  # pragma: no cover - unexpected parse error
        raise InvalidDataError(f"Failed to parse CSV: {exc}") from exc

    if df.empty:
        raise InvalidDataError("CSV has no data rows.")
    if len(df) > settings.MAX_ROWS:
        raise InvalidDataError(
            f"CSV has {len(df)} rows; max allowed is {settings.MAX_ROWS}."
        )

    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    if not numeric_cols:
        raise InvalidDataError("CSV contains no numeric columns.")

    # Normalize column names: strip whitespace, preserve order.
    df.columns = [str(c).strip() for c in df.columns]
    return df


def _column_stats(series: pd.Series) -> ColumnStats:
    clean = series.dropna()
    is_numeric = pd.api.types.is_numeric_dtype(series)
    if is_numeric and len(clean):
        return ColumnStats(
            mean=safe_float(clean.mean(), 0.0),
            median=safe_float(clean.median(), 0.0),
            std=safe_float(clean.std(), 0.0) if len(clean) > 1 else 0.0,
            min=safe_float(clean.min(), 0.0),
            max=safe_float(clean.max(), 0.0),
            missing=int(series.isna().sum()),
            unique=int(clean.nunique()),
        )
    return ColumnStats(
        missing=int(series.isna().sum()),
        unique=int(clean.nunique()),
    )


def _correlation_matrix(df: pd.DataFrame, numeric_cols: list[str]) -> CorrelationMatrix:
    if not numeric_cols:
        return CorrelationMatrix(columns=[], matrix=[])
    if len(numeric_cols) == 1:
        return CorrelationMatrix(columns=numeric_cols, matrix=[[1.0]])
    corr = df[numeric_cols].corr(method="pearson").fillna(0.0)
    matrix = [[safe_float(v, 0.0) for v in row] for row in corr.values.tolist()]
    return CorrelationMatrix(columns=numeric_cols, matrix=matrix)


def profile_dataframe(df: pd.DataFrame, filename: str) -> dict[str, Any]:
    """Build the non-identifying part of DatasetUploadResponse."""
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = [c for c in df.columns if c not in numeric_cols]

    stats: dict[str, ColumnStats] = {c: _column_stats(df[c]) for c in df.columns}

    preview_df = df.head(_PREVIEW_ROWS).replace({np.nan: None})
    preview = [to_json_safe(row) for row in preview_df.to_dict(orient="records")]

    missing = {c: int(df[c].isna().sum()) for c in df.columns}
    dtypes = {c: str(df[c].dtype) for c in df.columns}

    return {
        "filename": filename,
        "columns": df.columns.tolist(),
        "numeric_columns": numeric_cols,
        "categorical_columns": categorical_cols,
        "dtypes": dtypes,
        "shape": (int(df.shape[0]), int(df.shape[1])),
        "missing": missing,
        "preview": preview,
        "stats": stats,
        "correlation_matrix": _correlation_matrix(df, numeric_cols),
    }
