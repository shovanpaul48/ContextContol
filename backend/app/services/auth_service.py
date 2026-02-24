"""
services/auth_service.py
────────────────────────
Google ID token verification + user upsert logic.
All DB interactions are async.
"""

from typing import Optional

import httpx
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import create_access_token
from app.models.user import User
from app.schemas.user_schema import TokenResponse, UserResponse

settings = get_settings()

# Google's public token-info endpoint
GOOGLE_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo"


async def verify_google_id_token(id_token: str) -> dict:
    """
    Verify a Google ID token using Google's tokeninfo endpoint.

    Returns the decoded token payload if valid.
    Raises HTTP 401 if token is invalid or audience doesn't match.

    Note: For production at scale swap this for google-auth library
    verification which avoids the extra HTTP round-trip.
    """
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(
            GOOGLE_TOKEN_INFO_URL,
            params={"id_token": id_token},
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google ID token.",
        )

    token_data = response.json()

    # ── Security: verify the token was issued for OUR app ─────────────────
    if token_data.get("aud") != settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token audience mismatch — rejected.",
        )

    return token_data


async def get_or_create_user(db: AsyncSession, google_payload: dict) -> User:
    """
    Find existing user by email or create a new one from Google payload.
    Returns the User ORM instance.
    """
    email: str = google_payload.get("email", "")
    name: str = google_payload.get("name", email.split("@")[0])
    picture: Optional[str] = google_payload.get("picture")

    # Try to find an existing user
    result = await db.execute(select(User).where(User.email == email))
    user: Optional[User] = result.scalar_one_or_none()

    if user is None:
        # First-time login — create a new user record
        user = User(email=email, name=name, picture=picture)
        db.add(user)
        await db.commit()
        await db.refresh(user)
    else:
        # Update profile picture in case it changed on Google's side
        if user.picture != picture:
            user.picture = picture
            await db.commit()
            await db.refresh(user)

    return user


async def authenticate_with_google(
    id_token: str, db: AsyncSession
) -> TokenResponse:
    """
    Full Google OAuth flow:
    1. Verify token with Google
    2. Upsert user in DB
    3. Issue JWT
    4. Return TokenResponse
    """
    google_payload = await verify_google_id_token(id_token)
    user = await get_or_create_user(db, google_payload)
    access_token = create_access_token(subject=str(user.id))

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )
