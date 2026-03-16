"""Risk Engine — Category B Pipeline.

Runs daily at 06:30 IST via Cloud Scheduler. Computes 5 risk types,
writes risk_alerts to Cloud SQL, and sends Telegram for high/critical.

Entry point: main(request)
Deployment: Cloud Run, python3.12, asia-south1
Service account: ai-os-cloud-functions@ai-operating-system-490208.iam.gserviceaccount.com
"""

import os
import uuid
import json
from datetime import datetime, timezone, timedelta

import functions_framework
import pg8000
import requests


def get_connection():
    """Connect to Cloud SQL via Auth Proxy sidecar Unix socket (Cloud Run)
    or TCP localhost (local dev with cloud-sql-proxy)."""
    instance = os.getenv(
        "DB_INSTANCE", "bharatvarsh-website:us-central1:bharatvarsh-db"
    )
    unix_sock = f"/cloudsql/{instance}/.s.PGSQL.5432"

    # Try Unix socket first (Cloud Run with Auth Proxy sidecar)
    if os.path.exists(f"/cloudsql/{instance}"):
        return pg8000.connect(
            user=os.getenv("DB_USER", "ai_os_admin"),
            password=os.getenv("DB_PASSWORD", ""),
            database=os.getenv("DB_NAME", "ai_os"),
            unix_sock=unix_sock,
        )
    # Fallback to TCP localhost (local dev with cloud-sql-proxy)
    return pg8000.connect(
        user=os.getenv("DB_USER", "ai_os_admin"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "ai_os"),
        host="127.0.0.1",
        port=5432,
    )


def send_telegram_alert(title, severity, project_name, description, dashboard_url):
    """Send risk alert via Telegram Bot API for high/critical severity."""
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    chat_id = os.getenv("TELEGRAM_CHAT_ID")
    if not token or not chat_id:
        return

    severity_emoji = {"critical": "\U0001f534", "high": "\U0001f7e0"}.get(
        severity, "\U0001f7e1"
    )

    text = (
        f"{severity_emoji} *AI OS Risk Alert*\n\n"
        f"*{title}*\n"
        f"Severity: {severity_emoji} {severity.upper()}\n"
        f"Project: {project_name}\n\n"
        f"{description}\n\n"
        f"\u2192 [Dashboard]({dashboard_url}/risks)"
    )

    try:
        requests.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json={
                "chat_id": chat_id,
                "text": text,
                "parse_mode": "Markdown",
                "disable_web_page_preview": True,
            },
            timeout=10,
        )
    except Exception:
        pass  # Don't fail the pipeline for notification errors


def insert_alert(
    cursor,
    conn,
    project_id,
    alert_type,
    severity,
    title,
    description,
    affected_tasks,
    affected_milestones,
    score,
    metadata,
):
    """Insert a risk alert and return the inserted row ID."""
    alert_id = str(uuid.uuid4())
    cursor.execute(
        """INSERT INTO risk_alerts
           (id, project_id, alert_type, severity, title, description,
            affected_tasks, affected_milestones, score, metadata)
           VALUES (%s, %s, %s::risk_alert_type, %s::risk_severity, %s, %s,
                   %s, %s, %s, %s)""",
        (
            alert_id,
            str(project_id),
            alert_type,
            severity,
            title,
            description,
            affected_tasks,
            affected_milestones,
            score,
            json.dumps(metadata) if metadata else "{}",
        ),
    )
    conn.commit()
    return alert_id


