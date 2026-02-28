"""
ai/providers/openrouter_provider.py
────────────────────────────────────
OpenRouter LLM provider implementation.

OpenRouter proxies many open-source models through a single API
compatible with the OpenAI chat completions format.

API Docs: https://openrouter.ai/docs
"""

import os
from typing import List

import httpx

from app.ai.providers.base_provider import BaseProvider, ProviderError


OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"


class OpenRouterProvider(BaseProvider):
    """Adapter for the OpenRouter API."""

    def __init__(self) -> None:
        self._api_key: str = os.environ.get("OPENROUTER_API_KEY", "")
        if not self._api_key:
            raise ProviderError(
                "openrouter",
                "OPENROUTER_API_KEY environment variable is not set. "
                "Get your free API key at https://openrouter.ai/keys",
            )

    async def generate(self, messages: List[dict], model: str) -> str:
        """
        Send the conversation to OpenRouter and return the assistant reply.

        Args:
            messages: Full conversation history in OpenAI chat format.
            model:    OpenRouter model slug (e.g. "mistralai/mistral-7b-instruct").

        Returns:
            The assistant's reply as a plain string.

        Raises:
            ProviderError: On HTTP error or unexpected API response structure.
        """
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
            # OpenRouter strongly recommends these headers for routing/analytics
            "HTTP-Referer": os.getenv("FRONTEND_URL", "http://localhost:5173"),
            "X-Title": os.getenv("APP_NAME", "ContextControl"),
        }

        payload = {
            "model": model,
            "messages": messages,
            # Hooks for future streaming / token tracking
            # "stream": False,
            # "max_tokens": 2048,
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    OPENROUTER_API_URL,
                    headers=headers,
                    json=payload,
                )
                response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise ProviderError(
                "openrouter",
                f"HTTP {exc.response.status_code}: {exc.response.text}",
            ) from exc
        except httpx.RequestError as exc:
            raise ProviderError(
                "openrouter",
                f"Network error: {exc}",
            ) from exc

        data = response.json()

        try:
            return data["choices"][0]["message"]["content"]
        except (KeyError, IndexError) as exc:
            raise ProviderError(
                "openrouter",
                f"Unexpected response format: {data}",
            ) from exc
