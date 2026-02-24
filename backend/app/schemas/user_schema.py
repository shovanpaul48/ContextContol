"""
schemas/user_schema.py
──────────────────────
Pydantic schemas for user request/response serialization.
"""

import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict


class UserBase(BaseModel):
    email: EmailStr
    name: str
    picture: str | None = None


class UserCreate(UserBase):
    """Used internally when creating a new user from Google token data."""
    pass


class UserResponse(UserBase):
    """Returned to the client — no sensitive fields."""
    id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    """JWT token response after successful Google auth."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class GoogleAuthRequest(BaseModel):
    """Payload sent from frontend after Google sign-in."""
    id_token: str  # Google ID token
