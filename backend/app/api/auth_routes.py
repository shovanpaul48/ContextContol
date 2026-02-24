"""
api/auth_routes.py
──────────────────
Authentication endpoints.
POST /auth/google — exchange Google ID token for JWT.
"""

from fastapi import APIRouter

from app.api.deps import DBSession
from app.schemas.user_schema import GoogleAuthRequest, TokenResponse
from app.services.auth_service import authenticate_with_google

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/google",
    response_model=TokenResponse,
    summary="Exchange Google ID token for JWT",
    description=(
        "Receives the Google ID token from the frontend after Google sign-in, "
        "verifies it, upserts the user in the database, and returns a JWT access token."
    ),
)
async def google_auth(
    payload: GoogleAuthRequest,
    db: DBSession,
) -> TokenResponse:
    """
    Google OAuth 2.0 token exchange endpoint.

    Body:
        id_token (str): Google ID token obtained from the frontend.

    Returns:
        TokenResponse with JWT access_token + user profile.
    """
    return await authenticate_with_google(id_token=payload.id_token, db=db)
