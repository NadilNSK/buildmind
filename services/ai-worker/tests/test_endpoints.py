import sys
import os

# Ensure services/ai-worker is in path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import httpx
from app.main import app

def test_all():
    transport = httpx.ASGITransport(app=app)
    client = httpx.Client(transport=transport, base_url="http://testserver")

    try:
        # 1. Health check
        res_health = client.get("/health")
        assert res_health.status_code == 200
        data = res_health.json()
        assert data["status"] == "ok"
        assert data["service"] == "buildmind-ai-worker"
        assert data["version"] == "5.0.0"
        print("[PASS] AI Worker /health endpoint:", data)

        # 2. AF-01 Takeoff detection placeholder (501 Not Implemented)
        res_takeoff = client.post(
            "/api/v1/takeoff/detect",
            json={
                "drawing_id": "drw-101",
                "revision_id": "rev-a",
                "element_category": "walls",
            },
        )
        assert res_takeoff.status_code == 501
        takeoff_json = res_takeoff.json()
        assert takeoff_json["detail"]["capability_id"] == "AF-01"
        assert takeoff_json["detail"]["status"] == "NOT_IMPLEMENTED"
        print("[PASS] AI Worker AF-01 boundary verified (501 Not Implemented - no fake detection)")

        # 3. AF-03 Conflict detection placeholder (501 Not Implemented)
        res_conflict = client.post(
            "/api/v1/conflicts/analyze",
            json={
                "architectural_drawing_id": "arch-01",
                "structural_drawing_id": "str-01",
            },
        )
        assert res_conflict.status_code == 501
        assert res_conflict.json()["detail"]["capability_id"] == "AF-03"
        print("[PASS] AI Worker AF-03 boundary verified (501 Not Implemented)")

        # 4. AF-04 QS Copilot placeholder (501 Not Implemented)
        res_copilot = client.post(
            "/api/v1/copilot/query",
            json={
                "project_id": "prj-01",
                "query": "What is the concrete grade?",
            },
        )
        assert res_copilot.status_code == 501
        assert res_copilot.json()["detail"]["capability_id"] == "AF-04"
        print("[PASS] AI Worker AF-04 boundary verified (501 Not Implemented)")

        print("\nAll 4 FastAPI AI Worker smoke tests passed!")
    finally:
        client.close()

if __name__ == "__main__":
    test_all()
