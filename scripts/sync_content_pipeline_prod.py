"""
Sync Bharatvarsh content pipeline CSV → production Cloud SQL.

Uses the Cloud SQL Python Connector (no proxy needed) with pg8000.
Upserts all posts from content_calendar.csv into content_posts table
and logs the sync in content_pipeline_log.
"""

import csv
import os
import sys
from datetime import date, time

import pg8000
from google.cloud.sql.connector import Connector

# --- Config ---
PROJECT = "bharatvarsh-website"
REGION = "us-central1"
INSTANCE = "bharatvarsh-db"
INSTANCE_CONNECTION = f"{PROJECT}:{REGION}:{INSTANCE}"
DB_NAME = "ai_os"
DB_USER = "ai_os_admin"
DB_PASS = os.environ.get("AI_OS_DB_PASSWORD", "ai_os_admin_clearance")

CSV_PATH = os.path.join(
    os.path.dirname(__file__),
    "..",
    "content-pipelines/bharatvarsh",
    "calendar",
    "content_calendar.csv",
)


def get_connection():
    """Connect to production Cloud SQL via Python Connector."""
    connector = Connector()
    conn = connector.connect(
        INSTANCE_CONNECTION,
        "pg8000",
        user=DB_USER,
        password=DB_PASS,
        db=DB_NAME,
    )
    return conn, connector


def parse_date(val: str) -> date | None:
    """Parse date from CSV (YYYY-MM-DD or DD-MM-YYYY)."""
    if not val or not val.strip():
        return None
    val = val.strip()
    for fmt in ("%Y-%m-%d", "%d-%m-%Y"):
        try:
            from datetime import datetime
            return datetime.strptime(val, fmt).date()
        except ValueError:
            continue
    return None


def parse_time(val: str) -> time | None:
    """Parse time from CSV (HH:MM or HH:MM:SS)."""
    if not val or not val.strip():
        return None
    val = val.strip()
    parts = val.split(":")
    if len(parts) >= 2:
        return time(int(parts[0]), int(parts[1]))
    return None


def parse_channels(val: str) -> list[str]:
    """Parse comma-separated platforms string into list."""
    if not val or not val.strip():
        return []
    return [c.strip() for c in val.split(",") if c.strip()]


def read_csv() -> list[dict]:
    """Read content calendar CSV."""
    path = os.path.normpath(CSV_PATH)
    if not os.path.exists(path):
        print(f"CSV not found: {path}")
        sys.exit(1)
    with open(path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return list(reader)


UPSERT_SQL = """
INSERT INTO content_posts (
    post_id, campaign, content_pillar, story_angle, distillation_filter,
    content_channel, topic, hook, caption_text, visual_direction,
    lore_refs, classified_status, channels, status, scheduled_date,
    scheduled_time, target_audience, hashtags, cta_type, cta_link
) VALUES (
    %s, %s, %s, %s, %s,
    %s, %s, %s, %s, %s,
    %s, %s, %s, %s::content_post_status, %s,
    %s, %s, %s, %s, %s
)
ON CONFLICT (post_id) DO UPDATE SET
    campaign = EXCLUDED.campaign,
    content_pillar = EXCLUDED.content_pillar,
    story_angle = EXCLUDED.story_angle,
    distillation_filter = EXCLUDED.distillation_filter,
    content_channel = EXCLUDED.content_channel,
    topic = EXCLUDED.topic,
    hook = EXCLUDED.hook,
    caption_text = EXCLUDED.caption_text,
    visual_direction = EXCLUDED.visual_direction,
    lore_refs = EXCLUDED.lore_refs,
    classified_status = EXCLUDED.classified_status,
    channels = EXCLUDED.channels,
    status = EXCLUDED.status,
    scheduled_date = EXCLUDED.scheduled_date,
    scheduled_time = EXCLUDED.scheduled_time,
    target_audience = EXCLUDED.target_audience,
    hashtags = EXCLUDED.hashtags,
    cta_type = EXCLUDED.cta_type,
    cta_link = EXCLUDED.cta_link,
    updated_at = NOW()
RETURNING post_id, status, topic
"""

LOG_SQL = """
INSERT INTO content_pipeline_log (post_id, action, old_status, new_status, details, performed_by)
VALUES (%s, %s, %s, %s, %s::jsonb, %s)
"""


def main():
    rows = read_csv()
    print(f"Read {len(rows)} posts from CSV")

    conn, connector = get_connection()
    cur = conn.cursor()

    # Get existing statuses for audit log
    cur.execute("SELECT post_id, status::text FROM content_posts WHERE post_id = ANY(%s)",
                ([r["post_id"] for r in rows],))
    existing = {r[0]: r[1] for r in cur.fetchall()}
    print(f"Found {len(existing)} existing posts in DB")

    synced = 0
    for row in rows:
        post_id = row["post_id"]
        channels = parse_channels(row.get("platforms", ""))
        sched_date = parse_date(row.get("scheduled_date", ""))
        sched_time = parse_time(row.get("scheduled_time", ""))
        status = row.get("status", "planned").strip()
        story_angle = row.get("story_angle", "").strip() or None
        content_pillar = story_angle or row.get("content_pillar", "").strip() or "bharatsena"

        params = (
            post_id,
            row.get("campaign", "").strip(),
            content_pillar,
            story_angle,
            row.get("distillation_filter", "").strip() or None,
            row.get("content_channel", "").strip() or None,
            row.get("topic", "").strip(),
            row.get("hook", "").strip() or None,
            row.get("caption_text", "").strip() or None,
            row.get("visual_direction", "").strip() or None,
            row.get("lore_refs", "").strip() or None,
            row.get("classified_status", "declassified").strip(),
            channels,
            status,
            sched_date,
            sched_time,
            row.get("target_audience", "").strip() or None,
            row.get("hashtags", "").strip() or None,
            row.get("cta_type", "").strip() or None,
            row.get("cta_link", "").strip() or None,
        )

        cur.execute(UPSERT_SQL, params)
        result = cur.fetchone()
        synced += 1

        old_status = existing.get(post_id)
        action = "sync_update" if post_id in existing else "sync_insert"
        log_details = '{"source": "sync_content_pipeline_prod.py", "sync_date": "2026-03-23"}'

        cur.execute(LOG_SQL, (
            post_id,
            action,
            old_status,
            status,
            log_details,
            "sync_content_pipeline_prod.py",
        ))

        marker = "UPD" if post_id in existing else "NEW"
        print(f"  [{marker}] {post_id}: {result[1]} — {result[2][:50]}")

    conn.commit()
    cur.close()
    conn.close()
    connector.close()

    print(f"\nSynced {synced} posts to production DB")
    print("Audit log entries created for all changes")


if __name__ == "__main__":
    main()
