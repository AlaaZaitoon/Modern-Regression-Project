"""Convert numpy / NaN / Infinity into JSON-safe Python primitives."""
from __future__ import annotations

import math
from typing import Any

import numpy as np


def to_json_safe(obj: Any) -> Any:
    """Recursively convert numpy scalars/arrays and NaN/Inf to JSON-safe values.

    - numpy integer/float/bool -> native Python int/float/bool
    - NaN, +inf, -inf -> None
    - numpy.ndarray -> list
    - dict / list / tuple -> recursed
    """
    if obj is None:
        return None
    if isinstance(obj, bool):
        return obj
    if isinstance(obj, (int, str)):
        return obj
    if isinstance(obj, float):
        return None if (math.isnan(obj) or math.isinf(obj)) else obj
    if isinstance(obj, np.bool_):
        return bool(obj)
    if isinstance(obj, np.integer):
        return int(obj)
    if isinstance(obj, np.floating):
        v = float(obj)
        return None if (math.isnan(v) or math.isinf(v)) else v
    if isinstance(obj, np.ndarray):
        return [to_json_safe(x) for x in obj.tolist()]
    if isinstance(obj, dict):
        return {str(k): to_json_safe(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [to_json_safe(x) for x in obj]
    return obj


def safe_float(value: Any, default: float = 0.0) -> float:
    """Coerce a value to a finite float; fall back to default for NaN/Inf/None."""
    if value is None:
        return default
    try:
        v = float(value)
    except (TypeError, ValueError):
        return default
    if math.isnan(v) or math.isinf(v):
        return default
    return v
