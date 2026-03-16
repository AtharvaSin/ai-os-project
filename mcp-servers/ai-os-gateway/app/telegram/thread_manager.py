"""Telegram conversation thread manager.

Manages multi-turn conversations stored in bot_conversations table.
Threads auto-close after 30 minutes of inactivity, support eviction-based
summarization when message count exceeds 20, and can be resumed by
keyword overlap detection.
"""

from __future__ import annotations

import asyncio
import json
import logging
import re
from datetime import datetime, timezone, timedelta
from typing import Any

import asyncpg

logger = logging.getLogger(__name__)

# Stop words to exclude from keyword extraction
_STOP_WORDS = {
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "can", "shall", "to", "of", "in", "for",
    "on", "with", "at", "by", "from", "as", "into", "through", "during",
    "before", "after", "above", "below", "between", "out", "off", "over",
    "under", "again", "further", "then", "once", "here", "there", "when",
    "where", "why", "how", "all", "each", "every", "both", "few", "more",
    "most", "other", "some", "such", "no", "nor", "not", "only", "own",
    "same", "so", "than", "too", "very", "just", "and", "but", "or",
    "if", "it", "its", "this", "that", "what", "which", "who", "whom",
    "i", "me", "my", "we", "our", "you", "your", "he", "she", "they",
}

# Stale thread threshold
STALE_MINUTES = 30
MAX_MESSAGES = 20
EVICT_COUNT = 10


def extract_keywords(text: str) -> list[str]:
    """Extract meaningful keywords from text for entity matching."""
    words = re.findall(r"\b[a-z]{3,}\b", text.lower())
    return [w for w in words if w not in _STOP_WORDS]


async def close_stale_threads(pool: asyncpg.Pool) -> int:
    """Batch-close threads inactive for >30 minutes."""
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=STALE_MINUTES)

    async with pool.acquire() as conn:
        result = await conn.execute(
            "UPDATE bot_conversations SET status = 'resolved', resolved_at = now() "
            "WHERE status = 'active' AND last_active_at < $1",
            cutoff,
        )
        # Extract count from "UPDATE N" string
        count = int(result.split()[-1]) if result else 0
        return count


async def get_or_create_thread(
    message_text: str, pool: asyncpg.Pool
) -> tuple[str, bool]:
    """Get an active thread or create a new one.

    Logic:
    1. Close stale threads (>30 min inactive)
    2. Find active thread → reuse
    3. Check keyword overlap with recently resolved threads (24h) → reopen
    4. Create new thread

    Returns:
        (thread_id, is_new)
    """
    await close_stale_threads(pool)
    keywords = extract_keywords(message_text)

    async with pool.acquire() as conn:
        # 1. Find active thread
        active = await conn.fetchrow(
            "SELECT id FROM bot_conversations "
            "WHERE status = 'active' "
            "ORDER BY last_active_at DESC LIMIT 1"
        )
        if active:
            # Update last_active
            await conn.execute(
                "UPDATE bot_conversations SET last_active_at = now() "
                "WHERE id = $1",
                active["id"],
            )
            return str(active["id"]), False

        # 2. Check keyword overlap with recent resolved threads
        if keywords:
            recent = await conn.fetch(
                "SELECT id, context_entities FROM bot_conversations "
                "WHERE status = 'resolved' "
                "AND resolved_at > now() - interval '24 hours' "
                "ORDER BY resolved_at DESC LIMIT 5"
            )
            for thread in recent:
                entities = thread["context_entities"] or []
                overlap = set(keywords) & set(entities)
                if len(overlap) >= 2:  # Require at least 2 keyword matches
                    # Reopen thread
                    await conn.execute(
                        "UPDATE bot_conversations "
                        "SET status = 'active', resolved_at = NULL, last_active_at = now() "
                        "WHERE id = $1",
                        thread["id"],
                    )
                    return str(thread["id"]), False

        # 3. Create new thread
        thread_id = await conn.fetchval(
            "INSERT INTO bot_conversations (status, context_entities) "
            "VALUES ('active', $1) RETURNING id",
            keywords[:20],  # Cap stored keywords
        )
        return str(thread_id), True


