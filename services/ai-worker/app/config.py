import os

class Settings:
    SERVICE_NAME: str = "buildmind-ai-worker"
    SERVICE_VERSION: str = "5.0.0"
    ENVIRONMENT: str = os.getenv("APP_ENV", "development")
    PORT: int = int(os.getenv("AI_WORKER_PORT", "8000"))
    HOST: str = os.getenv("AI_WORKER_HOST", "0.0.0.0")

settings = Settings()
