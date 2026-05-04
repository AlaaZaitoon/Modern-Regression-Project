"""Core regression training + full statistical reporting.

Uses statsmodels OLS (matrix API, not formula API) so column names with
spaces or special characters are handled cleanly.
"""
from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
import statsmodels.api as sm
from scipy import stats as sp_stats

from schemas.dataset import CorrelationMatrix
from schemas.model import (
    AnovaTable,
    Coefficients,
    ConfidenceInterval,
    CookDistance,
    FeatureImportance,
    Metrics,
    ModelType,
    PredictionRow,
    TTest,
)
from utils.errors import (
    CategoricalXUnsupportedError,
    InvalidDataError,
    SingularMatrixError,
)
from utils.json_safe import safe_float


# ---------------------------------------------------------------------------
# TRAIN
# ---------------------------------------------------------------------------

def train_ols(
    df: pd.DataFrame,
    x_cols: list[str],
    y_col: str,
    model_type: ModelType,
    confidence_level: float = 0.95,
) -> dict[str, Any]:
    """Fit OLS and return a dict that maps directly onto TrainResponse fields."""
    _validate_columns(df, x_cols, y_col, model_type)
    sub = df[x_cols + [y_col]].dropna().reset_index(drop=True)

    n = len(sub)
    p = len(x_cols)
    if n < p + 2:
        raise InvalidDataError(
            f"After dropping NaN, only {n} rows remain; need at least {p + 2}."
        )

    X_df = sub[x_cols].astype(float)
    y = sub[y_col].astype(float).to_numpy()
    X = sm.add_constant(X_df.to_numpy(), has_constant="add")

    try:
        model = sm.OLS(y, X).fit()
    except np.linalg.LinAlgError as exc:
        raise SingularMatrixError(
            f"Singular matrix (perfect multicollinearity): {exc}"
        ) from exc

    if np.any(np.isnan(np.asarray(model.params))):
        raise SingularMatrixError(
            "Singular matrix: coefficients contain NaN (likely perfect multicollinearity)."
        )

    alpha = 1.0 - confidence_level

    intercept = float(model.params[0])
    slopes = {col: float(model.params[i + 1]) for i, col in enumerate(x_cols)}

    y_pred = np.asarray(model.fittedvalues, dtype=float)
    residuals = y - y_pred

    metrics = _build_metrics(y, y_pred, residuals, model, n, p)
    anova = _build_anova(y, residuals, model, n, p, alpha)
    t_tests, cis = _build_ttests_and_cis(model, x_cols, alpha, confidence_level)
    feature_importance = _build_feature_importance(sub, x_cols, y, slopes, n)
    correlation_matrix = _build_correlation_matrix(sub, x_cols, y_col)
    cooks = _build_cooks_distance(model, n)
    predictions = _build_predictions(sub, x_cols, y, y_pred)
    equation_str = _format_equation(y_col, intercept, slopes, x_cols)

    return {
        "model": model,  # statsmodels results, retained for /predict
        "x_cols": list(x_cols),
        "y_col": y_col,
        "model_type": model_type,
        "confidence_level": confidence_level,
        "equation_str": equation_str,
        "coefficients": Coefficients(intercept=intercept, slopes=slopes),
        "metrics": metrics,
        "anova": anova,
        "t_tests": t_tests,
        "confidence_intervals": cis,
        "feature_importance": feature_importance,
        "correlation_matrix": correlation_matrix,
        "cooks_distance": cooks,
        "predictions": predictions,
    }


# ---------------------------------------------------------------------------
# PREDICT
# ---------------------------------------------------------------------------

