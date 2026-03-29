"""
Reseed content_posts from the canonical CSV — clear all existing data first.

Truncates content_pipeline_log and content_posts (in FK order),
then inserts all rows from content_calendar.csv as the single source of truth.
"""

import csv
import os
import sys
from datetime import date, time, datetime

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
    if not val or not val.strip():
        return None
    val = val.strip()
    for fmt in ("%d-%m-%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(val, fmt).date()
        except ValueError:
            continue
    return None


def parse_time(val: str) -> time | None:
    if not val or not val.strip():
        return None
    parts = val.strip().split(":")
    if len(parts) >= 2:
        return time(int(parts[0]), int(parts[1]))
    return None


def parse_channels(val: str) -> list[str]:
    if not val or not val.strip():
        return []
    return [c.strip() for c in val.split(",") if c.strip()]


def read_csv() -> list[dict]:
    path = os.path.normpath(CSV_PATH)
    if not os.path.exists(path):
        print(f"CSV not found: {path}")
        sys.exit(1)
    with open(path, "r", encoding="utf-8") as f:
        return list(csv.DictReader(f))


INSERT_SQL = """
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
RETURNING id, post_id, topic
"""


def main():
    rows = read_csv()
    print(f"Read {len(rows)} posts from CSV")

    conn, connector = get_connection()
    cur = conn.cursor()

    # Step 1: Clear dependent table first (FK constraint)
    cur.execute("DELETE FROM content_pipeline_log")
    deleted_log = cur.rowcount
    print(f"Cleared content_pipeline_log: {deleted_log} rows deleted")

    # Step 2: Clear content_posts and reset sequence
    cur.execute("DELETE FROM content_posts")
    deleted_posts = cur.rowcount
    print(f"Cleared content_posts: {deleted_posts} rows deleted")

    cur.execute("ALTER SEQUENCE content_posts_id_seq RESTART WITH 1")
    print("Reset ID sequence to 1")

    # Step 3: Insert all CSV rows
    inserted = 0
    for row in rows:
        post_id = row["post_id"]
        channels = parse_channels(row.get("platforms", ""))
        sched_date = parse_date(row.get("scheduled_date", ""))
        sched_time = parse_time(row.get("scheduled_time", ""))
        status = row.get("status", "planned").strip()
        story_angle = row.get("story_angle", "").strip() or None
        content_pillar = story_angle or "bharatsena"

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

        cur.execute(INSERT_SQL, params)
        result = cur.fetchone()
        inserted += 1
        print(f"  [{result[0]:>2}] {result[1]}: {result[2][:60]}")

    conn.commit()

    # Step 4: Verify
    cur.execute("SELECT COUNT(*) FROM content_posts")
    count = cur.fetchone()[0]
    print(f"\nVerification: {count} posts in content_posts")

    cur.execute("SELECT id, post_id, status::text, scheduled_date, story_angle, content_channel FROM content_posts ORDER BY id")
    print("\nFinal state:")
    for r in cur.fetchall():
        print(f"  #{r[0]:>2} | {r[1]} | {r[2]:<12} | {r[3]} | {r[4] or '-':<12} | {r[5] or '-'}")

    cur.close()
    conn.close()
    connector.close()

    print(f"\nDone. Seeded {inserted} posts from CSV. Old data cleared.")


if __name__ == "__main__":
    main()
