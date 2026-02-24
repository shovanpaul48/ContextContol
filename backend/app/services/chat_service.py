"""
services/chat_service.py
────────────────────────
Business logic for storing and retrieving chat messages.
"""

import uuid
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.message import Message
from app.models.user import User
from app.schemas.message_schema import MessageCreate, MessageResponse, ChatHistoryResponse


async def save_message(
    db: AsyncSession,
    user: User,
    payload: MessageCreate,
    role: str = "user",
) -> MessageResponse:
    """
    Persist a new message to the database.

    Args:
        db: Active async database session.
        user: The authenticated user ORM instance.
        payload: Validated message content.
        role: "user" or "assistant" — defaults to "user" in Phase 1.

    Returns:
        Serialized MessageResponse.
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

    Args:
        db: Active async database session.
        user: The authenticated user ORM instance.
        limit: Maximum number of messages to return (default 100).
        offset: Number of messages to skip for pagination.

    Returns:
        ChatHistoryResponse with messages list and total count.
    """
    # Total count for pagination metadata
    count_result = await db.execute(
        select(func.count(Message.id)).where(Message.user_id == user.id)
    )
    total: int = count_result.scalar_one()

    # Fetch paginated messages
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
