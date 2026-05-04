def test_export_pdf(client, train_simple):
    trained = train_simple()
    resp = client.get(f"/api/v1/models/{trained['model_id']}/report.pdf")
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("application/pdf")
    assert resp.headers["content-disposition"].startswith("attachment;")
    assert resp.content[:4] == b"%PDF"
    assert len(resp.content) > 500


def test_export_pdf_unknown_model(client):
    resp = client.get("/api/v1/models/nope/report.pdf")
    assert resp.status_code == 404
    assert resp.json()["code"] == "model_not_found"
