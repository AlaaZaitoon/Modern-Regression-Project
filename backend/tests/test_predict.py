def test_predict_returns_interval(client, train_simple):
    trained = train_simple()
    resp = client.post(
        f"/api/v1/models/{trained['model_id']}/predict",
        json={"x_values": {"x": 10}},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()

    # y ~ 3x + 1  ->  around 31 at x=10
    assert 30 < body["prediction"] < 32
    lo, hi = body["prediction_interval"]
    assert lo < body["prediction"] < hi
    assert body["confidence_level"] == 0.95
    assert body["x_values"] == {"x": 10.0}
    assert "95%" in body["interpretation"]
    assert body["model_id"] == trained["model_id"]


def test_predict_missing_x(client, train_simple):
    trained = train_simple()
    resp = client.post(
        f"/api/v1/models/{trained['model_id']}/predict",
        json={"x_values": {}},
    )
    assert resp.status_code == 400
    assert resp.json()["code"] == "invalid_data"


def test_predict_unknown_model(client):
    resp = client.post(
        "/api/v1/models/unknown/predict",
        json={"x_values": {"x": 1}},
    )
    assert resp.status_code == 404
    assert resp.json()["code"] == "model_not_found"
