"""
ai/providers/groq_provider.py
──────────────────────────────
Groq LLM provider — stub for future implementation.

When ready:
  1. pip install groq
  2. Set GROQ_API_KEY in .env
  3. Implement generate() below
"""

from typing import List

from app.ai.providers.base_provider import BaseProvider, ProviderError


class GroqProvider(BaseProvider):
    """
    Placeholder adapter for Groq's ultra-fast inference API.
    Uncomment and implement generate() when adding Groq support.
    """

    async def generate(self, messages: List[dict], model: str) -> str:
        raise ProviderError(
            "groq",
            "Groq provider is not yet implemented. "
            "Set GROQ_API_KEY and implement GroqProvider.generate().",
        )
