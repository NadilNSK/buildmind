import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import httpx
from app.main import app

async def main():
    print("Initializing transport...")
    transport = httpx.ASGITransport(app=app)
    print("Transport initialized. Making request...")
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        print("Sending GET /health...")
        r = await client.get("/health")
        print("Response received:", r.status_code, r.json())

        print("Sending POST /api/v1/takeoff/detect...")
        r2 = await client.post(
            "/api/v1/takeoff/detect",
            json={
                "drawing_id": "drw-1",
                "revision_id": "rev-1",
                "element_category": "walls",
            },
        )
        print("Takeoff response:", r2.status_code, r2.json())

    print("All requests completed successfully.")

if __name__ == "__main__":
    asyncio.run(main())
