"""Domain-specific exceptions with HTTP status + machine-readable codes."""
from __future__ import annotations

from typing import Optional


class DomainError(Exception):
    """Base class for handled backend errors."""

    status_code: int = 400
    code: str = "domain_error"

    def __init__(self, detail: str, field: Optional[str] = None) -> None:
        self.detail = detail
        self.field = field
        super().__init__(detail)


class DatasetNotFoundError(DomainError):
    status_code = 404
    code = "dataset_not_found"


class ModelNotFoundError(DomainError):
    status_code = 404
    code = "model_not_found"


class SingularMatrixError(DomainError):
    status_code = 400
    code = "singular_matrix"


class InvalidDataError(DomainError):
    status_code = 400
    code = "invalid_data"


class CategoricalXUnsupportedError(DomainError):
    status_code = 400
    code = "categorical_x_unsupported"


class FileTooLargeError(DomainError):
    status_code = 413
    code = "file_too_large"
