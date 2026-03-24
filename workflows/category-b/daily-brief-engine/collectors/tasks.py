"""Collect task state, milestones, and project progress from Cloud SQL."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from typing import Any

import pg8000

logger = logging.getLogger(__name__)


@dataclass
class TaskItem:
    id: str
    title: str
    project_name: str
    priority: str
    due_date: date | None
    status: str
    domain_name: str = ""
    domain_slug: str = ""


@dataclass
class MilestoneItem:
    id: str
    name: str
    project_name: str
    due_date: date | None
    status: str


@dataclass
class ProjectProgress:
    name: str
    slug: str
    total_tasks: int
    done_tasks: int
    status: str
    description: str | None

    @property
    def pct(self) -> int:
        if self.total_tasks == 0:
            return 0
        return int(self.done_tasks / self.total_tasks * 100)


@dataclass
class TaskSnapshot:
    overdue: list[TaskItem] = field(default_factory=list)
    today: list[TaskItem] = field(default_factory=list)
    upcoming_count: int = 0
    upcoming_milestones: list[MilestoneItem] = field(default_factory=list)
    projects: list[ProjectProgress] = field(default_factory=list)
    open_count: int = 0
    done_this_week: int = 0
    zealogics_tasks: list[TaskItem] = field(default_factory=list)
    recent_completions: int = 0  # tasks completed in last 3 days


def _row_to_task(row: tuple, columns: list[str]) -> TaskItem:
    d = dict(zip(columns, row))
    return TaskItem(
        id=str(d["id"]),
        title=d["title"],
        project_name=d.get("project_name", ""),
        priority=d.get("priority", "medium"),
        due_date=d.get("due_date"),
        status=d.get("status", ""),
        domain_name=d.get("domain_name") or "",
        domain_slug=d.get("domain_slug") or "",
    )


def collect(conn: pg8000.Connection) -> TaskSnapshot:
    """Collect all task-related data for the daily brief."""
    snapshot = TaskSnapshot()
    cursor = conn.cursor()

    try:
        # 1. Overdue tasks (with domain info)
        cursor.execute(
            """
            SELECT t.id, t.title, p.name AS project_name, t.priority, t.due_date, t.status,
                   d.name AS domain_name, d.slug AS domain_slug
            FROM tasks t
            JOIN projects p ON p.id = t.project_id
            LEFT JOIN life_domains d ON d.id = t.domain_id
            WHERE t.due_date < CURRENT_DATE
              AND t.status NOT IN ('done', 'cancelled')
            ORDER BY t.priority DESC, t.due_date ASC
            LIMIT 10
            """
        )
        cols = [desc[0] for desc in cursor.description]
        snapshot.overdue = [_row_to_task(r, cols) for r in cursor.fetchall()]

        # 2. Today's tasks (with domain info)
        cursor.execute(
            """
            SELECT t.id, t.title, p.name AS project_name, t.priority, t.due_date, t.status,
                   d.name AS domain_name, d.slug AS domain_slug
            FROM tasks t
            JOIN projects p ON p.id = t.project_id
            LEFT JOIN life_domains d ON d.id = t.domain_id
            WHERE t.due_date = CURRENT_DATE
              AND t.status NOT IN ('done', 'cancelled')
            ORDER BY t.priority DESC
            LIMIT 10
            """
        )
        cols = [desc[0] for desc in cursor.description]
        snapshot.today = [_row_to_task(r, cols) for r in cursor.fetchall()]

        # 3. Upcoming tasks count (next 7 days)
        cursor.execute(
            """
            SELECT COUNT(*) FROM tasks
            WHERE due_date BETWEEN CURRENT_DATE + 1 AND CURRENT_DATE + 7
              AND status NOT IN ('done', 'cancelled')
            """
        )
        snapshot.upcoming_count = cursor.fetchone()[0]

        # 4. Upcoming milestones (next 14 days)
        cursor.execute(
            """
            SELECT m.id, m.name, p.name AS project_name, m.due_date, m.status
            FROM milestones m
            JOIN projects p ON p.id = m.project_id
            WHERE m.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 14
              AND m.status NOT IN ('completed', 'missed')
            ORDER BY m.due_date ASC
            LIMIT 5
            """
        )
        cols = [desc[0] for desc in cursor.description]
        for row in cursor.fetchall():
            d = dict(zip(cols, row))
            snapshot.upcoming_milestones.append(
                MilestoneItem(
                    id=str(d["id"]),
                    name=d["name"],
                    project_name=d.get("project_name", ""),
                    due_date=d.get("due_date"),
                    status=d.get("status", ""),
                )
            )

        # 5. Project progress
        cursor.execute(
            """
            SELECT
                p.name,
                p.slug,
                p.status,
                p.description,
                COUNT(t.id) AS total_tasks,
                COUNT(t.id) FILTER (WHERE t.status = 'done') AS done_tasks
            FROM projects p
            LEFT JOIN tasks t ON t.project_id = p.id
            WHERE p.status NOT IN ('archived', 'completed')
            GROUP BY p.id
            ORDER BY p.name
            """
        )
        cols = [desc[0] for desc in cursor.description]
        for row in cursor.fetchall():
            d = dict(zip(cols, row))
            snapshot.projects.append(
                ProjectProgress(
                    name=d["name"],
                    slug=d["slug"],
                    total_tasks=d["total_tasks"],
                    done_tasks=d["done_tasks"],
                    status=d["status"],
                    description=d.get("description"),
                )
            )

        # 6. Quick stats
        cursor.execute(
            """
            SELECT COUNT(*) FROM tasks
            WHERE status NOT IN ('done', 'cancelled')
            """
        )
        snapshot.open_count = cursor.fetchone()[0]

        cursor.execute(
            """
            SELECT COUNT(*) FROM tasks
            WHERE status = 'done'
              AND completed_at >= date_trunc('week', CURRENT_DATE)
            """
        )
        snapshot.done_this_week = cursor.fetchone()[0]

        # 7. Zealogics domain tasks (domain_number = 11, all active)
        cursor.execute(
            """
            SELECT t.id, t.title, p.name AS project_name, t.priority, t.due_date, t.status,
                   d.name AS domain_name, d.slug AS domain_slug
            FROM tasks t
            JOIN projects p ON p.id = t.project_id
            JOIN life_domains d ON d.id = t.domain_id
            WHERE d.domain_number = 11
              AND t.status NOT IN ('done', 'cancelled')
            ORDER BY
                CASE t.priority
                    WHEN 'urgent' THEN 1 WHEN 'high' THEN 2
                    WHEN 'medium' THEN 3 ELSE 4
                END,
                t.due_date ASC NULLS LAST
            LIMIT 15
            """
        )
        cols = [desc[0] for desc in cursor.description]
        snapshot.zealogics_tasks = [_row_to_task(r, cols) for r in cursor.fetchall()]

        # 8. Tasks completed in last 3 days (for momentum)
        cursor.execute(
            """
            SELECT COUNT(*) FROM tasks
            WHERE status = 'done'
              AND completed_at >= CURRENT_DATE - INTERVAL '3 days'
            """
        )
        snapshot.recent_completions = cursor.fetchone()[0]

    except Exception as exc:
        logger.error("Task collector error: %s", exc)

    return snapshot
