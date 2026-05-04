"""Model training, read, predict, and PDF export endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Response

from schemas.common import ErrorResponse
from schemas.model import (
    PredictRequest,
    PredictResponse,
    TrainRequest,
    TrainResponse,
)
from services.regression_service import predict_value, train_ols
from services.report_service import build_pdf
from state import dataset_registry, model_registry
from utils.errors import DatasetNotFoundError, ModelNotFoundError

router = APIRouter(prefix="/models", tags=["models"])

_ERROR_RESPONSES = {
    400: {"model": ErrorResponse},
    404: {"model": ErrorResponse},
    413: {"model": ErrorResponse},
    422: {"model": ErrorResponse},
}


def _train_response_from_entry(entry: dict, model_id: str) -> TrainResponse:
    created_at = model_registry.get_created_at(model_id)
    return TrainResponse(
        model_id=model_id,
        dataset_id=entry["dataset_id"],
        model_type=entry["model_type"],
        x_cols=entry["x_cols"],
        y_col=entry["y_col"],
        equation_str=entry["equation_str"],
        coefficients=entry["coefficients"],
        metrics=entry["metrics"],
        anova=entry["anova"],
        t_tests=entry["t_tests"],
        confidence_intervals=entry["confidence_intervals"],
        feature_importance=entry["feature_importance"],
        correlation_matrix=entry["correlation_matrix"],
        cooks_distance=entry["cooks_distance"],
        predictions=entry["predictions"],
        sample_means=entry["sample_means"],
        created_at=created_at,  # type: ignore[arg-type]
    )


@router.post("/train", response_model=TrainResponse, responses=_ERROR_RESPONSES)
def train_model(req: TrainRequest) -> TrainResponse:
    ds_entry = dataset_registry.get(req.dataset_id)
    if ds_entry is None:
        raise DatasetNotFoundError(
            f"Dataset '{req.dataset_id}' not found or expired."
        )

    result = train_ols(
        df=ds_entry["df"],
        x_cols=req.x_cols,
        y_col=req.y_col,
        model_type=req.model_type,
        confidence_level=req.confidence_level,
    )

    model_id = model_registry.put(
        {
            **result,
            "dataset_id": req.dataset_id,
            "dataset_filename": ds_entry.get("filename"),
        }
    )

    entry = model_registry.get(model_id)
    assert entry is not None
    response_obj = _train_response_from_entry(entry, model_id)
    print("DEBUG TrainResponse dict:", response_obj.model_dump().keys())
    return response_obj


@router.get(
    "/{model_id}", response_model=TrainResponse, responses=_ERROR_RESPONSES
)
def get_model(model_id: str) -> TrainResponse:
    entry = model_registry.get(model_id)
    if entry is None:
        raise ModelNotFoundError(f"Model '{model_id}' not found or expired.")
    return _train_response_from_entry(entry, model_id)


@router.post(
    "/{model_id}/predict",
    response_model=PredictResponse,
    responses=_ERROR_RESPONSES,
)
def predict(model_id: str, req: PredictRequest) -> PredictResponse:
    entry = model_registry.get(model_id)
    if entry is None:
        raise ModelNotFoundError(f"Model '{model_id}' not found or expired.")

    result = predict_value(entry, req.x_values)
    return PredictResponse(model_id=model_id, **result)


@router.get("/{model_id}/report.pdf", responses=_ERROR_RESPONSES)
def export_pdf(model_id: str) -> Response:
    entry = model_registry.get(model_id)
    if entry is None:
        raise ModelNotFoundError(f"Model '{model_id}' not found or expired.")

    payload = {
        "model_id": model_id,
        "dataset_id": entry["dataset_id"],
        "model_type": entry["model_type"],
        "x_cols": entry["x_cols"],
        "y_col": entry["y_col"],
        "equation_str": entry["equation_str"],
        "metrics": entry["metrics"],
        "anova": entry["anova"],
        "t_tests": entry["t_tests"],
        "confidence_intervals": entry["confidence_intervals"],
        "feature_importance": entry["feature_importance"],
    }
    pdf_bytes = build_pdf(
        payload, dataset_filename=entry.get("dataset_filename")
    )
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="regression_report_{model_id}.pdf"'
        },
    )
