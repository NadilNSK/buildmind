from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "buildmind-ai-worker"
    assert data["version"] == "5.0.0"
    assert "uptime_seconds" in data
    assert "python_version" in data

def test_takeoff_detect_placeholder_returns_501():
    response = client.post(
        "/api/v1/takeoff/detect",
        json={
            "drawing_id": "drw-123",
            "revision_id": "rev-01",
            "element_category": "walls",
            "measurement_standard": "SLS_573",
        },
    )
    assert response.status_code == 501
    data = response.json()
    assert data["detail"]["capability_id"] == "AF-01"
    assert data["detail"]["status"] == "NOT_IMPLEMENTED"