def compute_overdue_clusters(cursor, conn):
    """TYPE 1: Group overdue tasks by project, compute weighted severity score."""
    alerts_created = 0
    cursor.execute("""
        SELECT p.id AS project_id, p.name AS project_name,
               COUNT(*) AS overdue_count,
               SUM(CASE t.priority
                   WHEN 'urgent' THEN 4
                   WHEN 'high' THEN 3
                   WHEN 'medium' THEN 2
                   ELSE 1 END) AS weighted_score,
               array_agg(t.id) AS task_ids
        FROM tasks t
        JOIN projects p ON t.project_id = p.id
        WHERE t.due_date < CURRENT_DATE
          AND t.status NOT IN ('done', 'cancelled')
          AND p.status = 'active'
        GROUP BY p.id, p.name
        HAVING COUNT(*) > 0
    """)
    rows = cursor.fetchall()
    cols = [desc[0] for desc in cursor.description]

    for row in [dict(zip(cols, r)) for r in rows]:
        score = float(row["weighted_score"])
        if score > 10:
            severity = "critical"
        elif score > 5:
            severity = "high"
        elif score > 2:
            severity = "medium"
        else:
            severity = "low"

        task_ids = [str(t) for t in (row["task_ids"] or [])]
        title = f"{row['overdue_count']} overdue tasks in {row['project_name']}"
        desc = (
            f"Weighted risk score: {score:.0f}. "
            f"{row['overdue_count']} tasks are past their due date."
        )

        insert_alert(
            cursor,
            conn,
            row["project_id"],
            "overdue_cluster",
            severity,
            title,
            desc,
            task_ids,
            [],
            score,
            {"overdue_count": row["overdue_count"]},
        )
        alerts_created += 1
    return alerts_created


def compute_velocity_decline(cursor, conn):
    """TYPE 2: Compare last-7-day vs previous-7-day task completion counts."""
    alerts_created = 0
    cursor.execute("""
        WITH recent AS (
            SELECT project_id, COUNT(*) AS cnt
            FROM tasks
            WHERE completed_at >= CURRENT_DATE - INTERVAL '7 days'
              AND status = 'done'
            GROUP BY project_id
        ),
        prior AS (
            SELECT project_id, COUNT(*) AS cnt
            FROM tasks
            WHERE completed_at >= CURRENT_DATE - INTERVAL '14 days'
              AND completed_at < CURRENT_DATE - INTERVAL '7 days'
              AND status = 'done'
            GROUP BY project_id
        )
        SELECT p.id AS project_id, p.name AS project_name,
               COALESCE(prior.cnt, 0) AS prior_count,
               COALESCE(recent.cnt, 0) AS recent_count
        FROM projects p
        LEFT JOIN recent ON recent.project_id = p.id
        LEFT JOIN prior ON prior.project_id = p.id
        WHERE p.status = 'active'
          AND COALESCE(prior.cnt, 0) > 0
    """)
    rows = cursor.fetchall()
    cols = [desc[0] for desc in cursor.description]

    for row in [dict(zip(cols, r)) for r in rows]:
        prior = int(row["prior_count"])
        recent = int(row["recent_count"])
        if prior == 0:
            continue

        decline_pct = ((prior - recent) / prior) * 100
        if decline_pct < 25:
            continue

        if decline_pct > 75:
            severity = "critical"
        elif decline_pct > 50:
            severity = "high"
        else:
            severity = "medium"

        title = f"Velocity declined {decline_pct:.0f}% in {row['project_name']}"
        desc = f"Completed {recent} tasks this week vs {prior} last week."

        insert_alert(
            cursor,
            conn,
            row["project_id"],
            "velocity_decline",
            severity,
            title,
            desc,
            [],
            [],
            decline_pct,
            {
                "prior_count": prior,
                "recent_count": recent,
                "decline_pct": round(decline_pct, 1),
            },
        )
        alerts_created += 1
    return alerts_created


def compute_milestone_slips(cursor, conn):
    """TYPE 3: Flag milestones where >50% of tasks are blocked or overdue."""
    alerts_created = 0
    cursor.execute("""
        SELECT m.id AS milestone_id, m.name AS milestone_name,
               m.due_date, m.project_id,
               p.name AS project_name,
               COUNT(*) AS total_tasks,
               COUNT(*) FILTER (
                   WHERE t.status = 'blocked'
                   OR (t.due_date < CURRENT_DATE
                       AND t.status NOT IN ('done','cancelled'))
               ) AS at_risk_tasks
        FROM milestones m
        JOIN projects p ON m.project_id = p.id
        JOIN tasks t ON t.milestone_id = m.id
        WHERE m.status IN ('pending', 'in_progress')
          AND p.status = 'active'
        GROUP BY m.id, m.name, m.due_date, m.project_id, p.name
        HAVING COUNT(*) > 0
    """)
    rows = cursor.fetchall()
    cols = [desc[0] for desc in cursor.description]

    for row in [dict(zip(cols, r)) for r in rows]:
        total = int(row["total_tasks"])
        at_risk = int(row["at_risk_tasks"])
        if total == 0:
            continue

        risk_pct = (at_risk / total) * 100
        if risk_pct < 50:
            continue

        due_soon = False
        if row["due_date"]:
            days_until = (
                row["due_date"] - datetime.now(timezone.utc).date()
            ).days
            due_soon = days_until <= 7

        if risk_pct > 75 and due_soon:
            severity = "critical"
        elif risk_pct > 75:
            severity = "high"
        else:
            severity = "medium"

        title = (
            f"Milestone '{row['milestone_name']}' at risk "
            f"({risk_pct:.0f}% tasks blocked/overdue)"
        )
        desc = (
            f"{at_risk}/{total} tasks are blocked or overdue "
            f"in {row['project_name']}."
        )

        insert_alert(
            cursor,
            conn,
            row["project_id"],
            "milestone_slip",
            severity,
            title,
            desc,
            [],
            [str(row["milestone_id"])],
            risk_pct,
            {
                "at_risk_tasks": at_risk,
                "total_tasks": total,
                "risk_pct": round(risk_pct, 1),
            },
        )
        alerts_created += 1
    return alerts_created


