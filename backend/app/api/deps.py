"""
api/deps.py
───────────
FastAPI dependency injection helpers.
Re-usable dependencies for DB sessions and authenticated users.
"""

from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User

# ── Bearer token extractor ────────────────────────────────────────────────────
bearer_scheme = HTTPBearer(
    scheme_name="Bearer",
    description="Paste your JWT access token (without 'Bearer ' prefix).",
)

# ── Type aliases for cleaner route signatures ─────────────────────────────────
DBSession = Annotated[AsyncSession, Depends(get_db)]
BearerToken = Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)]


async def get_current_user(
    credentials: BearerToken,
    db: DBSession,
) -> User:
    """
    Dependency that extracts and validates the JWT Bearer token,
    fetches the corresponding user from DB, and returns the User ORM object.

    Raises HTTP 401 for invalid tokens.
    Raises HTTP 404 if user no longer exists.
    """
    user_id: str = decode_access_token(credentials.credentials)

    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )
    return user


# ── Convenience type alias ────────────────────────────────────────────────────
CurrentUser = Annotated[User, Depends(get_current_user)]
