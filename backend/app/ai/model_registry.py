"""
ai/model_registry.py
───────────────────
Central registry of supported providers and their available models.

To add a new model:    append its slug to the list under the correct provider.
To add a new provider: add a new key + metadata entry.
"""

from typing import Dict, List

# ── Model registry ────────────────────────────────────────────────────────────
# Keys   → provider identifiers (must match what the frontend sends)
# Values → list of model slugs accepted by the provider's API
MODEL_REGISTRY: Dict[str, List[str]] = {
    "openrouter": [
        "arcee-ai/trinity-large-preview:free",
        "mistralai/mistral-7b-instruct",
        "meta-llama/llama-3-8b-instruct",
        "google/gemma-3-12b-it:free",
        "deepseek/deepseek-r1:free",
    ],
    "groq": [
        "llama3-70b-8192",
        "llama3-8b-8192",
        "mixtral-8x7b-32768",
        "gemma2-9b-it",
    ],
    "nvidia_nim": [
        "nvidia/nemotron-3-nano-30b-a3b",
        "meta/llama3-8b-instruct",
        "mistralai/mistral-7b-instruct-v0.3",
    ],
}

# ── Provider display metadata (used by /chat/providers endpoint) ──────────────
PROVIDER_META: Dict[str, dict] = {
    "openrouter": {
        "label": "OpenRouter",
        "description": "Unified API for open-source LLMs",
        "available": True,
    },
    "groq": {
        "label": "Groq",
        "description": "Ultra-fast inference by Groq",
        "available": True,
    },
    "nvidia_nim": {
        "label": "Nvidia NIM",
        "description": "Nvidia inference microservices",
        "available": True,
    },
}


def get_models_for_provider(provider: str) -> List[str]:
    """Return model list for a given provider key, or empty list if unknown."""
    return MODEL_REGISTRY.get(provider, [])


def is_valid_model(provider: str, model: str) -> bool:
    """Return True if model is registered under the given provider."""
    return model in MODEL_REGISTRY.get(provider, [])
