"""Environment-driven settings using pydantic-settings."""
from __future__ import annotations

from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_ENV: Literal["development", "production"] = "development"
    API_V1_PREFIX: str = "/api/v1"
    CORS_ORIGINS: str = (
        "http://localhost:3000,http://localhost:5173,http://localhost:8080"
    )
    MAX_UPLOAD_MB: int = 25
    MAX_ROWS: int = 200_000
    REGISTRY_TTL_MINUTES: int = 120
    LOG_LEVEL: str = "INFO"
    VERSION: str = "1.0.0"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
