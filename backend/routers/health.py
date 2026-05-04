"""Health check endpoint."""
from __future__ import annotations

import time

from fastapi import APIRouter

from config import settings
from schemas.common import HealthResponse

router = APIRouter(tags=["health"])

_START_TIME = time.time()


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        version=settings.VERSION,
        uptime_seconds=int(time.time() - _START_TIME),
    )
