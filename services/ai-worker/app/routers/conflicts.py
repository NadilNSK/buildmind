from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/conflicts", tags=["Drawing Conflict Detection (AF-03)"])

class ConflictAnalysisRequest(BaseModel):
    architectural_drawing_id: str
    structural_drawing_id: str
    threshold_mm: float = 25.0

@router.post("/analyze")
async def analyze_conflicts(request: ConflictAnalysisRequest):
    """
    Placeholder service boundary for AF-03 (AI Drawing Conflict Detection).
    No fake clash data or simulated conflicts are returned in Phase 1.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail={
            "capability_id": "AF-03",
            "capability_name": "AI Drawing Conflict Detection",
            "status": "NOT_IMPLEMENTED",
            "message": "Cross-discipline clash detection and dimension conflict resolution are scheduled for Phase 3. No synthetic conflicts are generated.",
            "architectural_drawing": request.architectural_drawing_id,
            "structural_drawing": request.structural_drawing_id,
        },
    )
