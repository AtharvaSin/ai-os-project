"""Sync content-pipelines/bharatvarsh CSV to content_posts DB table.

Run after deploying the gateway fix (time serialization in postgres.py).
Or run directly with: python scripts/sync_csv_to_db.py

Requires: DB_HOST, DB_PORT, DB_USER, DB_NAME, AI_OS_DB_PASSWORD env vars
          (or Cloud SQL Auth Proxy on localhost:5432).
"""

import csv
import os
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = PROJECT_ROOT / "content-pipelines/bharatvarsh" / "calendar" / "content_calendar.csv"

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "127.0.0.1"),
    "port": int(os.getenv("DB_PORT", "5432")),
    "dbname": os.getenv("DB_NAME", "ai_os"),
    "user": os.getenv("DB_USER", "ai_os_admin"),
    "password": os.getenv("AI_OS_DB_PASSWORD", ""),
}

# CSV column → DB column mapping (only fields we want to sync)
SYNC_FIELDS = {
    "post_id": "post_id",
    "campaign": "campaign",
    "story_angle": "story_angle",
    "distillation_filter": "distillation_filter",
    "content_channel": "content_channel",
    "topic": "topic",
    "hook": "hook",
    "caption_text": "caption_text",
    "lore_refs": "lore_refs",
    "classified_status": "classified_status",
    "platforms": "channels",  # CSV: platforms → DB: channels (array)
    "visual_direction": "visual_direction",
    "status": "status",
    "scheduled_date": "scheduled_date",
    "scheduled_time": "scheduled_time",
    "target_audience": "target_audience",
    "hashtags": "hashtags",
    "cta_type": "cta_type",
    "cta_link": "cta_link",
}


def parse_csv() -> list[dict]:
    """Read the content calendar CSV and return list of row dicts."""
    rows = []
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    print(f"Read {len(rows)} posts from CSV")
    return rows


def sync_to_db(rows: list[dict]) -> None:
    """Upsert CSV rows into content_posts table."""
    try:
        import psycopg2
    except ImportError:
        print("psycopg2 not installed. Run: pip install psycopg2-binary")
        sys.exit(1)

    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    for row in rows:
        post_id = row["post_id"]

        # Check if post exists
        cur.execute("SELECT id FROM content_posts WHERE post_id = %s", (post_id,))
        existing = cur.fetchone()

        # Build update data
        channels = "{" + row.get("platforms", "") + "}"  # PostgreSQL array literal
        scheduled_date = row.get("scheduled_date", "").strip() or None
        scheduled_time = row.get("scheduled_time", "").strip() or None

        # Convert DD-MM-YYYY to YYYY-MM-DD if needed
        if scheduled_date and "-" in scheduled_date:
            parts = scheduled_date.split("-")
            if len(parts[0]) == 2:  # DD-MM-YYYY format
                scheduled_date = f"{parts[2]}-{parts[1]}-{parts[0]}"

        if existing:
            # UPDATE existing row
            cur.execute(
                """
                UPDATE content_posts SET
                    campaign = %s,
                    story_angle = %s,
                    distillation_filter = %s,
                    content_channel = %s,
                    topic = %s,
                    hook = %s,
                    caption_text = %s,
                    lore_refs = %s,
                    classified_status = %s,
                    channels = %s,
                    visual_direction = %s,
                    status = %s,
                    scheduled_date = %s,
                    scheduled_time = %s,
                    target_audience = %s,
                    hashtags = %s,
                    cta_type = %s,
                    cta_link = %s,
                    updated_at = NOW()
                WHERE post_id = %s
                """,
                (
                    row.get("campaign"),
                    row.get("story_angle"),
                    row.get("distillation_filter"),
                    row.get("content_channel"),
                    row.get("topic"),
                    row.get("hook"),
                    row.get("caption_text"),
                    row.get("lore_refs"),
                    row.get("classified_status"),
                    channels,
                    row.get("visual_direction"),
                    row.get("status", "planned"),
                    scheduled_date,
                    scheduled_time,
                    row.get("target_audience"),
                    row.get("hashtags"),
                    row.get("cta_type"),
                    row.get("cta_link"),
                    post_id,
                ),
            )
            print(f"  UPDATED {post_id} (id={existing[0]})")
        else:
            # INSERT new row
            cur.execute(
                """
                INSERT INTO content_posts (
                    post_id, campaign, story_angle, distillation_filter,
                    content_channel, topic, hook, caption_text, lore_refs,
                    classified_status, channels, visual_direction, status,
                    scheduled_date, scheduled_time, target_audience, hashtags,
                    cta_type, cta_link
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s
                )
                """,
                (
                    post_id,
                    row.get("campaign"),
                    row.get("story_angle"),
                    row.get("distillation_filter"),
                    row.get("content_channel"),
                    row.get("topic"),
                    row.get("hook"),
                    row.get("caption_text"),
                    row.get("lore_refs"),
                    row.get("classified_status"),
                    channels,
                    row.get("visual_direction"),
                    row.get("status", "planned"),
                    scheduled_date,
                    scheduled_time,
                    row.get("target_audience"),
                    row.get("hashtags"),
                    row.get("cta_type"),
                    row.get("cta_link"),
                ),
            )
            print(f"  INSERTED {post_id}")

    conn.commit()
    print(f"\nSync complete. {len(rows)} posts synced.")
    cur.close()
    conn.close()


if __name__ == "__main__":
    rows = parse_csv()
    sync_to_db(rows)
