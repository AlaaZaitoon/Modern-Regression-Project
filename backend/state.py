"""Thread-safe in-memory registries with TTL eviction."""
from __future__ import annotations

import threading
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Generic, Optional, TypeVar

from config import settings

T = TypeVar("T")


def _utcnow() -> datetime:
    """Return a timezone-aware current UTC timestamp."""
    return datetime.now(timezone.utc)


@dataclass
class _Entry(Generic[T]):
    value: T
    created_at: datetime


class Registry(Generic[T]):
    """A thread-safe in-memory key/value store with lazy TTL eviction."""

    def __init__(self, ttl_minutes: int) -> None:
        self._data: dict[str, _Entry[T]] = {}
        self._lock = threading.Lock()
        self._ttl = timedelta(minutes=ttl_minutes)

    def _is_expired(self, entry: _Entry[T]) -> bool:
        return _utcnow() - entry.created_at > self._ttl

    def put(self, value: T, entry_id: Optional[str] = None) -> str:
        entry_id = entry_id or uuid.uuid4().hex
        with self._lock:
            self._data[entry_id] = _Entry(value=value, created_at=_utcnow())
        return entry_id

    def get(self, entry_id: str) -> Optional[T]:
        with self._lock:
            entry = self._data.get(entry_id)
            if entry is None:
                return None
            if self._is_expired(entry):
                del self._data[entry_id]
                return None
            return entry.value

    def get_created_at(self, entry_id: str) -> Optional[datetime]:
        with self._lock:
            entry = self._data.get(entry_id)
            if entry is None or self._is_expired(entry):
                return None
            return entry.created_at

    def delete(self, entry_id: str) -> bool:
        with self._lock:
            return self._data.pop(entry_id, None) is not None

    def cleanup(self) -> int:
        count = 0
        with self._lock:
            expired = [k for k, e in self._data.items() if self._is_expired(e)]
            for k in expired:
                del self._data[k]
                count += 1
        return count


# Module-level singletons used by routes.
dataset_registry: Registry[dict[str, Any]] = Registry(
    ttl_minutes=settings.REGISTRY_TTL_MINUTES
)
model_registry: Registry[dict[str, Any]] = Registry(
    ttl_minutes=settings.REGISTRY_TTL_MINUTES
)