async def append_message(
    thread_id: str, role: str, content: str, pool: asyncpg.Pool
) -> None:
    """Append a message to the thread's JSONB messages array.

    If messages exceed MAX_MESSAGES, evict oldest EVICT_COUNT with
    Claude Haiku summarization.
    """
    message = {
        "role": role,
        "content": content,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    async with pool.acquire() as conn:
        # Append message
        await conn.execute(
            "UPDATE bot_conversations "
            "SET messages = messages || $1::jsonb, last_active_at = now() "
            "WHERE id = $2::uuid",
            json.dumps([message]),
            thread_id,
        )

        # Check message count
        row = await conn.fetchrow(
            "SELECT jsonb_array_length(messages) as count, messages, thread_summary "
            "FROM bot_conversations WHERE id = $1::uuid",
            thread_id,
        )

        if row and row["count"] > MAX_MESSAGES:
            await _evict_messages(thread_id, row["messages"], row["thread_summary"], conn)


async def _evict_messages(
    thread_id: str, messages: list, existing_summary: str | None, conn
) -> None:
    """Evict oldest messages and summarize them via Claude Haiku."""
    old_messages = messages[:EVICT_COUNT]
    remaining = messages[EVICT_COUNT:]

    # Build summary of evicted messages
    summary_text = ""
    try:
        import anthropic

        old_text = "\n".join(
            f"{m.get('role', 'user')}: {m.get('content', '')}" for m in old_messages
        )

        prompt = f"Summarize this conversation context in 2-3 sentences:\n\n{old_text}"
        if existing_summary:
            prompt = f"Previous context: {existing_summary}\n\n{prompt}"

        result = await asyncio.to_thread(
            _call_haiku_sync, prompt
        )
        summary_text = result
    except Exception as exc:
        logger.warning("Haiku summarization failed: %s", exc)
        # Fallback: simple concatenation
        summary_text = existing_summary or ""
        summary_text += " " + "; ".join(
            m.get("content", "")[:50] for m in old_messages
        )

    # Update thread
    await conn.execute(
        "UPDATE bot_conversations "
        "SET messages = $1::jsonb, thread_summary = $2 "
        "WHERE id = $3::uuid",
        json.dumps(remaining),
        summary_text[:2000],
        thread_id,
    )


def _call_haiku_sync(prompt: str) -> str:
    """Synchronous Claude Haiku call (run via asyncio.to_thread)."""
    import anthropic
    import os

    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.content[0].text


async def get_thread_context(thread_id: str, pool: asyncpg.Pool) -> list[dict[str, str]]:
    """Build Claude API messages array from thread history.

    Prepends thread_summary as a system-like context message if available.
    """
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT messages, thread_summary FROM bot_conversations "
            "WHERE id = $1::uuid",
            thread_id,
        )

    if not row:
        return []

    api_messages: list[dict[str, str]] = []
    messages = row["messages"] or []
    summary = row["thread_summary"]

    # Prepend summary as context
    if summary:
        api_messages.append({
            "role": "user",
            "content": f"[Previous conversation context: {summary}]",
        })
        api_messages.append({
            "role": "assistant",
            "content": "I have the context from our previous conversation. How can I help?",
        })

    # Add recent messages
    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role in ("user", "assistant") and content:
            api_messages.append({"role": role, "content": content})

    return api_messages


async def detect_topic(thread_id: str, pool: asyncpg.Pool) -> str | None:
    """Auto-detect conversation topic via Claude Haiku."""
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT messages FROM bot_conversations WHERE id = $1::uuid",
            thread_id,
        )

    if not row or not row["messages"]:
        return None

    messages = row["messages"]
    # Use first few messages for topic detection
    text = "\n".join(
        m.get("content", "")[:100] for m in messages[:5]
    )

    try:
        topic = await asyncio.to_thread(
            _call_haiku_sync,
            f"In 3-5 words, what is this conversation about?\n\n{text}",
        )
        topic = topic.strip()[:100]

        async with pool.acquire() as conn:
            await conn.execute(
                "UPDATE bot_conversations SET topic = $1 WHERE id = $2::uuid",
                topic, thread_id,
            )
        return topic
    except Exception:
        return None


async def resume_thread(short_id: str, pool: asyncpg.Pool) -> str | None:
    """Reopen a resolved thread by short ID."""
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id FROM bot_conversations "
            "WHERE status = 'resolved' "
            "AND replace(id::text, '-', '') LIKE $1 || '%'",
            short_id,
        )

        if not rows:
            return None

        thread_id = rows[0]["id"]
        await conn.execute(
            "UPDATE bot_conversations "
            "SET status = 'active', resolved_at = NULL, last_active_at = now() "
            "WHERE id = $1",
            thread_id,
        )
        return str(thread_id)
