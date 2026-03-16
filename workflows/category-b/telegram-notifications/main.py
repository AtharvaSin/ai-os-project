"""Telegram Notifications Cloud Run Service — Category B Pipeline.

Sends structured notifications to the AI OS Telegram bot.
3 notification types triggered by Cloud Scheduler:
  - morning_brief (6:30 AM IST daily)
  - overdue_alert (9:00 AM IST daily)
  - weekly_digest (Sunday 7 PM IST)

Entry point: main(request)
Deployment: Cloud Run, python312, asia-south1
Service account: ai-os-cloud-run@ai-operating-system-490208.iam.gserviceaccount.com
"""

import json
import os
import uuid
from datetime import datetime, timezone, date

import functions_framework
import httpx
import pg8000


def get_connection():
    """Connect to Cloud SQL via Auth Proxy sidecar Unix socket (Cloud Run)
    or TCP localhost (local dev with cloud-sql-proxy)."""
    instance = os.getenv(
        "DB_INSTANCE", "bharatvarsh-website:us-central1:bharatvarsh-db"
    )
    unix_sock = f"/cloudsql/{instance}/.s.PGSQL.5432"

    if os.path.exists(f"/cloudsql/{instance}"):
        return pg8000.connect(
            user=os.getenv("DB_USER", "ai_os_admin"),
            password=os.getenv("DB_PASSWORD", os.getenv("AI_OS_DB_PASSWORD", "")),
            database=os.getenv("DB_NAME", "ai_os"),
            unix_sock=unix_sock,
        )
    return pg8000.connect(
        user=os.getenv("DB_USER", "ai_os_admin"),
        password=os.getenv("DB_PASSWORD", os.getenv("AI_OS_DB_PASSWORD", "")),
        database=os.getenv("DB_NAME", "ai_os"),
        host="127.0.0.1",
        port=5432,
    )


def get_secret(name: str) -> str:
    """Get a secret from env (Cloud Run injects via --set-secrets)."""
    value = os.getenv(name, "")
    if not value:
        try:
            from google.cloud import secretmanager
            client = secretmanager.SecretManagerServiceClient()
            secret_name = f"projects/ai-operating-system-490208/secrets/{name}/versions/latest"
            response = client.access_secret_version(request={"name": secret_name})
            value = response.payload.data.decode("utf-8")
        except Exception:
            pass
    return value


def send_telegram(text, parse_mode="MarkdownV2", reply_markup=None):
    """Send a message to the AI OS Telegram bot."""
    token = get_secret("TELEGRAM_BOT_TOKEN")
    chat_id = get_secret("TELEGRAM_CHAT_ID")
    url = f"https://api.telegram.org/bot{token}/sendMessage"

    payload = {"chat_id": chat_id, "text": text}
    if parse_mode:
        payload["parse_mode"] = parse_mode
    if reply_markup:
        payload["reply_markup"] = reply_markup

    with httpx.Client(timeout=30.0) as client:
        resp = client.post(url, json=payload)
        result = resp.json()

    # Fallback to plain text if MarkdownV2 fails
    if not result.get("ok") and parse_mode:
        payload.pop("parse_mode", None)
        payload["text"] = text.replace("\\", "")
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(url, json=payload)
            result = resp.json()

    return result


def escape_md(text):
    """Escape MarkdownV2 special characters."""
    import re
    return re.sub(r"([_*\[\]()~`>#+\-=|{}.!\\])", r"\\\1", str(text))


def log_notification(conn, cursor, notification_type, message_preview, telegram_message_id=None):
    """Log notification to notification_log table."""
    chat_id = get_secret("TELEGRAM_CHAT_ID")
    cursor.execute(
        "INSERT INTO notification_log (id, channel, notification_type, recipient, "
        "message_preview, telegram_message_id, metadata) "
        "VALUES (%s, 'telegram', %s, %s, %s, %s, %s::jsonb)",
        (
            str(uuid.uuid4()),
            notification_type,
            chat_id,
            message_preview[:200] if message_preview else None,
            telegram_message_id,
            json.dumps({"source": "telegram-notifications-service"}),
        ),
    )
    conn.commit()


