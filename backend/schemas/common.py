"""Shared schemas used across all routes."""
from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    """Standard error envelope returned for every non-2xx response."""

    detail: str = Field(..., description="Human-readable error message.")
    code: str = Field(..., description="Machine-readable error code.")
    field: Optional[str] = Field(
        None, description="Name of the offending field, when applicable."
    )


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"
    version: str
    uptime_seconds: int