def compute_dependency_chains(cursor, conn):
    """TYPE 4: Find blocked tasks whose milestones have downstream pending milestones."""
    alerts_created = 0
    cursor.execute("""
        WITH blocked_tasks AS (
            SELECT t.id AS task_id, t.title AS task_title,
                   t.milestone_id, t.project_id,
                   m.phase_id, p.name AS project_name
            FROM tasks t
            JOIN milestones m ON t.milestone_id = m.id
            JOIN projects p ON t.project_id = p.id
            WHERE t.status = 'blocked'
              AND p.status = 'active'
        ),
        downstream AS (
            SELECT bt.project_id, bt.project_name, bt.task_id,
                   COUNT(DISTINCT dm.id) AS downstream_milestone_count
            FROM blocked_tasks bt
            JOIN project_phases pp ON bt.phase_id = pp.id
            JOIN project_phases dp ON dp.project_id = bt.project_id
                                  AND dp.sort_order > pp.sort_order
            JOIN milestones dm ON dm.phase_id = dp.id
                              AND dm.status IN ('pending', 'in_progress')
            GROUP BY bt.project_id, bt.project_name, bt.task_id
        )
        SELECT project_id, project_name,
               array_agg(task_id) AS blocked_task_ids,
               MAX(downstream_milestone_count) AS max_downstream
        FROM downstream
        GROUP BY project_id, project_name
    """)
    rows = cursor.fetchall()
    cols = [desc[0] for desc in cursor.description]

    for row in [dict(zip(cols, r)) for r in rows]:
        downstream = int(row["max_downstream"])
        if downstream == 0:
            continue

        if downstream > 3:
            severity = "critical"
        elif downstream > 1:
            severity = "high"
        else:
            severity = "medium"

        task_ids = [str(t) for t in (row["blocked_task_ids"] or [])]
        title = (
            f"Blocked tasks affecting {downstream} downstream "
            f"milestones in {row['project_name']}"
        )
        desc = (
            f"{len(task_ids)} blocked tasks may delay "
            f"{downstream} pending milestones."
        )

        insert_alert(
            cursor,
            conn,
            row["project_id"],
            "dependency_chain",
            severity,
            title,
            desc,
            task_ids,
            [],
            float(downstream),
            {
                "blocked_count": len(task_ids),
                "downstream_milestones": downstream,
            },
        )
        alerts_created += 1
    return alerts_created


