"""services/llm_provider.py
===========================
Unified interface for sending prompts to different LLM providers. By funnelling
all outbound calls through a single helper we keep provider-specific details
isolated, which simplifies swapping vendors or adding retries in the future.
"""

from __future__ import annotations

from typing import Literal

import httpx
from loguru import logger

from settings import settings

ProviderName = Literal["openai", "openrouter", "gemini"]


class LLMProviderError(RuntimeError):
    """Raised when an upstream LLM provider returns an error response."""


async def _post_chat_completion(url: str, headers: dict[str, str], model: str, prompt: str, temperature: float) -> str:
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature,
    }
    async with httpx.AsyncClient(timeout=40) as client:
        response = await client.post(url, headers=headers, json=payload)
        if response.status_code >= 400:
            logger.error("LLM provider error %s: %s", response.status_code, response.text)
            raise LLMProviderError(
                f"Provider responded with status {response.status_code}: {response.text}"
            )
        data = response.json()
    try:
        return data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:  # pragma: no cover - defensive guard
        logger.error("Unexpected response format from provider: %s", data)
        raise LLMProviderError("Invalid response structure from provider") from exc


async def generate_answer(provider: str, model: str, prompt: str, temperature: float = 0.1) -> str:
    """Send a prompt to a configured LLM provider and return the raw text answer."""

    provider_normalized = provider.lower().strip()
    if provider_normalized == "openai":
        if not settings.openai_api_key:
            raise LLMProviderError("OPENAI_API_KEY is not configured")
        headers = {
            "Authorization": f"Bearer {settings.openai_api_key}",
            "Content-Type": "application/json",
        }
        return await _post_chat_completion(
            "https://api.openai.com/v1/chat/completions", headers, model, prompt, temperature
        )

    if provider_normalized == "openrouter":
        if not settings.openrouter_api_key:
            raise LLMProviderError("OPENROUTER_API_KEY is not configured")
        headers = {
            "Authorization": f"Bearer {settings.openrouter_api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://openrouter.ai",  # helps with provider telemetry
        }
        return await _post_chat_completion(
            "https://openrouter.ai/api/v1/chat/completions", headers, model, prompt, temperature
        )

    if provider_normalized == "gemini":
        # Stub for future Gemini support
        return "NotImplemented"

    raise ValueError(f"Unsupported provider: {provider}")
