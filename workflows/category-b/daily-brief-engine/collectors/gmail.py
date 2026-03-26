"""Scan Gmail inbox for actionable items from the past 24 hours."""

from __future__ import annotations

import base64
import logging
from dataclasses import dataclass, field
from typing import Any

logger = logging.getLogger(__name__)


@dataclass
class EmailItem:
    sender: str
    subject: str
    snippet: str
    action_hint: str
    category: str  # "ACTION" or "FYI"


@dataclass
class GmailSnapshot:
    action_items: list[EmailItem] = field(default_factory=list)
    fyi_items: list[EmailItem] = field(default_factory=list)
    total_unread: int = 0
    available: bool = True


# ---------------------------------------------------------------------------
# Classification rules
# ---------------------------------------------------------------------------
ACTION_KEYWORDS = [
    "action required", "please review", "sign", "approve", "confirm",
    "payment due", "invoice", "bill", "renewal", "expiring", "deadline",
    "offer letter", "interview", "schedule", "respond", "reply needed",
    "verification", "verify your", "unusual sign-in", "new sign-in",
    "security alert", "urgent", "immediate attention", "time-sensitive",
    "booking confirmation", "reservation", "appointment",
]

SKIP_SENDERS = [
    "noreply@", "no-reply@", "newsletter@", "marketing@",
    "notifications@", "alerts@medium.com", "digest@",
    "notification@", "mailer@", "updates@",
]

# Domains that are always newsletters / marketing platforms — skip entirely
SKIP_DOMAINS = [
    "@substack.com", "@beehiiv.com", "@convertkit.com",
    "@mailchimp.com", "@sendinblue.com", "@mailerlite.com",
    "@campaignmonitor.com", "@constantcontact.com",
    "@iconscout.com", "@canva.com", "@medium.com",
    "@vincimind.com", "@producthunt.com", "@hackernewsletter.com",
    "@tldrnewsletter.com", "@morningbrew.com",
    "@naukri.com", "@linkedin.com", "@quora.com",
]

# Subject / snippet patterns that indicate marketing / newsletter content
SKIP_CONTENT = [
    "introducing ", "just launched", "new feature",
    "here's what changes", "here's what you missed",
    "weekly digest", "monthly digest", "daily digest",
    "top stories", "trending now", "curated for you",
    "unsubscribe", "view in browser", "email preferences",
    "limited time", "exclusive offer", "discount code",
    "free trial", "upgrade now", "don't miss out",
    "the game isn't", "what's new in",
]

FYI_KEYWORDS = [
    "delivery", "shipped", "out for delivery", "tracking",
    "receipt", "order confirmed", "subscription",
    "security alert", "new sign-in", "login from",
]


def _extract_sender(headers: list[dict]) -> str:
    for h in headers:
        if h.get("name", "").lower() == "from":
            value = h.get("value", "")
            # Extract "name <email>" → "email" or just "email"
            if "<" in value:
                email = value.split("<")[-1].rstrip(">").strip()
                name = value.split("<")[0].strip().strip('"')
                return f"{name} <{email}>" if name else email
            return value
    return "unknown"


def _extract_subject(headers: list[dict]) -> str:
    for h in headers:
        if h.get("name", "").lower() == "subject":
            return h.get("value", "(no subject)")
    return "(no subject)"


def _should_skip(sender: str, subject: str = "", snippet: str = "") -> bool:
    sender_lower = sender.lower()
    # Skip by sender prefix (noreply@, newsletter@, etc.)
    if any(skip in sender_lower for skip in SKIP_SENDERS):
        return True
    # Skip by sender domain (substack, iconscout, etc.)
    if any(domain in sender_lower for domain in SKIP_DOMAINS):
        return True
    # Skip by content patterns (marketing / newsletter language)
    text = f"{subject} {snippet}".lower()
    if any(pattern in text for pattern in SKIP_CONTENT):
        return True
    return False


def _classify(subject: str, snippet: str) -> str:
    """Classify as ACTION, FYI, or SKIP."""
    text = f"{subject} {snippet}".lower()
    if any(kw in text for kw in ACTION_KEYWORDS):
        return "ACTION"
    if any(kw in text for kw in FYI_KEYWORDS):
        return "FYI"
    return "FYI"  # Default unread to FYI, not skip


def _extract_action_hint(subject: str, snippet: str) -> str:
    """Generate a one-line hint about what action is needed."""
    text = f"{subject} {snippet}".lower()
    if "offer letter" in text or "review" in text:
        return "Review and respond"
    if "renewal" in text or "expiring" in text:
        return "Check renewal / expiry date"
    if "invoice" in text or "payment" in text or "bill" in text:
        return "Review payment details"
    if "sign" in text and "sign-in" not in text:
        return "Sign document"
    if "verify" in text or "confirm" in text:
        return "Verify / confirm action"
    if "interview" in text or "schedule" in text:
        return "Check schedule and respond"
    if "sign-in" in text or "security alert" in text:
        return "Verify if this was you"
    if "delivery" in text or "shipped" in text:
        return "Delivery update — track status"
    # Fallback: truncate snippet
    return snippet[:80] + "..." if len(snippet) > 80 else snippet


def collect(gmail_service: Any) -> GmailSnapshot:
    """Scan Gmail inbox for actionable items from the past 24 hours."""
    snapshot = GmailSnapshot()

    try:
        query = "is:unread newer_than:1d -category:promotions -category:social -category:forums -category:updates"
        results = (
            gmail_service.users()
            .messages()
            .list(userId="me", q=query, maxResults=30)
            .execute()
        )

        messages = results.get("messages", [])
        snapshot.total_unread = len(messages)

        if not messages:
            return snapshot

        for msg_ref in messages:
            try:
                msg = (
                    gmail_service.users()
                    .messages()
                    .get(
                        userId="me",
                        id=msg_ref["id"],
                        format="metadata",
                        metadataHeaders=["From", "Subject"],
                    )
                    .execute()
                )

                headers = msg.get("payload", {}).get("headers", [])
                sender = _extract_sender(headers)
                subject = _extract_subject(headers)
                snippet = msg.get("snippet", "")

                # Skip known noise senders, domains, and marketing content
                if _should_skip(sender, subject, snippet):
                    continue

                category = _classify(subject, snippet)
                action_hint = _extract_action_hint(subject, snippet)

                item = EmailItem(
                    sender=sender,
                    subject=subject,
                    snippet=snippet,
                    action_hint=action_hint,
                    category=category,
                )

                if category == "ACTION":
                    snapshot.action_items.append(item)
                else:
                    snapshot.fyi_items.append(item)

            except Exception as exc:
                logger.warning("Failed to process message %s: %s", msg_ref.get("id"), exc)
                continue

        # Cap: 5 ACTION + 3 FYI
        snapshot.action_items = snapshot.action_items[:5]
        snapshot.fyi_items = snapshot.fyi_items[:3]

    except Exception as exc:
        logger.error("Gmail collector error: %s", exc)
        snapshot.available = False

    return snapshot
