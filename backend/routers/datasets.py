"""Dataset upload + read endpoints."""
from __future__ import annotations

from fastapi import APIRouter, File, UploadFile

from schemas.common import ErrorResponse
from schemas.dataset import DatasetUploadResponse
from services.data_service import parse_csv, profile_dataframe
from state import dataset_registry
from utils.errors import DatasetNotFoundError, InvalidDataError

router = APIRouter(prefix="/datasets", tags=["datasets"])

_ERROR_RESPONSES = {
    400: {"model": ErrorResponse},
    404: {"model": ErrorResponse},
    413: {"model": ErrorResponse},
    422: {"model": ErrorResponse},
}


@router.post(
    "/upload",
    response_model=DatasetUploadResponse,
    responses=_ERROR_RESPONSES,
)
async def upload_dataset(file: UploadFile = File(...)) -> DatasetUploadResponse:
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise InvalidDataError("File must have a .csv extension.", field="file")

    content = await file.read()
    df = parse_csv(content)
    profile = profile_dataframe(df, file.filename)

    dataset_id = dataset_registry.put(
        {"df": df, "profile": profile, "filename": file.filename}
    )
    created_at = dataset_registry.get_created_at(dataset_id)

    return DatasetUploadResponse(
        dataset_id=dataset_id,
        created_at=created_at,  # type: ignore[arg-type]
        **profile,
    )


@router.get(
    "/{dataset_id}",
    response_model=DatasetUploadResponse,
    responses=_ERROR_RESPONSES,
)
def get_dataset(dataset_id: str) -> DatasetUploadResponse:
    entry = dataset_registry.get(dataset_id)
    if entry is None:
        raise DatasetNotFoundError(f"Dataset '{dataset_id}' not found or expired.")
    created_at = dataset_registry.get_created_at(dataset_id)
    return DatasetUploadResponse(
        dataset_id=dataset_id,
        created_at=created_at,  # type: ignore[arg-type]
        **entry["profile"],
    )
