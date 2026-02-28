"""
ai/providers/base_provider.py
─────────────────────────────
Abstract base class for all LLM provider implementations.

Any new provider (Groq, Nvidia NIM, Anthropic, etc.) must subclass
BaseProvider and implement the `generate` method.
"""

from abc import ABC, abstractmethod
from typing import List


class BaseProvider(ABC):
    """
    Contract that every LLM provider adapter must fulfil.

    A "message" in the messages list follows the OpenAI chat format:
        {"role": "user" | "assistant" | "system", "content": "..."}
    """

    @abstractmethod
    async def generate(self, messages: List[dict], model: str) -> str:
        """
        Call the underlying LLM API and return the assistant's reply.

        Args:
            messages: Ordered list of role/content dicts (full conversation context).
            model:    Provider-specific model identifier (e.g. "mistralai/mistral-7b-instruct").

        Returns:
            The assistant's response text as a plain string.

        Raises:
            ProviderError: If the upstream API call fails.
        """
        ...


class ProviderError(Exception):
    """Raised when an LLM provider call fails."""
    def __init__(self, provider: str, message: str) -> None:
        self.provider = provider
        super().__init__(f"[{provider}] {message}")
