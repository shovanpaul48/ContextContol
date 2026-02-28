"""
migrate.py
──────────
One-time migration script — adds the conversations table and
conversation_id column to messages.

Uses the app's existing engine (which correctly handles Neon SSL).

Run once with:
    python migrate.py
"""

import asyncio
from sqlalchemy import text

# Reuse the app engine (handles Neon SSL + asyncpg quirks correctly)
from app.db.session import engine


CREATE_CONVERSATIONS = """
CREATE TABLE IF NOT EXISTS conversations (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider     VARCHAR(50)  NOT NULL DEFAULT 'openrouter',
    model        VARCHAR(200) NOT NULL DEFAULT 'mistralai/mistral-7b-instruct',
    title        VARCHAR(255),
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
"""

ADD_CONV_ID_TO_MESSAGES = """
ALTER TABLE messages
    ADD COLUMN IF NOT EXISTS conversation_id UUID
    REFERENCES conversations(id) ON DELETE CASCADE;
"""

CREATE_IDX_CONV_ID = """
CREATE INDEX IF NOT EXISTS ix_messages_conversation_id
    ON messages (conversation_id);
"""


async def run_migration():
    async with engine.begin() as conn:
        print("Creating conversations table...")
        await conn.execute(text(CREATE_CONVERSATIONS))
        print("  ✓ Done")

        print("Adding conversation_id column to messages...")
        await conn.execute(text(ADD_CONV_ID_TO_MESSAGES))
        print("  ✓ Done")

        print("Creating index on messages.conversation_id...")
        await conn.execute(text(CREATE_IDX_CONV_ID))
        print("  ✓ Done")

    await engine.dispose()
    print("\n✅ Migration complete!")
    print("  • conversations table created (or already existed)")
    print("  • messages.conversation_id column added (or already existed)")
    print("  • Restart uvicorn and you're ready to chat!")


if __name__ == "__main__":
    asyncio.run(run_migration())
