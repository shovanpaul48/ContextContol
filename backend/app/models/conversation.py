"""
models/conversation.py
──────────────────────
SQLAlchemy ORM model for the conversations table.

A Conversation groups messages under a chosen provider + model,
belonging to a single user.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    provider: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="openrouter",
    )
    model: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        default="mistralai/mistral-7b-instruct",
    )
    title: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        # FUTURE: auto-generate from first message
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    # ── Relationships ──────────────────────────────────────────────────────
    user: Mapped["User"] = relationship("User", back_populates="conversations")  # noqa: F821
    messages: Mapped[list["Message"]] = relationship(  # noqa: F821
        "Message",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="Message.timestamp",
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<Conversation id={self.id} user_id={self.user_id} provider={self.provider}>"
