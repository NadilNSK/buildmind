from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/v1/takeoff", tags=["Takeoff Auto-Detection (AF-01)"])

class TakeoffDetectionRequest(BaseModel):
    drawing_id: str
    revision_id: str
    element_category: str  # e.g., "walls", "columns", "doors", "windows"
    measurement_standard: str = "SLS_573"
    bounding_box: Optional[dict] = None

@router.post("/detect")
async def detect_elements(request: TakeoffDetectionRequest):
    """
    Placeholder service boundary for AF-01 (AI Auto-Detection & One-Click Takeoff).
    In Phase 1, this endpoint confirms architectural routing and parameter validation
    without fabricating fake detection results.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail={
            "capability_id": "AF-01",
            "capability_name": "AI Auto-Detection & One-Click Takeoff",
            "status": "NOT_IMPLEMENTED",
            "message": "AI element auto-detection requires trained vision models scheduled for Phase 2 implementation. Deterministic measurement sheets must not contain simulated or fake predictions.",
            "requested_drawing": request.drawing_id,
            "revision": request.revision_id,
        },
    )