def predict_value(
    model_entry: dict[str, Any],
    x_values: dict[str, float],
) -> dict[str, Any]:
    """Predict a single observation using the cached statsmodels results."""
    x_cols: list[str] = model_entry["x_cols"]
    missing = [c for c in x_cols if c not in x_values]
    if missing:
        raise InvalidDataError(
            f"Missing x_values for columns: {missing}", field="x_values"
        )

    model = model_entry["model"]
    confidence_level: float = model_entry["confidence_level"]
    alpha = 1.0 - confidence_level

    x_row = np.array([1.0] + [float(x_values[c]) for c in x_cols]).reshape(1, -1)
    pred_obj = model.get_prediction(x_row)
    frame = pred_obj.summary_frame(alpha=alpha)

    mean_pred = safe_float(frame["mean"].iloc[0], 0.0)
    pi_lower = safe_float(frame["obs_ci_lower"].iloc[0], mean_pred)
    pi_upper = safe_float(frame["obs_ci_upper"].iloc[0], mean_pred)

    level_pct = int(round(confidence_level * 100))
    interpretation = (
        f"Predicted {model_entry['y_col']} ~ {mean_pred:.4g} "
        f"with a {level_pct}% prediction interval of "
        f"[{pi_lower:.4g}, {pi_upper:.4g}]."
    )

    return {
        "prediction": mean_pred,
        "prediction_interval": (pi_lower, pi_upper),
        "confidence_level": confidence_level,
        "x_values": {c: float(x_values[c]) for c in x_cols},
        "interpretation": interpretation,
    }


# ---------------------------------------------------------------------------
# HELPERS
# ---------------------------------------------------------------------------

def _validate_columns(
    df: pd.DataFrame,
    x_cols: list[str],
    y_col: str,
    model_type: ModelType,
) -> None:
    missing = [c for c in [*x_cols, y_col] if c not in df.columns]
    if missing:
        raise InvalidDataError(f"Columns not found in dataset: {missing}")
    if y_col in x_cols:
        raise InvalidDataError("y_col cannot appear in x_cols.", field="y_col")
    if model_type == ModelType.simple and len(x_cols) != 1:
        raise InvalidDataError(
            "Simple regression requires exactly 1 x_col.", field="x_cols"
        )
    if model_type == ModelType.multiple and len(x_cols) < 2:
        raise InvalidDataError(
            "Multiple regression requires >= 2 x_cols.", field="x_cols"
        )
    for c in [*x_cols, y_col]:
        if not pd.api.types.is_numeric_dtype(df[c]):
            raise CategoricalXUnsupportedError(
                f"Column '{c}' is non-numeric. Categorical variables are not supported in v1.",
                field=c,
            )


def _build_metrics(
    y: np.ndarray,
    y_pred: np.ndarray,
    residuals: np.ndarray,
    model: Any,
    n: int,
    p: int,
) -> Metrics:
    ss_res = float(np.sum(residuals ** 2))
    df_res = n - p - 1
    mse = ss_res / df_res if df_res > 0 else 0.0
    return Metrics(
        r2=safe_float(model.rsquared, 0.0),
        adj_r2=safe_float(model.rsquared_adj, 0.0),
        mse=safe_float(mse, 0.0),
        rmse=safe_float(np.sqrt(max(mse, 0.0)), 0.0),
        mae=safe_float(np.mean(np.abs(residuals)), 0.0),
        se=safe_float(np.sqrt(max(getattr(model, "mse_resid", mse), 0.0)), 0.0),
    )


def _build_anova(
    y: np.ndarray,
    residuals: np.ndarray,
    model: Any,
    n: int,
    p: int,
    alpha: float,
) -> AnovaTable:
    ss_res = float(np.sum(residuals ** 2))
    ss_tot = float(np.sum((y - y.mean()) ** 2))
    ss_reg = max(ss_tot - ss_res, 0.0)
    df_reg = p
    df_res = n - p - 1
    df_tot = n - 1
    msr = ss_reg / df_reg if df_reg > 0 else 0.0
    mse_anova = ss_res / df_res if df_res > 0 else 0.0
    f_stat = safe_float(model.fvalue, msr / mse_anova if mse_anova > 0 else 0.0)
    p_value = safe_float(model.f_pvalue, 1.0)
    f_critical = (
        safe_float(sp_stats.f.ppf(1 - alpha, df_reg, df_res), 0.0)
        if df_res > 0 and df_reg > 0
        else 0.0
    )
    decision = "reject_h0" if p_value < alpha else "fail_to_reject_h0"
    return AnovaTable(
        SSR=safe_float(ss_reg, 0.0),
        SSE=safe_float(ss_res, 0.0),
        SST=safe_float(ss_tot, 0.0),
        df_reg=df_reg,
        df_res=df_res,
        df_tot=df_tot,
        MSR=safe_float(msr, 0.0),
        MSE=safe_float(mse_anova, 0.0),
        F_stat=f_stat,
        F_critical=f_critical,
        p_value=p_value,
        decision=decision,
    )


