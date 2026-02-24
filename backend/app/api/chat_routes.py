"""
api/chat_routes.py
──────────────────
Chat endpoints — all routes require JWT authentication.

POST /chat/message  — send a new message (stored to DB)
GET  /chat/history  — retrieve user's full message history
"""

from fastapi import APIRouter, Query

from app.api.deps import DBSession, CurrentUser
from app.schemas.message_schema import MessageCreate, MessageResponse, ChatHistoryResponse
from app.services.chat_service import save_message, get_chat_history

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post(
    "/message",
    response_model=MessageResponse,
    status_code=201,
    summary="Send a new chat message",
)
async def send_message(
    payload: MessageCreate,
    current_user: CurrentUser,
    db: DBSession,
) -> MessageResponse:
    """
    Store a new user message in the database.

    Requires:
        Authorization: Bearer <jwt_token>

    Body:
        content (str): The message text (max 10,000 chars).

    Returns:
        The persisted MessageResponse with id and timestamp.
    """
    return await save_message(db=db, user=current_user, payload=payload)


@router.get(
    "/history",
    response_model=ChatHistoryResponse,
    summary="Get chat message history",
)
async def fetch_history(
    current_user: CurrentUser,
    db: DBSession,
    limit: int = Query(default=100, ge=1, le=500, description="Max messages to return"),
    offset: int = Query(default=0, ge=0, description="Messages to skip (pagination)"),
) -> ChatHistoryResponse:
    """
    Retrieve the authenticated user's chat history, oldest first.

    Requires:
        Authorization: Bearer <jwt_token>

    Query Params:
        limit  (int): Max messages (1–500), default 100.
        offset (int): Pagination offset, default 0.

    Returns:
        ChatHistoryResponse with messages list and total count.
    """
    return await get_chat_history(db=db, user=current_user, limit=limit, offset=offset)
