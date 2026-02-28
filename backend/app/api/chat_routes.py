"""
api/chat_routes.py
──────────────────
Chat endpoints — all routes require JWT authentication.

Phase 1 (preserved):
  GET  /chat/history        — paginated message history

Phase 2 (new):
  POST /chat/message        — LLM-powered message send/response
  GET  /chat/providers      — available providers + model lists
  GET  /chat/conversations  — user's conversation list
"""

from typing import List

from fastapi import APIRouter, Query

from app.ai.model_registry import MODEL_REGISTRY, PROVIDER_META
from app.api.deps import DBSession, CurrentUser
from app.schemas.chat_schema import ChatRequest, ChatResponse, ProviderInfo
from app.schemas.message_schema import ChatHistoryResponse
from app.services.chat_service import handle_chat_message, get_chat_history

router = APIRouter(prefix="/chat", tags=["Chat"])


# ── Phase 2: LLM-powered chat ─────────────────────────────────────────────────

@router.post(
    "/message",
    response_model=ChatResponse,
    status_code=201,
    summary="Send a message and get an LLM response",
)
async def send_message(
    payload: ChatRequest,
    current_user: CurrentUser,
    db: DBSession,
) -> ChatResponse:
    """
    Send a user message, call the selected LLM provider, and return the
    assistant response.

    Requires:
        Authorization: Bearer <jwt_token>

    Body:
        content (str):            The message text (max 10,000 chars).
        provider (str):           LLM provider key (default: "openrouter").
        model (str):              Model slug registered for the provider.
        conversation_id (UUID?):  Resume an existing conversation (optional).

    Returns:
        ChatResponse with assistant_message and conversation_id.
    """
    return await handle_chat_message(db=db, user=current_user, request=payload)


# ── Provider / model registry ─────────────────────────────────────────────────

@router.get(
    "/providers",
    response_model=List[ProviderInfo],
    summary="List available LLM providers and their models",
)
async def list_providers(
    current_user: CurrentUser,
) -> List[ProviderInfo]:
    """
    Return the full provider/model catalogue so the frontend can build the
    model-selector dropdowns dynamically.

    Requires:
        Authorization: Bearer <jwt_token>
    """
    result = []
    for provider_key, models in MODEL_REGISTRY.items():
        meta = PROVIDER_META.get(provider_key, {})
        result.append(
            ProviderInfo(
                id=provider_key,
                label=meta.get("label", provider_key),
                description=meta.get("description", ""),
                available=meta.get("available", False),
                models=models,
            )
        )
    return result


# ── Phase 1 (preserved): history ──────────────────────────────────────────────

@router.get(
    "/history",
    response_model=ChatHistoryResponse,
    summary="Get chat message history (all conversations)",
)
async def fetch_history(
    current_user: CurrentUser,
    db: DBSession,
    limit: int = Query(default=100, ge=1, le=500, description="Max messages to return"),
    offset: int = Query(default=0, ge=0, description="Messages to skip (pagination)"),
) -> ChatHistoryResponse:
    """
    Retrieve the authenticated user's full chat history across all
    conversations, oldest first.

    Requires:
        Authorization: Bearer <jwt_token>
    """
    return await get_chat_history(db=db, user=current_user, limit=limit, offset=offset)
