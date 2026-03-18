from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    # ── App ────────────────────────────────────────────
    APP_NAME: str = " AJ SENTINEL"
    APP_ENV: str = "development"
    DEBUG: bool = True

    # ── Security ───────────────────────────────────────
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080

    # ── MongoDB ────────────────────────────────────────
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "sentinel_db"

    # ── Redis ──────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379"

    # ── CORS ───────────────────────────────────────────
    CORS_ORIGINS: str = '["http://localhost:5173","http://localhost:3000"]'

    def get_cors_origins(self) -> List[str]:
        return json.loads(self.CORS_ORIGINS)

    # ── Monitoring ─────────────────────────────────────
    CHECK_INTERVAL_SECONDS: int = 30
    REQUEST_TIMEOUT_SECONDS: int = 10

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"          # ← ignores VITE_ and any unknown vars


settings = Settings()