def morning_brief(conn, cursor):
    """Generate and send the morning brief."""
    # Today's tasks
    cursor.execute(
        "SELECT t.id, t.title, t.priority, t.status, t.due_date, p.name as project_name "
        "FROM tasks t JOIN projects p ON t.project_id = p.id "
        "WHERE t.due_date = CURRENT_DATE AND t.status != 'done' "
        "ORDER BY t.priority DESC"
    )
    columns = [desc[0] for desc in cursor.description]
    today_tasks = [dict(zip(columns, row)) for row in cursor.fetchall()]

    # Overdue tasks
    cursor.execute(
        "SELECT t.id, t.title, t.priority, t.due_date, p.name as project_name "
        "FROM tasks t JOIN projects p ON t.project_id = p.id "
        "WHERE t.due_date < CURRENT_DATE AND t.status NOT IN ('done', 'cancelled') "
        "ORDER BY t.due_date ASC"
    )
    columns = [desc[0] for desc in cursor.description]
    overdue_tasks = [dict(zip(columns, row)) for row in cursor.fetchall()]

    # Upcoming milestones (7 days)
    cursor.execute(
        "SELECT m.name, m.due_date, p.name as project_name "
        "FROM milestones m JOIN projects p ON m.project_id = p.id "
        "WHERE m.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7 "
        "AND m.status != 'completed' ORDER BY m.due_date"
    )
    columns = [desc[0] for desc in cursor.description]
    milestones = [dict(zip(columns, row)) for row in cursor.fetchall()]

    # Quick stats
    cursor.execute(
        "SELECT COUNT(*) FILTER (WHERE status NOT IN ('done', 'cancelled')) as open_tasks, "
        "COUNT(*) FILTER (WHERE status = 'done' AND completed_at >= CURRENT_DATE - 7) as done_week "
        "FROM tasks"
    )
    stats_row = cursor.fetchone()
    open_tasks = stats_row[0] if stats_row else 0
    done_week = stats_row[1] if stats_row else 0

    # Build message
    lines = [f"*{escape_md('☀️ Morning Brief')}*", ""]

    if overdue_tasks:
        lines.append(f"*{escape_md(f'⚠️ Overdue ({len(overdue_tasks)})')}*")
        for t in overdue_tasks[:5]:
            sid = str(t["id"])[:8]
            picon = {"urgent": "🔴", "high": "🟠", "medium": "🟡", "low": "🟢"}.get(
                t.get("priority", "medium"), "⚪"
            )
            due = t.get("due_date")
            due_str = due.strftime("%b %d") if isinstance(due, (date, datetime)) else str(due)[:10]
            lines.append(
                f"{picon} `{sid}` *{escape_md(t['title'])}* \\| {escape_md(due_str)}"
            )
        if len(overdue_tasks) > 5:
            lines.append(escape_md(f"  ...and {len(overdue_tasks) - 5} more"))
        lines.append("")

    if today_tasks:
        lines.append(f"*{escape_md(f'📅 Today ({len(today_tasks)})')}*")
        for t in today_tasks[:8]:
            sid = str(t["id"])[:8]
            picon = {"urgent": "🔴", "high": "🟠", "medium": "🟡", "low": "🟢"}.get(
                t.get("priority", "medium"), "⚪"
            )
            lines.append(f"{picon} `{sid}` *{escape_md(t['title'])}*")
        lines.append("")
    else:
        lines.append(escape_md("📅 No tasks due today"))
        lines.append("")

    if milestones:
        lines.append(f"*{escape_md('🎯 Milestones This Week')}*")
        for m in milestones[:3]:
            due = m["due_date"]
            due_str = due.strftime("%b %d") if isinstance(due, (date, datetime)) else str(due)[:10]
            lines.append(
                f"  {escape_md('•')} *{escape_md(m['name'])}* "
                f"\\({escape_md(m['project_name'])}\\) \\- {escape_md(due_str)}"
            )
        lines.append("")

    lines.append(
        escape_md(f"📊 {open_tasks} open tasks | {done_week} completed this week")
    )

    text = "\n".join(lines)

    # Inline keyboard
    keyboard = {
        "inline_keyboard": [
            [
                {"text": "📊 Status", "callback_data": "cmd:status"},
                {"text": "➕ Add task", "callback_data": "prompt:Add a task"},
            ]
        ]
    }

    result = send_telegram(text, reply_markup=keyboard)
    msg_id = result.get("result", {}).get("message_id")
    log_notification(conn, cursor, "morning_brief", text[:200], msg_id)

    return {"tasks_today": len(today_tasks), "overdue": len(overdue_tasks)}


