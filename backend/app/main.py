"""
app/main.py
───────────
FastAPI application entry point.

Responsibilities:
  - Create the FastAPI app instance
  - Configure CORS
  - Register all routers
  - Create DB tables on startup (dev mode)
  - Health check endpoint
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.db.base import Base
from app.db.session import engine

# ── Import models so SQLAlchemy picks them up before create_all ───────────────
from app.models import user, message  # noqa: F401 — side-effect imports

from app.api.auth_routes import router as auth_router
from app.api.chat_routes import router as chat_router

settings = get_settings()


# ── Lifespan: startup / shutdown ──────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Create all tables on startup (idempotent).
    In production you'd use Alembic migrations instead.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Teardown (dispose connection pool gracefully)
    await engine.dispose()


# ── App instance ──────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="ChatGPT MVP — Phase 1: Auth + Chat Storage API",
    lifespan=lifespan,
    docs_url="/docs",   # Swagger UI
    redoc_url="/redoc", # ReDoc UI
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],  # Never use ["*"] in production
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router, prefix="/api/v1")
app.include_router(chat_router, prefix="/api/v1")


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health_check():
    """Returns 200 OK — used by load balancers / uptime monitors."""
    return {"status": "ok", "app": settings.APP_NAME}
