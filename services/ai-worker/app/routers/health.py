import time
import sys
from fastapi import APIRouter
from app.config import settings

router = APIRouter(tags=["Health"])

STARTUP_TIME = time.time()

@router.get("/health")
async def health_check():
    """
    Public health check endpoint returning service status and runtime metadata.
    """
    uptime = int(time.time() - STARTUP_TIME)
    return {
        "status": "ok",
        "service": settings.SERVICE_NAME,
        "version": settings.SERVICE_VERSION,
        "environment": settings.ENVIRONMENT,
        "uptime_seconds": uptime,
        "python_version": sys.version,
    }
