import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import text
from app.config import settings

# Determine if we use SQLite in-memory fallback for local dev or PostgreSQL PostGIS
DB_URL = settings.DATABASE_URL
IS_SQLITE = "sqlite" in DB_URL

if IS_SQLITE:
    engine = create_async_engine(DB_URL, connect_args={"check_same_thread": False})
else:
    engine = create_async_engine(DB_URL, echo=False, pool_pre_ping=True, pool_size=20, max_overflow=10)

AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    """Initializes PostGIS extension and creates tables."""
    async with engine.begin() as conn:
        if not IS_SQLITE:
            try:
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"))
            except Exception as e:
                print(f"Warning initializing PostGIS extension: {e}")
        await conn.run_sync(Base.metadata.create_all)