def compute_stale_projects(cursor, conn):
    """TYPE 5: Flag active projects with no task activity in 14+ days."""
    alerts_created = 0
    cursor.execute("""
        SELECT p.id AS project_id, p.name AS project_name,
               MAX(GREATEST(
                   COALESCE(t.updated_at, p.created_at),
                   COALESCE(t.completed_at, p.created_at)
               )) AS last_activity
        FROM projects p
        LEFT JOIN tasks t ON t.project_id = p.id
        WHERE p.status = 'active'
        GROUP BY p.id, p.name
        HAVING MAX(GREATEST(
            COALESCE(t.updated_at, p.created_at),
            COALESCE(t.completed_at, p.created_at)
        )) < CURRENT_DATE - INTERVAL '14 days'
    """)
    rows = cursor.fetchall()
    cols = [desc[0] for desc in cursor.description]

    for row in [dict(zip(cols, r)) for r in rows]:
        last = row["last_activity"]
        if not last:
            continue

        if hasattr(last, "date"):
            days_inactive = (
                datetime.now(timezone.utc).date() - last.date()
            ).days
        else:
            days_inactive = (datetime.now(timezone.utc).date() - last).days

        if days_inactive > 30:
            severity = "critical"
        elif days_inactive > 21:
            severity = "high"
        elif days_inactive > 14:
            severity = "medium"
        else:
            continue

        title = (
            f"{row['project_name']} has been inactive "
            f"for {days_inactive} days"
        )
        desc = f"No task updates or completions since {last}."

        insert_alert(
            cursor,
            conn,
            row["project_id"],
            "stale_project",
            severity,
            title,
            desc,
            [],
            [],
            float(days_inactive),
            {"days_inactive": days_inactive, "last_activity": str(last)},
        )
        alerts_created += 1
    return alerts_created


@functions_framework.http
def main(request):
    """Entry point for the Risk Engine Cloud Run service."""
    start_time = datetime.now(timezone.utc)
    dashboard_url = os.getenv(
        "DASHBOARD_URL",
        "https://ai-os-dashboard-sv4fbx5yna-el.a.run.app",
    )
    results = {}
    errors = []
    total_alerts = 0

    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Clear today's existing alerts (idempotent re-runs)
        cursor.execute(
            "DELETE FROM risk_alerts "
            "WHERE created_at::date = CURRENT_DATE AND is_resolved = false"
        )
        conn.commit()

        # Run all 5 risk computations
        computations = [
            ("overdue_cluster", compute_overdue_clusters),
            ("velocity_decline", compute_velocity_decline),
            ("milestone_slip", compute_milestone_slips),
            ("dependency_chain", compute_dependency_chains),
            ("stale_project", compute_stale_projects),
        ]

        for name, func in computations:
            try:
                count = func(cursor, conn)
                results[name] = count
                total_alerts += count
            except Exception as e:
                errors.append(f"{name}: {str(e)}")
                results[name] = f"error: {str(e)}"

        # Send Telegram for high/critical alerts created today
        cursor.execute("""
            SELECT ra.title, ra.severity::text, ra.description,
                   p.name AS project_name
            FROM risk_alerts ra
            JOIN projects p ON ra.project_id = p.id
            WHERE ra.created_at::date = CURRENT_DATE
              AND ra.severity::text IN ('high', 'critical')
              AND ra.is_resolved = false
        """)
        alert_rows = cursor.fetchall()
        alert_cols = [desc[0] for desc in cursor.description]
        for alert in [dict(zip(alert_cols, r)) for r in alert_rows]:
            send_telegram_alert(
                alert["title"],
                alert["severity"],
                alert["project_name"],
                alert["description"] or "",
                dashboard_url,
            )

        # Log pipeline run
        duration_ms = int(
            (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
        )
        run_id = str(uuid.uuid4())
        status = "success" if not errors else "failed"
        summary = f"Alerts created: {total_alerts}. {json.dumps(results)}"
        error_msg = "; ".join(errors) if errors else None

        cursor.execute(
            "SELECT id FROM pipelines WHERE slug = %s",
            ("risk-engine-daily",),
        )
        pipeline_row = cursor.fetchone()
        if pipeline_row:
            cursor.execute(
                """INSERT INTO pipeline_runs
                   (id, pipeline_id, status, trigger_type, triggered_by,
                    started_at, completed_at, duration_ms,
                    output_summary, error_message)
                   VALUES (%s, %s, %s, %s, %s, %s, NOW(), %s, %s, %s)""",
                (
                    run_id,
                    str(pipeline_row[0]),
                    status,
                    "scheduled",
                    "cloud-scheduler",
                    start_time.isoformat(),
                    duration_ms,
                    summary,
                    error_msg,
                ),
            )
            conn.commit()

        cursor.close()
        conn.close()

    except Exception as e:
        return {"error": str(e), "results": results}, 500

    return {
        "status": "success" if not errors else "partial_failure",
        "total_alerts": total_alerts,
        "results": results,
        "errors": errors,
        "duration_ms": int(
            (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
        ),
    }
