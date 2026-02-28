"""
services/chat_service.py
────────────────────────
Business logic for chat: conversation management, context building, and LLM calls.

Phase 2 responsibilities:
  - Create or resume a Conversation
  - Save user message
  - Build contextual message list for the LLM
  - Call LLM service
  - Save assistant reply
  - Return structured ChatResponse

Phase 1 functions (save_message, get_chat_history) are preserved for
backward-compat with the legacy /chat/history endpoint.
"""

import uuid
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.llm_service import generate_response
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.user import User
from app.schemas.chat_schema import ChatRequest, ChatResponse
from app.schemas.message_schema import MessageCreate, MessageResponse, ChatHistoryResponse


# ── Phase 2: LLM chat ─────────────────────────────────────────────────────────

async def handle_chat_message(
    db: AsyncSession,
    user: User,
    request: ChatRequest,
) -> ChatResponse:
    """
    Full LLM-powered chat flow:

    1. Get or create a Conversation for this session.
    2. Persist the user's message.
    3. Fetch previous messages to build context.
    4. Call the LLM service.
    5. Persist the assistant reply.
    6. Return ChatResponse.

    Args:
        db:      Active async database session.
        user:    Authenticated user ORM instance.
        request: Validated ChatRequest from the frontend.

    Returns:
        ChatResponse with the assistant reply and conversation ID.
    """

    # ── 1. Resolve or create conversation ─────────────────────────────────
    conversation = await _get_or_create_conversation(
        db=db,
        user=user,
        conversation_id=request.conversation_id,
        provider=request.provider,
        model=request.model,
    )

    # ── 2. Persist user message ────────────────────────────────────────────
    user_msg = Message(
        user_id=user.id,
        conversation_id=conversation.id,
        content=request.content,
        role="user",
    )
    db.add(user_msg)
    await db.flush()  # get user_msg.id without committing yet

    # ── 3. Build context (all previous messages in conversation) ───────────
    history_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.timestamp.asc())
    )
    history = history_result.scalars().all()

    context_messages = [
        {"role": msg.role, "content": msg.content}
        for msg in history
    ]

    # ── 4. Call LLM service ────────────────────────────────────────────────
    assistant_text = await generate_response(
        provider=request.provider,
        model=request.model,
        conversation_messages=context_messages,
    )

    # ── 5. Persist assistant reply ─────────────────────────────────────────
    assistant_msg = Message(
        user_id=user.id,
        conversation_id=conversation.id,
        content=assistant_text,
        role="assistant",
    )
    db.add(assistant_msg)
    await db.commit()
    await db.refresh(assistant_msg)
    await db.refresh(user_msg)

    # ── 6. Return response ─────────────────────────────────────────────────
    return ChatResponse(
        assistant_message=assistant_text,
        conversation_id=conversation.id,
        user_message_id=user_msg.id,
        assistant_message_id=assistant_msg.id,
    )


async def _get_or_create_conversation(
    db: AsyncSession,
    user: User,
    conversation_id: Optional[uuid.UUID],
    provider: str,
    model: str,
) -> Conversation:
    """
    Return an existing Conversation if `conversation_id` is provided and owned
    by the user.  Otherwise create a new one.
    """
    if conversation_id is not None:
        result = await db.execute(
            select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.user_id == user.id,
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            return existing
        # Fall through → create new if not found (safe fallback)

    conversation = Conversation(
        user_id=user.id,
        provider=provider,
        model=model,
    )
    db.add(conversation)
    await db.flush()  # populate conversation.id
    return conversation


# ── Phase 1 legacy: keep for /chat/history backward-compat ───────────────────

async def save_message(
    db: AsyncSession,
    user: User,
    payload: MessageCreate,
    role: str = "user",
) -> MessageResponse:
    """
    Persist a new message to the database (legacy endpoint support).
    """
    message = Message(
        user_id=user.id,
        content=payload.content,
        role=role,
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)
    return MessageResponse.model_validate(message)


async def get_chat_history(
    db: AsyncSession,
    user: User,
    limit: int = 100,
    offset: int = 0,
) -> ChatHistoryResponse:
    """
    Retrieve paginated chat history for a user, ordered oldest → newest.
    """
    count_result = await db.execute(
        select(func.count(Message.id)).where(Message.user_id == user.id)
    )
    total: int = count_result.scalar_one()

    result = await db.execute(
        select(Message)
        .where(Message.user_id == user.id)
        .order_by(Message.timestamp.asc())
        .limit(limit)
        .offset(offset)
    )
    messages = result.scalars().all()

    return ChatHistoryResponse(
        messages=[MessageResponse.model_validate(m) for m in messages],
        total=total,
    )