def overdue_alert(conn, cursor):
    """Send individual alerts for newly overdue tasks (dedup via notification_log)."""
    # Find overdue tasks not already alerted today
    cursor.execute(
        "SELECT t.id, t.title, t.priority, t.due_date, p.name as project_name "
        "FROM tasks t JOIN projects p ON t.project_id = p.id "
        "WHERE t.due_date < CURRENT_DATE "
        "AND t.status NOT IN ('done', 'cancelled') "
        "AND t.id NOT IN ("
        "  SELECT (metadata->>'task_id')::uuid FROM notification_log "
        "  WHERE notification_type = 'overdue_alert' "
        "  AND delivered_at >= CURRENT_DATE"
        ") "
        "ORDER BY t.priority DESC, t.due_date ASC"
    )
    columns = [desc[0] for desc in cursor.description]
    tasks = [dict(zip(columns, row)) for row in cursor.fetchall()]

    sent = 0
    for task in tasks[:10]:  # Cap at 10 per run
        sid = str(task["id"])[:8]
        picon = {"urgent": "🔴", "high": "🟠", "medium": "🟡", "low": "🟢"}.get(
            task.get("priority", "medium"), "⚪"
        )
        due = task.get("due_date")
        due_str = due.strftime("%b %d") if isinstance(due, (date, datetime)) else str(due)[:10]

        text = (
            f"⚠️ *{escape_md('Overdue Task')}*\n\n"
            f"{picon} `{sid}` *{escape_md(task['title'])}*\n"
            f"Project: {escape_md(task['project_name'])}\n"
            f"Due: {escape_md(due_str)}"
        )

        keyboard = {
            "inline_keyboard": [
                [
                    {"text": "✅ Done", "callback_data": f"done:{sid}"},
                    {"text": "⏰ +1d", "callback_data": f"snooze:{sid}:1d"},
                    {"text": "📅 Mon", "callback_data": f"snooze:{sid}:mon"},
                ],
                [
                    {"text": "🔕 Dismiss", "callback_data": f"dismiss:{sid}"},
                ],
            ]
        }

        result = send_telegram(text, reply_markup=keyboard)
        msg_id = result.get("result", {}).get("message_id")

        # Log with task_id in metadata for dedup
        cursor.execute(
            "INSERT INTO notification_log (id, channel, notification_type, recipient, "
            "message_preview, telegram_message_id, metadata) "
            "VALUES (%s, 'telegram', 'overdue_alert', %s, %s, %s, %s::jsonb)",
            (
                str(uuid.uuid4()),
                get_secret("TELEGRAM_CHAT_ID"),
                task["title"][:200],
                msg_id,
                json.dumps({"task_id": str(task["id"]), "source": "overdue_alert"}),
            ),
        )
        conn.commit()
        sent += 1

    return {"overdue_found": len(tasks), "alerts_sent": sent}


