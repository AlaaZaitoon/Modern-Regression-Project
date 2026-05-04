"""FastAPI application factory: CORS, middleware, exception handlers, routers."""
from __future__ import annotations

import logging
import time
from contextlib import asynccontextmanager
from logging.config import dictConfig

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from routers import datasets, health, models
from schemas.common import ErrorResponse
from utils.errors import DomainError


def _configure_logging() -> None:
    dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "default": {
                    "format": "%(asctime)s %(levelname)s %(name)s - %(message)s"
                }
            },
            "handlers": {
                "console": {
                    "class": "logging.StreamHandler",
                    "formatter": "default",
                }
            },
            "root": {"level": settings.LOG_LEVEL, "handlers": ["console"]},
        }
    )


logger = logging.getLogger("srs.backend")


@asynccontextmanager
async def _lifespan(app: FastAPI):
    _configure_logging()
    logger.info(
        "Starting Smart Regression System backend (env=%s, version=%s)",
        settings.APP_ENV,
        settings.VERSION,
    )
    yield
    logger.info("Shutting down Smart Regression System backend.")


app = FastAPI(
    title="Smart Regression System API",
    version=settings.VERSION,
    description=(
        "Production-grade regression analytics API. "
        "Contract is stable within /api/v1; breaking changes require /api/v2."
    ),
    lifespan=_lifespan,
)

# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def _request_log_middleware(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000
    logger.info(
        "%s %s -> %s (%.1f ms)",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


@app.middleware("http")
async def _size_limit_middleware(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length:
        try:
            if int(content_length) > settings.MAX_UPLOAD_MB * 1024 * 1024:
                return JSONResponse(
                    status_code=413,
                    content=ErrorResponse(
                        detail=f"Request body exceeds {settings.MAX_UPLOAD_MB} MB limit.",
                        code="file_too_large",
                    ).model_dump(),
                )
        except ValueError:
            pass
    return await call_next(request)


# ---------------------------------------------------------------------------
# Exception handlers
# ---------------------------------------------------------------------------

@app.exception_handler(DomainError)
async def _domain_error_handler(request: Request, exc: DomainError) -> JSONResponse:
    logger.warning(
        "DomainError on %s: %s (code=%s, field=%s)",
        request.url.path,
        exc.detail,
        exc.code,
        exc.field,
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            detail=exc.detail, code=exc.code, field=exc.field
        ).model_dump(),
    )


@app.exception_handler(RequestValidationError)
async def _validation_error_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    errors = exc.errors()
    first = errors[0] if errors else {}
    field = ".".join(str(x) for x in first.get("loc", [])) if first else None
    detail = first.get("msg", "Validation error") if first else "Validation error"
    return JSONResponse(
        status_code=422,
        content=ErrorResponse(
            detail=detail, code="validation_error", field=field
        ).model_dump(),
    )


@app.exception_handler(Exception)
async def _unhandled_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    logger.exception("Unhandled exception on %s", request.url.path)
    detail = (
        "Internal server error."
        if settings.APP_ENV == "production"
        else f"{type(exc).__name__}: {exc}"
    )
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(detail=detail, code="internal_error").model_dump(),
    )


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(health.router, prefix=settings.API_V1_PREFIX)
app.include_router(datasets.router, prefix=settings.API_V1_PREFIX)
app.include_router(models.router, prefix=settings.API_V1_PREFIX)
