import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import httpx
from app.main import app

async def run_smoke_tests():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # 1. Health check
        res_health = await client.get("/health")
        assert res_health.status_code == 200, f"Health check failed: {res_health.status_code}"
        health_data = res_health.json()
        assert health_data["status"] == "ok"
        assert health_data["service"] == "buildmind-ai-worker"
        assert health_data["version"] == "5.0.0"
        print("[PASS] AI Worker /health endpoint verified:", health_data)

        # 2. Takeoff detection boundary (AF-01 placeholder)
        res_takeoff = await client.post(
            "/api/v1/takeoff/detect",
            json={
                "drawing_id": "drw-colombo-101",
                "revision_id": "rev-c",
                "element_category": "reinforced_concrete_columns",
                "measurement_standard": "SLS_573",
            },
        )
        assert res_takeoff.status_code == 501, f"Expected 501, got {res_takeoff.status_code}"
        takeoff_data = res_takeoff.json()
        assert takeoff_data["detail"]["capability_id"] == "AF-01"
        assert takeoff_data["detail"]["status"] == "NOT_IMPLEMENTED"
        print("[PASS] AI Worker AF-01 Takeoff boundary verified (501 Not Implemented - No fake detection)")

        # 3. Conflict analysis boundary (AF-03 placeholder)
        res_conflict = await client.post(
            "/api/v1/conflicts/analyze",
            json={
                "architectural_drawing_id": "arch-fl-04",
                "structural_drawing_id": "str-fl-04",
                "threshold_mm": 20.0,
            },
        )
        assert res_conflict.status_code == 501
        assert res_conflict.json()["detail"]["capability_id"] == "AF-03"
        print("[PASS] AI Worker AF-03 Conflict boundary verified (501 Not Implemented)")

        # 4. QS Copilot boundary (AF-04 placeholder)
        res_copilot = await client.post(
            "/api/v1/copilot/query",
            json={
                "project_id": "prj-001",
                "query": "What is the retention limit under CIDA SBD-01?",
            },
        )
        assert res_copilot.status_code == 501
        assert res_copilot.json()["detail"]["capability_id"] == "AF-04"
        print("[PASS] AI Worker AF-04 Copilot boundary verified (501 Not Implemented)")

    print("\nALL AI WORKER SMOKE TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(run_smoke_tests())
