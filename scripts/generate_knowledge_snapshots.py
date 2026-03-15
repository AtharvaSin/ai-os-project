"""Generate knowledge snapshots for all domains.

Creates per-domain statistics entries in the knowledge_snapshots table.
Run manually or scheduled as part of the weekly review cycle.

Usage:
    1. Start cloud-sql-proxy: cloud-sql-proxy bharatvarsh-website:us-central1:bharatvarsh-db --port=5432
    2. Set env: export AI_OS_DB_PASSWORD=<password>
    3. Run: python scripts/generate_knowledge_snapshots.py

Sprint: 5D | Task: 5D-5
"""

import os
import json
import pg8000
from datetime import date


def get_db_connection():
    """Get database connection via cloud-sql-proxy."""
    password = os.environ.get("AI_OS_DB_PASSWORD")
    if not password:
        raise ValueError("AI_OS_DB_PASSWORD environment variable required")

    return pg8000.connect(
        host="localhost",
        port=5432,
        user="ai_os_admin",
        password=password,
        database="ai_os"
    )


def generate_snapshots():
    """Generate weekly domain-level stats for each knowledge domain."""
    conn = get_db_connection()
    cursor = conn.cursor()

    domains = ["system", "project", "personal"]
    today = date.today().isoformat()

    for domain in domains:
        # Get entry counts
        cursor.execute("""
            SELECT
                COUNT(*) as total_entries,
                COUNT(CASE WHEN ke.id IN (
                    SELECT entry_id FROM knowledge_embeddings
                ) THEN 1 END) as total_with_embeddings,
                COUNT(CASE WHEN ke.created_at >= NOW() - INTERVAL '7 days'
                    THEN 1 END) as new_entries
            FROM knowledge_entries ke
            WHERE ke.domain = %s::knowledge_domain
        """, (domain,))
        row = cursor.fetchone()
        total_entries = row[0]
        total_with_embeddings = row[1]
        new_entries = row[2]

        # Get top sub-domains
        cursor.execute("""
            SELECT sub_domain, COUNT(*) as count
            FROM knowledge_entries
            WHERE domain = %s::knowledge_domain AND sub_domain IS NOT NULL
            GROUP BY sub_domain ORDER BY count DESC LIMIT 5
        """, (domain,))
        top_sub_domains = [
            {"sub_domain": r[0], "count": r[1]}
            for r in cursor.fetchall()
        ]

        # Get top tags
        cursor.execute("""
            SELECT unnest(tags) as tag, COUNT(*) as count
            FROM knowledge_entries
            WHERE domain = %s::knowledge_domain AND tags IS NOT NULL
            GROUP BY tag ORDER BY count DESC LIMIT 10
        """, (domain,))
        top_tags = [
            {"tag": r[0], "count": r[1]}
            for r in cursor.fetchall()
        ]

        # Get top source types
        cursor.execute("""
            SELECT source_type::text, COUNT(*) as count
            FROM knowledge_entries
            WHERE domain = %s::knowledge_domain
            GROUP BY source_type ORDER BY count DESC LIMIT 5
        """, (domain,))
        top_source_types = [
            {"source_type": r[0], "count": r[1]}
            for r in cursor.fetchall()
        ]

        # Get connection count
        cursor.execute("""
            SELECT COUNT(*) FROM knowledge_connections kc
            JOIN knowledge_entries ke ON ke.id = kc.source_entry_id
            WHERE ke.domain = %s::knowledge_domain
        """, (domain,))
        connection_count = cursor.fetchone()[0]

        # Get avg confidence
        cursor.execute("""
            SELECT AVG(confidence_score)
            FROM knowledge_entries
            WHERE domain = %s::knowledge_domain AND confidence_score IS NOT NULL
        """, (domain,))
        avg_confidence_row = cursor.fetchone()
        avg_confidence = float(avg_confidence_row[0]) if avg_confidence_row[0] else None

        # Upsert snapshot
        cursor.execute("""
            INSERT INTO knowledge_snapshots
                (domain, snapshot_date, total_entries, total_with_embeddings,
                 new_entries_since_last, top_sub_domains, top_tags,
                 top_source_types, connection_count, avg_confidence)
            VALUES (%s::knowledge_domain, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (domain, snapshot_date) DO UPDATE SET
                total_entries = EXCLUDED.total_entries,
                total_with_embeddings = EXCLUDED.total_with_embeddings,
                new_entries_since_last = EXCLUDED.new_entries_since_last,
                top_sub_domains = EXCLUDED.top_sub_domains,
                top_tags = EXCLUDED.top_tags,
                top_source_types = EXCLUDED.top_source_types,
                connection_count = EXCLUDED.connection_count,
                avg_confidence = EXCLUDED.avg_confidence
        """, (
            domain, today, total_entries, total_with_embeddings,
            new_entries, json.dumps(top_sub_domains), json.dumps(top_tags),
            json.dumps(top_source_types), connection_count, avg_confidence
        ))

        print(f"  {domain}: {total_entries} entries, "
              f"{total_with_embeddings} embedded, "
              f"{new_entries} new this week, "
              f"{connection_count} connections")

    conn.commit()
    cursor.close()
    conn.close()

    print(f"\nSnapshots generated for {today}")


if __name__ == "__main__":
    print("Generating knowledge snapshots...")
    generate_snapshots()