def weekly_digest(conn, cursor):
    """Generate and send the weekly digest."""
    # This week's stats
    cursor.execute(
        "SELECT "
        "COUNT(*) FILTER (WHERE status = 'done' AND completed_at >= CURRENT_DATE - 7) as completed, "
        "COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - 7) as created, "
        "COUNT(*) FILTER (WHERE status NOT IN ('done', 'cancelled')) as open_tasks, "
        "COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status NOT IN ('done', 'cancelled')) as overdue "
        "FROM tasks"
    )
    row = cursor.fetchone()
    completed = row[0] if row else 0
    created = row[1] if row else 0
    open_tasks = row[2] if row else 0
    overdue = row[3] if row else 0

    # Per-project breakdown
    cursor.execute(
        "SELECT p.name, "
        "COUNT(t.id) FILTER (WHERE t.status = 'done' AND t.completed_at >= CURRENT_DATE - 7) as done, "
        "COUNT(t.id) FILTER (WHERE t.status NOT IN ('done', 'cancelled')) as open "
        "FROM projects p LEFT JOIN tasks t ON t.project_id = p.id "
        "GROUP BY p.name ORDER BY p.created_at"
    )
    columns = [desc[0] for desc in cursor.description]
    projects = [dict(zip(columns, row)) for row in cursor.fetchall()]

    # Upcoming milestones
    cursor.execute(
        "SELECT m.name, m.due_date, p.name as project_name "
        "FROM milestones m JOIN projects p ON m.project_id = p.id "
        "WHERE m.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 14 "
        "AND m.status != 'completed' ORDER BY m.due_date"
    )
    columns = [desc[0] for desc in cursor.description]
    milestones = [dict(zip(columns, row)) for row in cursor.fetchall()]

    # Build message
    lines = [f"*{escape_md('📊 Weekly Digest')}*", ""]

    lines.append(f"*{escape_md('This Week')}*")
    lines.append(escape_md(f"  ✅ {completed} tasks completed"))
    lines.append(escape_md(f"  📋 {created} tasks created"))
    lines.append(escape_md(f"  📂 {open_tasks} open tasks"))
    if overdue:
        lines.append(escape_md(f"  ⚠️ {overdue} overdue"))
    lines.append("")

    lines.append(f"*{escape_md('By Project')}*")
    for p in projects:
        lines.append(
            escape_md(f"  {p['name']}: {p.get('done', 0)} done, {p.get('open', 0)} open")
        )
    lines.append("")

    if milestones:
        lines.append(f"*{escape_md('🎯 Next 2 Weeks')}*")
        for m in milestones[:5]:
            due = m["due_date"]
            due_str = due.strftime("%b %d") if isinstance(due, (date, datetime)) else str(due)[:10]
            lines.append(
                f"  {escape_md('•')} *{escape_md(m['name'])}* "
                f"\\({escape_md(m['project_name'])}\\) \\- {escape_md(due_str)}"
            )
        lines.append("")

    # Velocity indicator
    if completed > created:
        lines.append(escape_md("📈 Velocity: Shipping faster than creating — great week!"))
    elif completed == created:
        lines.append(escape_md("📊 Velocity: Balanced — keeping pace"))
    else:
        lines.append(escape_md("📉 Velocity: Backlog growing — consider prioritizing"))

    text = "\n".join(lines)

    keyboard = {
        "inline_keyboard": [
            [
                {"text": "📋 Plan next week", "callback_data": "prompt:Plan my tasks for next week"},
                {"text": "📊 Status", "callback_data": "cmd:status"},
            ]
        ]
    }

    result = send_telegram(text, reply_markup=keyboard)
    msg_id = result.get("result", {}).get("message_id")
    log_notification(conn, cursor, "weekly_digest", text[:200], msg_id)

    return {"completed": completed, "created": created, "open": open_tasks}


@functions_framework.http
def main(request):
    """Entry point for the telegram-notifications Cloud Run service."""
    start_time = datetime.now(timezone.utc)

    try:
        body = request.get_json(silent=True) or {}
    except Exception:
        body = {}

    notification_type = body.get("notification_type", "morning_brief")

    try:
        conn = get_connection()
        cursor = conn.cursor()

        if notification_type == "morning_brief":
            result = morning_brief(conn, cursor)
        elif notification_type == "overdue_alert":
            result = overdue_alert(conn, cursor)
        elif notification_type == "weekly_digest":
            result = weekly_digest(conn, cursor)
        else:
            return {"error": f"Unknown notification_type: {notification_type}"}, 400

        # Log pipeline run
        duration_ms = int(
            (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
        )
        try:
            cursor.execute(
                "SELECT id FROM pipelines WHERE slug = %s",
                ("telegram-notifications",),
            )
            pipeline_row = cursor.fetchone()
            if pipeline_row:
                cursor.execute(
                    "INSERT INTO pipeline_runs "
                    "(id, pipeline_id, status, trigger_type, triggered_by, "
                    "started_at, completed_at, duration_ms, output_summary) "
                    "VALUES (%s, %s, %s, %s, %s, %s, NOW(), %s, %s)",
                    (
                        str(uuid.uuid4()),
                        str(pipeline_row[0]),
                        "success",
                        "scheduled",
                        "cloud-scheduler",
                        start_time.isoformat(),
                        duration_ms,
                        json.dumps(result),
                    ),
                )
                conn.commit()
        except Exception:
            pass  # Pipeline logging is best-effort

        cursor.close()
        conn.close()

        return {
            "status": "success",
            "notification_type": notification_type,
            "result": result,
            "duration_ms": duration_ms,
        }

    except Exception as e:
        return {"error": str(e), "notification_type": notification_type}, 500
