import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "SentinelGrid — CCTV Registry & Watchlist Analytics"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "sentinelgrid-gujarat-police-secret-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    # Database URL: default PostgreSQL PostGIS URL
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "sentinel")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "sentinel123")
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "sentinelgrid")
    
    # Database connection URL
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite+aiosqlite:///./sentinelgrid.db" if os.getenv("USE_SQLITE", "true").lower() == "true" else f"postgresql+asyncpg://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER}:{POSTGRES_PORT}/{POSTGRES_DB}"
    )
    
    # Synchronous DB URL for Alembic / raw spatial queries if needed
    SYNC_DATABASE_URL: str = os.getenv(
        "SYNC_DATABASE_URL",
        "sqlite:///./sentinelgrid.db" if os.getenv("USE_SQLITE", "true").lower() == "true" else f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER}:{POSTGRES_PORT}/{POSTGRES_DB}"
    )

    class Config:
        case_sensitive = True

settings = Settings()
