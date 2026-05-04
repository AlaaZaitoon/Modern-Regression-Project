import numpy as np
from sklearn.linear_model import LinearRegression


def test_train_simple_returns_full_contract(client, upload_dataset):
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
    body = resp.json()

    assert body["model_id"]
    assert body["x_cols"] == ["x"]
    assert body["y_col"] == "y"
    assert body["model_type"] == "simple"
    assert body["equation_str"].startswith("y = ")

    # No empty arrays allowed.
    assert body["t_tests"] and body["confidence_intervals"]
    assert body["feature_importance"]
    assert body["predictions"] and len(body["predictions"]) == 20
    assert body["cooks_distance"]
    assert body["correlation_matrix"]["columns"] == ["x", "y"]

    # Metrics sanity.
    assert 0.99 < body["metrics"]["r2"] <= 1.0
    assert body["coefficients"]["intercept"] == body["t_tests"][0]["coefficient"]

    # predictions include original x_values, y_actual, y_predicted, residual.
    row = body["predictions"][0]
    assert "x_values" in row and "x" in row["x_values"]
    assert abs(row["y_actual"] - (row["y_predicted"] + row["residual"])) < 1e-9


def test_train_matches_sklearn(client, upload_dataset, simple_csv):
    dataset_id = upload_dataset(simple_csv)
    resp = client.post(
        "/api/v1/models/train",
        json={
            "dataset_id": dataset_id,
            "x_cols": ["x"],
            "y_col": "y",
            "model_type": "simple",
        },
    )
    body = resp.json()

    xs = np.array([[i] for i in range(1, 21)], dtype=float)
    ys = np.array(
        [3 * i + 1 + (0.1 if i % 2 else -0.1) for i in range(1, 21)], dtype=float
    )
    ref = LinearRegression().fit(xs, ys)

    assert abs(body["coefficients"]["intercept"] - float(ref.intercept_)) < 1e-6
    assert abs(body["coefficients"]["slopes"]["x"] - float(ref.coef_[0])) < 1e-6
    assert abs(body["metrics"]["r2"] - ref.score(xs, ys)) < 1e-6


def test_train_multiple(client, multi_csv):
    up = client.post(
        "/api/v1/datasets/upload",
        files={"file": ("m.csv", multi_csv, "text/csv")},
    ).json()
    resp = client.post(
        "/api/v1/models/train",
        json={
            "dataset_id": up["dataset_id"],
            "x_cols": ["x1", "x2"],
            "y_col": "y",
            "model_type": "multiple",
        },
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert set(body["coefficients"]["slopes"].keys()) == {"x1", "x2"}
    assert body["metrics"]["r2"] > 0.95
    assert len(body["t_tests"]) == 3  # intercept + 2 features
    assert body["correlation_matrix"]["columns"] == ["x1", "x2", "y"]


def test_train_rejects_simple_with_two_x(client, upload_dataset, multi_csv):
    up = client.post(
        "/api/v1/datasets/upload",
        files={"file": ("m.csv", multi_csv, "text/csv")},
    ).json()
    resp = client.post(
        "/api/v1/models/train",
        json={
            "dataset_id": up["dataset_id"],
            "x_cols": ["x1", "x2"],
            "y_col": "y",
            "model_type": "simple",
        },
    )
    assert resp.status_code == 400
    assert resp.json()["code"] == "invalid_data"


def test_train_rejects_y_in_x(client, upload_dataset):
    dataset_id = upload_dataset()
    resp = client.post(
        "/api/v1/models/train",
        json={
            "dataset_id": dataset_id,
            "x_cols": ["y"],
            "y_col": "y",
            "model_type": "simple",
        },
    )
    assert resp.status_code == 400
    assert resp.json()["code"] == "invalid_data"


def test_train_rejects_missing_dataset(client):
    resp = client.post(
        "/api/v1/models/train",
        json={
            "dataset_id": "nope",
            "x_cols": ["x"],
            "y_col": "y",
            "model_type": "simple",
        },
    )
    assert resp.status_code == 404
    assert resp.json()["code"] == "dataset_not_found"


def test_train_rejects_categorical_x(client):
    csv = b"cat,y\na,1\nb,2\nc,3\nd,4\ne,5\nf,6\n"
    up = client.post(
        "/api/v1/datasets/upload",
        files={"file": ("c.csv", csv, "text/csv")},
    )
    # If pandas infers 'cat' as object, upload still succeeds (y is numeric).
    if up.status_code != 200:
        return
    resp = client.post(
        "/api/v1/models/train",
        json={
            "dataset_id": up.json()["dataset_id"],
            "x_cols": ["cat"],
            "y_col": "y",
            "model_type": "simple",
        },
    )
    assert resp.status_code == 400
    assert resp.json()["code"] == "categorical_x_unsupported"


def test_get_model_roundtrip(client, train_simple):
    trained = train_simple()
    resp = client.get(f"/api/v1/models/{trained['model_id']}")
    assert resp.status_code == 200
    assert resp.json()["model_id"] == trained["model_id"]


def test_get_model_404(client):
    resp = client.get("/api/v1/models/missing")
    assert resp.status_code == 404
    assert resp.json()["code"] == "model_not_found"
