"""
schemas/chat_schema.py
───────────────────────
Pydantic schemas for the Phase 2 LLM chat API.

Includes:
  - ChatRequest:        frontend payload when sending a message
  - ChatResponse:       backend response with assistant reply
  - ConversationSchema: serialised conversation object
  - ProviderInfo:       provider/model registry response
"""

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, field_validator


# ── Request ───────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    """Payload sent by the frontend for every message."""
    content: str
    provider: str = "openrouter"
    model: str = "mistralai/mistral-7b-instruct"
    conversation_id: Optional[uuid.UUID] = None

    @field_validator("content")
    @classmethod
    def content_not_empty(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Message content cannot be empty.")
        if len(stripped) > 10_000:
            raise ValueError("Message content exceeds 10,000 character limit.")
        return stripped

    @field_validator("provider")
    @classmethod
    def provider_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Provider cannot be empty.")
        return v.strip().lower()

    @field_validator("model")
    @classmethod
    def model_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Model cannot be empty.")
        return v.strip()


# ── Response ──────────────────────────────────────────────────────────────────

class ChatResponse(BaseModel):
    """Response returned to the frontend after processing a chat message."""
    assistant_message: str
    conversation_id: uuid.UUID

    # Included for easy client-side rendering without a second fetch
    user_message_id: uuid.UUID
    assistant_message_id: uuid.UUID


# ── Conversation ──────────────────────────────────────────────────────────────

class ConversationSchema(BaseModel):
    """Serialised Conversation object."""
    id: uuid.UUID
    user_id: uuid.UUID
    provider: str
    model: str
    title: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ── Provider / Model Registry ─────────────────────────────────────────────────

class ModelInfo(BaseModel):
    """Single model entry."""
    id: str
    label: str


class ProviderInfo(BaseModel):
    """Provider with its available models."""
    id: str
    label: str
    description: str
    available: bool
    models: List[str]
