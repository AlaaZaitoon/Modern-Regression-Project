def test_upload_returns_full_profile(client, simple_csv):
    resp = client.post(
        "/api/v1/datasets/upload",
        files={"file": ("simple.csv", simple_csv, "text/csv")},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()

    assert body["dataset_id"]
    assert body["filename"] == "simple.csv"
    assert body["columns"] == ["x", "y"]
    assert body["numeric_columns"] == ["x", "y"]
    assert body["categorical_columns"] == []
    assert body["shape"] == [20, 2]
    assert len(body["preview"]) == 10
    assert "x" in body["stats"] and "y" in body["stats"]
    assert body["correlation_matrix"]["columns"] == ["x", "y"]
    assert body["correlation_matrix"]["matrix"][0][1] > 0.99
    assert body["created_at"]


def test_upload_rejects_non_csv_extension(client):
    resp = client.post(
        "/api/v1/datasets/upload",
        files={"file": ("data.txt", b"x,y\n1,2\n", "text/plain")},
    )
    assert resp.status_code == 400
    body = resp.json()
    assert body["code"] == "invalid_data"


def test_upload_rejects_empty_file(client):
    resp = client.post(
        "/api/v1/datasets/upload",
        files={"file": ("empty.csv", b"", "text/csv")},
    )
    assert resp.status_code == 400
    assert resp.json()["code"] == "invalid_data"


def test_upload_rejects_non_numeric_only(client):
    resp = client.post(
        "/api/v1/datasets/upload",
        files={"file": ("cats.csv", b"a,b\nx,y\nz,w\n", "text/csv")},
    )
    assert resp.status_code == 400
    assert resp.json()["code"] == "invalid_data"


def test_get_dataset_roundtrip(client, simple_csv):
    up = client.post(
        "/api/v1/datasets/upload",
        files={"file": ("s.csv", simple_csv, "text/csv")},
    ).json()
    resp = client.get(f"/api/v1/datasets/{up['dataset_id']}")
    assert resp.status_code == 200
    assert resp.json()["columns"] == up["columns"]


def test_get_dataset_404(client):
    resp = client.get("/api/v1/datasets/does-not-exist")
    assert resp.status_code == 404
    assert resp.json()["code"] == "dataset_not_found"
