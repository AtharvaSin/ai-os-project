"""Seed initial knowledge connections based on embedding similarity.

Run after all knowledge entries are ingested and embedded.
Uses embedding similarity to find high-quality cross-domain connections.

Usage:
    1. Start cloud-sql-proxy: cloud-sql-proxy bharatvarsh-website:us-central1:bharatvarsh-db --port=5432
    2. Set env: export AI_OS_DB_PASSWORD=<password>
    3. Run: python scripts/seed_knowledge_connections.py

Sprint: 5B | Task: 5B-17
"""

import os
import json
import pg8000
from datetime import datetime


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


def seed_connections():
    """Create initial connections based on embedding similarity."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Get all entries with embeddings
    cursor.execute("""
        SELECT ke.id, ke.title, ke.domain::text, ke.sub_domain,
               kv.embedding::text
        FROM knowledge_entries ke
        JOIN knowledge_embeddings kv ON kv.entry_id = ke.id
        ORDER BY ke.domain, ke.sub_domain, ke.title
    """)

    columns = [desc[0] for desc in cursor.description]
    entries = [dict(zip(columns, row)) for row in cursor.fetchall()]

    print(f"Found {len(entries)} entries with embeddings")

    connections_created = 0
    connections_skipped = 0

    for entry in entries:
        # Find similar entries (prefer cross-domain)
        cursor.execute("""
            SELECT ke.id, ke.title, ke.domain::text, ke.sub_domain,
                   (1 - (kv.embedding <=> %s::vector(1536)))::float as similarity
            FROM knowledge_entries ke
            JOIN knowledge_embeddings kv ON kv.entry_id = ke.id
            WHERE ke.id != %s
            AND (1 - (kv.embedding <=> %s::vector(1536))) > 0.75
            ORDER BY similarity DESC
            LIMIT 3
        """, (entry["embedding"], str(entry["id"]), entry["embedding"]))

        similar_cols = [desc[0] for desc in cursor.description]
        similar_entries = [dict(zip(similar_cols, row)) for row in cursor.fetchall()]

        for similar in similar_entries:
            # Check if connection already exists
            cursor.execute("""
                SELECT id FROM knowledge_connections
                WHERE (source_entry_id = %s AND target_entry_id = %s)
                   OR (source_entry_id = %s AND target_entry_id = %s)
            """, (str(entry["id"]), str(similar["id"]),
                  str(similar["id"]), str(entry["id"])))

            if cursor.fetchone():
                connections_skipped += 1
                continue

            # Classify relationship type heuristically
            rel_type = classify_relationship(entry, similar)

            cursor.execute("""
                INSERT INTO knowledge_connections
                    (source_entry_id, target_entry_id, relationship_type,
                     strength, context, metadata)
                VALUES (%s, %s, %s::relationship_type_kb, %s, %s, %s)
                ON CONFLICT DO NOTHING
            """, (
                str(entry["id"]),
                str(similar["id"]),
                rel_type,
                similar["similarity"],
                f"Initial seed: {entry['title']} ↔ {similar['title']}",
                json.dumps({
                    "auto_proposed": False,
                    "approved": True,
                    "seeded_at": datetime.utcnow().isoformat(),
                    "method": "embedding_similarity"
                })
            ))
            connections_created += 1

    # Create temporal chains for sprint retrospectives
    cursor.execute("""
        SELECT id, title, created_at
        FROM knowledge_entries
        WHERE title LIKE 'Retro%%Sprint%%'
           OR (source_type = 'lesson_learned' AND title LIKE '%%Sprint%%')
        ORDER BY created_at ASC
    """)

    retro_cols = [desc[0] for desc in cursor.description]
    retros = [dict(zip(retro_cols, row)) for row in cursor.fetchall()]

    for i in range(1, len(retros)):
        cursor.execute("""
            INSERT INTO knowledge_connections
                (source_entry_id, target_entry_id, relationship_type,
                 strength, context, metadata)
            VALUES (%s, %s, 'supersedes'::relationship_type_kb, 1.0,
                    'Sprint retrospective temporal chain', %s)
            ON CONFLICT DO NOTHING
        """, (
            str(retros[i]["id"]),
            str(retros[i-1]["id"]),
            json.dumps({
                "auto_proposed": False,
                "approved": True,
                "seeded_at": datetime.utcnow().isoformat(),
                "method": "temporal_chain"
            })
        ))
        connections_created += 1

    conn.commit()
    cursor.close()
    conn.close()

    print(f"\nResults:")
    print(f"  Connections created: {connections_created}")
    print(f"  Connections skipped (already exist): {connections_skipped}")
    print(f"  Sprint retro temporal chains: {max(0, len(retros) - 1)}")


def classify_relationship(entry_a: dict, entry_b: dict) -> str:
    """Heuristically classify the relationship type between two entries."""
    domain_a = entry_a["domain"]
    domain_b = entry_b["domain"]
    title_a = entry_a["title"].lower()
    title_b = entry_b["title"].lower()

    # System decisions that inform project work
    if domain_a == "system" and domain_b == "project":
        return "derived_from"
    if domain_a == "project" and domain_b == "system":
        return "depends_on"

    # Retrospectives expand on decisions
    if "retro" in title_a and "decision" in title_b:
        return "expands"
    if "decision" in title_a and "retro" in title_b:
        return "derived_from"

    # Personal goals relate to projects
    if domain_a == "personal" and domain_b == "project":
        return "relates_to"
    if domain_a == "project" and domain_b == "personal":
        return "relates_to"

    # Default
    return "relates_to"


if __name__ == "__main__":
    seed_connections()
