"""
db/base.py
──────────
SQLAlchemy declarative base — import this in every model file
so that Alembic can discover all tables via metadata.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""
    pass
