"""Pytest configuration: ensure backend/ is importable, expose shared fixtures."""
from __future__ import annotations

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from main import app  # noqa: E402
from state import dataset_registry, model_registry  # noqa: E402


@pytest.fixture(autouse=True)
def _clear_registries():
    """Reset in-memory registries between tests."""
    with dataset_registry._lock:  # type: ignore[attr-defined]
        dataset_registry._data.clear()  # type: ignore[attr-defined]
    with model_registry._lock:  # type: ignore[attr-defined]
        model_registry._data.clear()  # type: ignore[attr-defined]
    yield


@pytest.fixture()
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture()
def simple_csv() -> bytes:
    """Deterministic linear dataset:  y ~= 3*x + 1  +  small noise."""
    rows = ["x,y"]
    for x in range(1, 21):
        rows.append(f"{x},{3 * x + 1 + (0.1 if x % 2 else -0.1)}")
    return ("\n".join(rows) + "\n").encode("utf-8")


@pytest.fixture()
def multi_csv() -> bytes:
    """Two-feature dataset: y = 2*x1 - x2 + 5 + small noise."""
    rows = ["x1,x2,y"]
    import random

    random.seed(42)
    for _ in range(40):
        x1 = random.uniform(0, 10)
        x2 = random.uniform(0, 10)
        y = 2 * x1 - x2 + 5 + random.uniform(-0.05, 0.05)
        rows.append(f"{x1:.4f},{x2:.4f},{y:.4f}")
    return ("\n".join(rows) + "\n").encode("utf-8")


@pytest.fixture()
def upload_dataset(client: TestClient, simple_csv: bytes):
    def _upload(content: bytes = simple_csv, filename: str = "data.csv") -> str:
        resp = client.post(
            "/api/v1/datasets/upload",
            files={"file": (filename, content, "text/csv")},
        )
        assert resp.status_code == 200, resp.text
        return resp.json()["dataset_id"]

    return _upload


@pytest.fixture()
def train_simple(client: TestClient, upload_dataset):
    def _train() -> dict:
        dataset_id = upload_dataset()
        resp = client.post(
            "/api/v1/models/train",
            json={
                "dataset_id": dataset_id,
                "x_cols": ["x"],
                "y_col": "y",
                "model_type": "simple",
            },
        )
        assert resp.status_code == 200, resp.text
        return resp.json()

    return _train
