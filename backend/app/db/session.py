"""
db/session.py
─────────────
Final Fix for Neon/Asyncpg Connection Errors
"""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.core.config import get_settings
import ssl

settings = get_settings()

# 1. Clean the URL: Remove everything after the '?' to stop SQLAlchemy from parsing params
raw_url = settings.DATABASE_URL
base_url = raw_url.split('?')[0] 

# 2. Ensure the prefix is correct
if not base_url.startswith("postgresql+asyncpg://"):
    base_url = base_url.replace("postgresql://", "postgresql+asyncpg://")

# 3. Define connection arguments specifically for asyncpg
# This bypasses the SQLAlchemy 'channel_binding' injection
connect_args = {
    "ssl": True, # This replaces 'sslmode=require'
    "server_settings": {
        "jit": "off",
        "response_encoding": "utf8",
    }
}

# ── Engine ────────────────────────────────────────────────────────────────────
engine = create_async_engine(
    base_url,
    pool_pre_ping=True,
    echo=settings.DEBUG,
    connect_args=connect_args
)

# ── Session factory ───────────────────────────────────────────────────────────
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)

async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()