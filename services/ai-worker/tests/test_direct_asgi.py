import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import json
from app.main import app

async def call_asgi(app, method: str, path: str, body: dict = None):
    body_bytes = json.dumps(body).encode("utf-8") if body else b""
    response_body = []
    response_status = None
    response_headers = []

    scope = {
        "type": "http",
        "method": method,
        "path": path,
        "raw_path": path.encode("utf-8"),
        "query_string": b"",
        "headers": [
            (b"host", b"localhost"),
            (b"content-type", b"application/json"),
            (b"content-length", str(len(body_bytes)).encode("ascii")),
        ],
    }

    async def receive():
        return {
            "type": "http.request",
            "body": body_bytes,
            "more_body": False,
        }

    async def send(message):
        nonlocal response_status, response_headers
        if message["type"] == "http.response.start":
            response_status = message["status"]
            response_headers = message.get("headers", [])
        elif message["type"] == "http.response.body":
            response_body.append(message.get("body", b""))

    await app(scope, receive, send)
    full_body = b"".join(response_body).decode("utf-8")
    return response_status, json.loads(full_body) if full_body else None

async def main():
    # 1. Health check
    status, data = await call_asgi(app, "GET", "/health")
    print(f"[PASS] GET /health -> status: {status}, payload: {data}")
    assert status == 200
    assert data["status"] == "ok"
    assert data["service"] == "buildmind-ai-worker"

    # 2. AF-01 Takeoff Detect placeholder
    status, data = await call_asgi(app, "POST", "/api/v1/takeoff/detect", {
        "drawing_id": "drw-101",
        "revision_id": "rev-a",
        "element_category": "walls"
    })
    print(f"[PASS] POST /api/v1/takeoff/detect -> status: {status}, payload: {data}")
    assert status == 501
    assert data["detail"]["capability_id"] == "AF-01"

    # 3. AF-03 Conflicts placeholder
    status, data = await call_asgi(app, "POST", "/api/v1/conflicts/analyze", {
        "architectural_drawing_id": "arch-1",
        "structural_drawing_id": "str-1"
    })
    print(f"[PASS] POST /api/v1/conflicts/analyze -> status: {status}")
    assert status == 501
    assert data["detail"]["capability_id"] == "AF-03"

    # 4. AF-04 Copilot placeholder
    status, data = await call_asgi(app, "POST", "/api/v1/copilot/query", {
        "project_id": "prj-1",
        "query": "What is the concrete grade?"
    })
    print(f"[PASS] POST /api/v1/copilot/query -> status: {status}")
    assert status == 501
    assert data["detail"]["capability_id"] == "AF-04"

    print("\nALL FASTAPI AI WORKER TESTS PASSED CLEANLY WITH ZERO DEPENDENCE ON ASYNC SOCKETS!")

if __name__ == "__main__":
    asyncio.run(main())
