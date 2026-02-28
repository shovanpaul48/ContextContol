"""
ai/llm_service.py
──────────────────
LLM Service — provider factory + response generation.

Uses the OpenAI-compatible client to call OpenRouter (and future providers).

Hooks left for future extension (search for "# FUTURE"):
  - Streaming responses
  - Token usage tracking
  - Rate limiting
"""

import os
from typing import List

from fastapi import HTTPException, status
from openai import OpenAI, APIError, APIConnectionError, AuthenticationError

from app.ai.model_registry import MODEL_REGISTRY, is_valid_model
from app.ai.providers.base_provider import ProviderError
from dotenv import load_dotenv
load_dotenv()

# ── Provider base URLs ────────────────────────────────────────────────────────
_PROVIDER_BASE_URLS: dict[str, str] = {
    "openrouter": "https://openrouter.ai/api/v1",
    "groq":       "https://api.groq.com/openai/v1",
    "nvidia_nim": "https://integrate.api.nvidia.com/v1",
}

_PROVIDER_ENV_KEYS: dict[str, str] = {
    "openrouter": "OPENROUTER_API_KEY",
    "groq":       "GROQ_API_KEY",
    "nvidia_nim": "NVIDIA_API_KEY",
}


def _get_openai_client(provider: str) -> OpenAI:
    """
    Return an OpenAI-compatible client pointed at the chosen provider's base URL.

    Raises:
        HTTPException 503: If the required API key env var is not set.
        HTTPException 400: If the provider key is unrecognised.
    """
    if provider not in _PROVIDER_BASE_URLS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown provider '{provider}'. "
                   f"Valid providers: {list(_PROVIDER_BASE_URLS.keys())}",
        )

    env_key = _PROVIDER_ENV_KEYS[provider]
    api_key = os.environ.get(env_key, "")
    # api_key = "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"

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                f"Provider '{provider}' is not configured. "
                f"Set the {env_key} environment variable. "
                f"Get a free key at https://openrouter.ai/keys"
            ),
        )

    return OpenAI(
        base_url=_PROVIDER_BASE_URLS[provider],
        api_key=api_key,
    )


# ── Public API ─────────────────────────────────────────────────────────────────

async def generate_response(
    provider: str,
    model: str,
    conversation_messages: List[dict],
) -> str:
    """
    Generate a model response for the given conversation context.

    Args:
        provider:              Provider key (e.g. "openrouter").
        model:                 Model slug registered under that provider.
        conversation_messages: Full conversation history in OpenAI format
                               [{"role": "user"|"assistant", "content": "..."}].
                               The last item should be the user's latest message.

    Returns:
        The assistant's reply as a plain string.

    Raises:
        HTTPException 400: Unknown provider or model not in registry.
        HTTPException 503: API key not configured.
        HTTPException 502: Upstream API call failed.
    """
    # ── Validate model is registered ──────────────────────────────────────
    if not is_valid_model(provider, model):
        allowed = MODEL_REGISTRY.get(provider, [])
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Model '{model}' is not registered for provider '{provider}'. "
                f"Allowed models: {allowed}"
            ),
        )

    # ── Build full message list with system prompt ─────────────────────────
    # conversation_messages already contains the full history (user + assistant turns).
    # We prepend a system message for context.
    messages: List[dict] = [
        {"role": "system", "content": "You are a helpful assistant."}
    ] + conversation_messages   # ← extend, not nest!

    # ── Get provider client ────────────────────────────────────────────────
    client = _get_openai_client(provider)

    print("-" * 50)
    print(f"Provider : {provider}")
    print(f"Model    : {model}")
    print(f"Messages : {messages}")
    print("-" * 50)

    # FUTURE: add streaming support here
    # FUTURE: inject rate-limiter here
    try:
        completion = client.chat.completions.create(
            model=model,
            messages=messages,
        )
    except AuthenticationError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"[{provider}] Authentication failed — check your API key. ({exc})",
        ) from exc
    except APIConnectionError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"[{provider}] Could not connect to the provider API. ({exc})",
        ) from exc
    except APIError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"[{provider}] API error: {exc}",
        ) from exc

    # ── Extract text reply ─────────────────────────────────────────────────
    # completion is a ChatCompletion object — we need .choices[0].message.content
    try:
        reply: str = completion.choices[0].message.content
    except (IndexError, AttributeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"[{provider}] Unexpected response format: {completion}",
        ) from exc

    # FUTURE: track token usage — completion.usage.total_tokens
    return reply
