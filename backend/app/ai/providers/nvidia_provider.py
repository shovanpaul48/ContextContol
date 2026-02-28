"""
ai/providers/nvidia_provider.py
────────────────────────────────
Nvidia NIM LLM provider — stub for future implementation.

When ready:
  1. Set NVIDIA_API_KEY in .env
  2. Implement generate() pointing to the NIM endpoint
"""

from typing import List

from app.ai.providers.base_provider import BaseProvider, ProviderError


class NvidiaProvider(BaseProvider):
    """
    Placeholder adapter for Nvidia NIM inference endpoints.
    Uncomment and implement generate() when adding Nvidia NIM support.
    """

    async def generate(self, messages: List[dict], model: str) -> str:
        raise ProviderError(
            "nvidia_nim",
            "Nvidia NIM provider is not yet implemented. "
            "Set NVIDIA_API_KEY and implement NvidiaProvider.generate().",
        )
