from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/copilot", tags=["Conversational QS Copilot (AF-04)"])

class CopilotQueryRequest(BaseModel):
    project_id: str
    query: str
    context_scope: str = "FULL_PROJECT"

@router.post("/query")
async def query_copilot(request: CopilotQueryRequest):
    """
    Placeholder service boundary for AF-04 (Conversational QS Copilot).
    No fabricated answers or mock responses are returned in Phase 1.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail={
            "capability_id": "AF-04",
            "capability_name": "Conversational QS Copilot",
            "status": "NOT_IMPLEMENTED",
            "message": "Domain-specialized QS RAG pipeline and conversational copilot are scheduled for Phase 3. Real project documentation and BOQs must not be queried via mock engines.",
            "project_id": request.project_id,
        },
    )
