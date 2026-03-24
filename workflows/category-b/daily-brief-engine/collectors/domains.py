"""Collect Life Graph domain health and 3-day activity momentum from Cloud SQL."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import date

import pg8000

logger = logging.getLogger(__name__)


@dataclass
class DomainHealth:
    slug: str
    name: str
    domain_number: int | None
    health_score: float | None  # 0-100 from domain_health_snapshots
    velocity_7d: int | None  # tasks completed in last 7 days
    days_since_activity: int | None
    active_tasks: int = 0
    overdue_tasks: int = 0


@dataclass
class DomainActivity:
    """Per-domain activity over the last 3 days."""

    slug: str
    name: str
    completed_3d: int = 0  # tasks completed in last 3 days
    created_3d: int = 0  # tasks created in last 3 days
    active_count: int = 0


@dataclass
class DomainsSnapshot:
    health: list[DomainHealth] = field(default_factory=list)
    activity: list[DomainActivity] = field(default_factory=list)
    total_active_domains: int = 0
    domains_needing_attention: list[str] = field(default_factory=list)  # slugs with low health
    available: bool = True


def collect(conn: pg8000.Connection) -> DomainsSnapshot:
    """Collect domain health scores and 3-day activity trends."""
    snapshot = DomainsSnapshot()
    cursor = conn.cursor()

    try:
        # 1. Domain health — latest snapshot per active numbered domain
        cursor.execute(
            """
            SELECT
                d.slug,
                d.name,
                d.domain_number,
                dhs.health_score,
                dhs.velocity_7d,
                dhs.days_since_activity,
                (SELECT COUNT(*) FROM tasks t
                 WHERE t.domain_id = d.id AND t.status NOT IN ('done', 'cancelled'))::int AS active_tasks,
                (SELECT COUNT(*) FROM tasks t
                 WHERE t.domain_id = d.id AND t.status NOT IN ('done', 'cancelled')
                   AND t.due_date < CURRENT_DATE)::int AS overdue_tasks
            FROM life_domains d
            LEFT JOIN LATERAL (
                SELECT s.health_score, s.velocity_7d, s.days_since_activity
                FROM domain_health_snapshots s
                WHERE s.domain_id = d.id
                ORDER BY s.snapshot_date DESC
                LIMIT 1
            ) dhs ON TRUE
            WHERE d.status = 'active'
              AND d.domain_number IS NOT NULL
            ORDER BY d.domain_number
            """
        )
        cols = [desc[0] for desc in cursor.description]
        for row in cursor.fetchall():
            d = dict(zip(cols, row))
            health = DomainHealth(
                slug=d["slug"],
                name=d["name"],
                domain_number=d.get("domain_number"),
                health_score=float(d["health_score"]) if d.get("health_score") is not None else None,
                velocity_7d=d.get("velocity_7d"),
                days_since_activity=d.get("days_since_activity"),
                active_tasks=d.get("active_tasks", 0),
                overdue_tasks=d.get("overdue_tasks", 0),
            )
            snapshot.health.append(health)

            # Flag domains needing attention: low health or high overdue
            if (health.health_score is not None and health.health_score < 40) or health.overdue_tasks >= 3:
                snapshot.domains_needing_attention.append(health.name)

        snapshot.total_active_domains = len(snapshot.health)

        # 2. Per-domain 3-day activity (completed + created)
        cursor.execute(
            """
            SELECT
                d.slug,
                d.name,
                (SELECT COUNT(*) FROM tasks t
                 WHERE t.domain_id = d.id AND t.status = 'done'
                   AND t.completed_at >= CURRENT_DATE - INTERVAL '3 days')::int AS completed_3d,
                (SELECT COUNT(*) FROM tasks t
                 WHERE t.domain_id = d.id
                   AND t.created_at >= CURRENT_DATE - INTERVAL '3 days')::int AS created_3d,
                (SELECT COUNT(*) FROM tasks t
                 WHERE t.domain_id = d.id
                   AND t.status NOT IN ('done', 'cancelled'))::int AS active_count
            FROM life_domains d
            WHERE d.status = 'active'
              AND d.domain_number IS NOT NULL
            ORDER BY d.domain_number
            """
        )
        cols = [desc[0] for desc in cursor.description]
        for row in cursor.fetchall():
            d = dict(zip(cols, row))
            snapshot.activity.append(
                DomainActivity(
                    slug=d["slug"],
                    name=d["name"],
                    completed_3d=d.get("completed_3d", 0),
                    created_3d=d.get("created_3d", 0),
                    active_count=d.get("active_count", 0),
                )
            )

    except Exception as exc:
        logger.error("Domain collector error: %s", exc)
        snapshot.available = False

    return snapshot