def _build_ttests_and_cis(
    model: Any,
    x_cols: list[str],
    alpha: float,
    confidence_level: float,
) -> tuple[list[TTest], list[ConfidenceInterval]]:
    variables = ["intercept", *x_cols]
    params = np.asarray(model.params)
    bse = np.asarray(model.bse)
    tvals = np.asarray(model.tvalues)
    pvals = np.asarray(model.pvalues)
    conf_int = np.asarray(model.conf_int(alpha=alpha))

    t_tests: list[TTest] = []
    cis: list[ConfidenceInterval] = []
    for i, var in enumerate(variables):
        coef = safe_float(params[i], 0.0)
        se_i = safe_float(bse[i], 0.0)
        t_i = safe_float(tvals[i], 0.0)
        p_i = safe_float(pvals[i], 1.0)
        t_tests.append(
            TTest(
                variable=var,
                coefficient=coef,
                std_error=se_i,
                t_stat=t_i,
                p_value=p_i,
                significant=p_i < alpha,
            )
        )
        cis.append(
            ConfidenceInterval(
                variable=var,
                lower=safe_float(conf_int[i][0], coef),
                upper=safe_float(conf_int[i][1], coef),
                level=confidence_level,
            )
        )
    return t_tests, cis


def _build_feature_importance(
    sub: pd.DataFrame,
    x_cols: list[str],
    y: np.ndarray,
    slopes: dict[str, float],
    n: int,
) -> list[FeatureImportance]:
    y_std = float(np.std(y, ddof=1)) if n > 1 else 1.0
    raw: list[tuple[str, float, str]] = []
    for col in x_cols:
        x_std = float(np.std(sub[col].to_numpy(dtype=float), ddof=1)) if n > 1 else 1.0
        beta = slopes[col]
        std_coef = abs(beta * x_std / y_std) if y_std > 0 else 0.0
        direction = "positive" if beta >= 0 else "negative"
        raw.append((col, safe_float(std_coef, 0.0), direction))

    max_imp = max((v for _, v, _ in raw), default=0.0)
    items = [
        FeatureImportance(
            variable=col,
            standardized_coef=std_coef,
            importance=(std_coef / max_imp) if max_imp > 0 else 0.0,
            direction=direction,  # type: ignore[arg-type]
        )
        for col, std_coef, direction in raw
    ]
    items.sort(key=lambda f: f.importance, reverse=True)
    return items


def _build_correlation_matrix(
    sub: pd.DataFrame, x_cols: list[str], y_col: str
) -> CorrelationMatrix:
    cols = [*x_cols, y_col]
    corr = sub[cols].corr(method="pearson").fillna(0.0)
    matrix = [[safe_float(v, 0.0) for v in row] for row in corr.values.tolist()]
    return CorrelationMatrix(columns=cols, matrix=matrix)


def _build_cooks_distance(model: Any, n: int) -> list[CookDistance]:
    influence = model.get_influence()
    cooks_values, _ = influence.cooks_distance
    threshold = 4.0 / n if n > 0 else 0.0
    out: list[CookDistance] = []
    for i, v in enumerate(np.asarray(cooks_values)):
        vf = safe_float(v, 0.0)
        out.append(
            CookDistance(
                index=int(i),
                value=vf,
                threshold=threshold,
                high_influence=bool(vf > threshold),
            )
        )
    return out


def _build_predictions(
    sub: pd.DataFrame,
    x_cols: list[str],
    y: np.ndarray,
    y_pred: np.ndarray,
) -> list[PredictionRow]:
    out: list[PredictionRow] = []
    for i in range(len(sub)):
        x_map = {col: float(sub.iloc[i][col]) for col in x_cols}
        ya = safe_float(y[i], 0.0)
        yp = safe_float(y_pred[i], 0.0)
        out.append(
            PredictionRow(
                index=int(i),
                x_values=x_map,
                y_actual=ya,
                y_predicted=yp,
                residual=ya - yp,
            )
        )
    return out


def _format_equation(
    y_col: str, intercept: float, slopes: dict[str, float], x_cols: list[str]
) -> str:
    parts = [f"{intercept:.4f}"]
    for col in x_cols:
        b = slopes[col]
        sign = " + " if b >= 0 else " - "
        parts.append(f"{sign}{abs(b):.4f} * {col}")
    return f"{y_col} = " + "".join(parts)
