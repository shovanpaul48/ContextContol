"""
schemas/message_schema.py
─────────────────────────
Pydantic schemas for chat message request/response serialization.
"""

import uuid
from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, field_validator


class MessageCreate(BaseModel):
    """Payload from frontend when sending a new message."""
    content: str

    @field_validator("content")
    @classmethod
    def content_must_not_be_empty(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Message content cannot be empty.")
        if len(stripped) > 10_000:
            raise ValueError("Message content exceeds 10,000 character limit.")
        return stripped


class MessageResponse(BaseModel):
    """Single message returned to the client."""
    id: uuid.UUID
    user_id: uuid.UUID
    content: str
    role: Literal["user", "assistant"]
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatHistoryResponse(BaseModel):
    """Paginated chat history."""
    messages: list[MessageResponse]
    total: int
