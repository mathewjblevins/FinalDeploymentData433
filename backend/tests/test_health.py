from fastapi.testclient import TestClient


def test_health_returns_200(client: TestClient) -> None:
    resp = client.get("/health")
    assert resp.status_code == 200


def test_health_schema(client: TestClient) -> None:
    data = client.get("/health").json()
    assert data["ok"] is True
    assert "version" in data
    assert "environment" in data
