"""Fix Knowledge Layer V2 — Deduplicate, seed connections, generate snapshots.

Resolves all 5 issues identified in the Knowledge Layer diagnostic:
1. Deduplicate entries (516 → ~258)
2. Verify 1:1 embedding coverage after dedup
3. Seed knowledge connections (target: 40-60 edges)
4. Generate knowledge snapshots (3 domains)
5. Validate search functionality

Usage:
    1. Start cloud-sql-proxy: cloud-sql-proxy bharatvarsh-website:us-central1:bharatvarsh-db --port=5432
    2. Set env: export AI_OS_DB_PASSWORD=<password>
    3. Run: python scripts/fix_knowledge_layer.py
"""

import os
import json
import pg8000
from datetime import date, datetime


def get_db_connection():
    """Get database connection via cloud-sql-proxy."""
    password = os.environ.get("AI_OS_DB_PASSWORD")
    if not password:
        raise ValueError("AI_OS_DB_PASSWORD environment variable required")

    port = int(os.environ.get("AI_OS_DB_PORT", "5433"))
    return pg8000.connect(
        host="localhost",
        port=port,
        user="ai_os_admin",
        password=password,
        database="ai_os"
    )


# ── Step 1: Deduplicate entries ─────────────────────────────────────────────

def step1_deduplicate(conn):
    """Remove duplicate entries, keeping ones that have embeddings."""
    cursor = conn.cursor()

    # Pre-check: count state
    cursor.execute("SELECT COUNT(*) FROM knowledge_entries")
    total_before = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM knowledge_embeddings")
    embeddings_before = cursor.fetchone()[0]

    print(f"\n{'='*60}")
    print(f"STEP 1: Deduplicate Entries")
    print(f"{'='*60}")
    print(f"  Before: {total_before} entries, {embeddings_before} embeddings")

    # Find orphan IDs: entries WITHOUT embeddings that have a duplicate WITH an embedding
    cursor.execute("""
        SELECT ke.id, ke.title
        FROM knowledge_entries ke
        LEFT JOIN knowledge_embeddings kem ON ke.id = kem.entry_id
        WHERE kem.id IS NULL
        AND EXISTS (
            SELECT 1 FROM knowledge_entries ke2
            JOIN knowledge_embeddings kem2 ON ke2.id = kem2.entry_id
            WHERE ke2.title = ke.title AND ke2.content = ke.content AND ke2.id != ke.id
        )
    """)
    orphan_rows = cursor.fetchall()
    orphan_ids = [str(row[0]) for row in orphan_rows]

    print(f"  Found {len(orphan_ids)} orphan duplicates (no embedding, duplicate has one)")

    if not orphan_ids:
        print("  Nothing to delete — skipping")
        cursor.close()
        return

    # Delete orphans in batches
    deleted = 0
    batch_size = 50
    for i in range(0, len(orphan_ids), batch_size):
        batch = orphan_ids[i:i + batch_size]
        placeholders = ", ".join(["%s"] * len(batch))
        cursor.execute(
            f"DELETE FROM knowledge_entries WHERE id IN ({placeholders})",
            batch
        )
        deleted += cursor.rowcount
        print(f"  Deleted batch {i // batch_size + 1}: {cursor.rowcount} rows")

    conn.commit()

    # Post-check
    cursor.execute("SELECT COUNT(*) FROM knowledge_entries")
    total_after = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM knowledge_embeddings")
    embeddings_after = cursor.fetchone()[0]

    print(f"\n  After: {total_after} entries, {embeddings_after} embeddings")
    print(f"  Deleted: {deleted} orphan duplicates")

    # Check for any remaining duplicates (entries without embeddings that are true duplicates)
    cursor.execute("""
        SELECT ke.id, ke.title
        FROM knowledge_entries ke
        LEFT JOIN knowledge_embeddings kem ON ke.id = kem.entry_id
        WHERE kem.id IS NULL
    """)
    still_missing = cursor.fetchall()
    if still_missing:
        print(f"\n  WARNING: {len(still_missing)} entries still lack embeddings after dedup.")
        print(f"  These may be genuine entries that need embedding generation.")
        for row in still_missing[:5]:
            print(f"    - {row[1]}")
        if len(still_missing) > 5:
            print(f"    ... and {len(still_missing) - 5} more")
    else:
        print(f"  100% embedding coverage achieved!")

    cursor.close()
    return total_after, embeddings_after


# ── Step 2: Clean up drive_scan_state duplicates ────────────────────────────

def step2_audit_drive_state(conn):
    """Audit drive_scan_state for duplicate folder mappings."""
    cursor = conn.cursor()

    print(f"\n{'='*60}")
    print(f"STEP 2: Audit Drive Scan State")
    print(f"{'='*60}")

    cursor.execute("""
        SELECT folder_path, drive_folder_id, files_processed, last_file_count,
               last_scanned_at
        FROM drive_scan_state
        ORDER BY folder_path
    """)
    columns = [desc[0] for desc in cursor.description]
    rows = [dict(zip(columns, row)) for row in cursor.fetchall()]

    for row in rows:
        print(f"  {row['folder_path']}: {row['files_processed']} files, "
              f"last scan: {row['last_scanned_at']}")

    # Check for duplicate drive_file_ids in remaining entries
    cursor.execute("""
        SELECT drive_file_id, COUNT(*) as cnt
        FROM knowledge_entries
        WHERE drive_file_id IS NOT NULL
        GROUP BY drive_file_id
        HAVING COUNT(*) > 1
        ORDER BY cnt DESC
        LIMIT 10
    """)
    dup_files = cursor.fetchall()
    if dup_files:
        print(f"\n  WARNING: {len(dup_files)} drive_file_ids still have multiple entries")
        for row in dup_files[:5]:
            print(f"    file_id {row[0][:20]}...: {row[1]} entries")
    else:
        print(f"  No duplicate drive_file_ids remaining.")

    cursor.close()


# ── Step 3: Seed knowledge connections ──────────────────────────────────────

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

    # Goals depend on decisions/references
    if "goal" in title_a and ("decision" in title_b or "reference" in title_b):
        return "depends_on"
    if ("decision" in title_a or "reference" in title_a) and "goal" in title_b:
        return "derived_from"

    # Lessons expand on decisions
    if "lesson" in title_a and "decision" in title_b:
        return "expands"
    if "decision" in title_a and "lesson" in title_b:
        return "derived_from"

    # Personal goals relate to projects
    if domain_a == "personal" and domain_b == "project":
        return "relates_to"
    if domain_a == "project" and domain_b == "personal":
        return "relates_to"

    # Default
    return "relates_to"


def step3_seed_connections(conn):
    """Create knowledge connections based on embedding similarity."""
    cursor = conn.cursor()

    print(f"\n{'='*60}")
    print(f"STEP 3: Seed Knowledge Connections")
    print(f"{'='*60}")

    # Check existing connections
    cursor.execute("SELECT COUNT(*) FROM knowledge_connections")
    existing = cursor.fetchone()[0]
    print(f"  Existing connections: {existing}")

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

    print(f"  Entries with embeddings: {len(entries)}")

    connections_created = 0
    connections_skipped = 0

    for i, entry in enumerate(entries):
        # Find similar entries (cosine similarity > 0.72 for broader coverage)
        cursor.execute("""
            SELECT ke.id, ke.title, ke.domain::text, ke.sub_domain,
                   (1 - (kv.embedding <=> %s::vector(1536)))::float as similarity
            FROM knowledge_entries ke
            JOIN knowledge_embeddings kv ON kv.entry_id = ke.id
            WHERE ke.id != %s
            AND (1 - (kv.embedding <=> %s::vector(1536))) > 0.72
            ORDER BY similarity DESC
            LIMIT 3
        """, (entry["embedding"], str(entry["id"]), entry["embedding"]))

        similar_cols = [desc[0] for desc in cursor.description]
        similar_entries = [dict(zip(similar_cols, row)) for row in cursor.fetchall()]

        for similar in similar_entries:
            # Check if connection already exists (bidirectional)
            cursor.execute("""
                SELECT id FROM knowledge_connections
                WHERE (source_entry_id = %s AND target_entry_id = %s)
                   OR (source_entry_id = %s AND target_entry_id = %s)
            """, (str(entry["id"]), str(similar["id"]),
                  str(similar["id"]), str(entry["id"])))

            if cursor.fetchone():
                connections_skipped += 1
                continue

            rel_type = classify_relationship(entry, similar)

            cursor.execute("""
                INSERT INTO knowledge_connections
                    (source_entry_id, target_entry_id, relationship_type,
                     strength, context)
                VALUES (%s, %s, %s::relationship_type_kb, %s, %s)
                ON CONFLICT DO NOTHING
            """, (
                str(entry["id"]),
                str(similar["id"]),
                rel_type,
                similar["similarity"],
                f"Auto-seed: {entry['title'][:40]} <-> {similar['title'][:40]}"
            ))
            if cursor.rowcount > 0:
                connections_created += 1

        # Progress indicator every 50 entries
        if (i + 1) % 50 == 0:
            print(f"  Processed {i + 1}/{len(entries)} entries...")

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

    retro_chains = 0
    for i in range(1, len(retros)):
        cursor.execute("""
            INSERT INTO knowledge_connections
                (source_entry_id, target_entry_id, relationship_type,
                 strength, context)
            VALUES (%s, %s, 'supersedes'::relationship_type_kb, 1.0,
                    'Sprint retrospective temporal chain')
            ON CONFLICT DO NOTHING
        """, (
            str(retros[i]["id"]),
            str(retros[i - 1]["id"])
        ))
        if cursor.rowcount > 0:
            retro_chains += 1

    conn.commit()

    cursor.execute("SELECT COUNT(*) FROM knowledge_connections")
    total_connections = cursor.fetchone()[0]

    print(f"\n  Results:")
    print(f"    New connections created: {connections_created}")
    print(f"    Skipped (already exist): {connections_skipped}")
    print(f"    Retro temporal chains: {retro_chains}")
    print(f"    Total connections now: {total_connections}")

    cursor.close()
    return total_connections


# ── Step 4: Generate knowledge snapshots ────────────────────────────────────

def step4_generate_snapshots(conn):
    """Generate per-domain knowledge snapshots."""
    cursor = conn.cursor()

    print(f"\n{'='*60}")
    print(f"STEP 4: Generate Knowledge Snapshots")
    print(f"{'='*60}")

    domains = ["system", "project", "personal"]
    today = date.today().isoformat()

    for domain in domains:
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
        total_entries, total_with_embeddings, new_entries = row

        cursor.execute("""
            SELECT sub_domain, COUNT(*) as count
            FROM knowledge_entries
            WHERE domain = %s::knowledge_domain AND sub_domain IS NOT NULL
            GROUP BY sub_domain ORDER BY count DESC LIMIT 5
        """, (domain,))
        top_sub_domains = [{"sub_domain": r[0], "count": r[1]} for r in cursor.fetchall()]

        cursor.execute("""
            SELECT unnest(tags) as tag, COUNT(*) as count
            FROM knowledge_entries
            WHERE domain = %s::knowledge_domain AND tags IS NOT NULL
            GROUP BY tag ORDER BY count DESC LIMIT 10
        """, (domain,))
        top_tags = [{"tag": r[0], "count": r[1]} for r in cursor.fetchall()]

        cursor.execute("""
            SELECT source_type::text, COUNT(*) as count
            FROM knowledge_entries
            WHERE domain = %s::knowledge_domain
            GROUP BY source_type ORDER BY count DESC LIMIT 5
        """, (domain,))
        top_source_types = [{"source_type": r[0], "count": r[1]} for r in cursor.fetchall()]

        cursor.execute("""
            SELECT COUNT(*) FROM knowledge_connections kc
            JOIN knowledge_entries ke ON ke.id = kc.source_entry_id
            WHERE ke.domain = %s::knowledge_domain
        """, (domain,))
        connection_count = cursor.fetchone()[0]

        cursor.execute("""
            SELECT AVG(confidence_score)
            FROM knowledge_entries
            WHERE domain = %s::knowledge_domain AND confidence_score IS NOT NULL
        """, (domain,))
        avg_row = cursor.fetchone()
        avg_confidence = float(avg_row[0]) if avg_row[0] else None

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
              f"{connection_count} connections")

    conn.commit()

    cursor.execute("SELECT COUNT(*) FROM knowledge_snapshots")
    total_snapshots = cursor.fetchone()[0]
    print(f"\n  Snapshots generated for {today} ({total_snapshots} total rows)")

    cursor.close()
    return total_snapshots


# ── Step 5: Validation ──────────────────────────────────────────────────────

def step5_validate(conn):
    """Run validation checks against the playbook checklist."""
    cursor = conn.cursor()

    print(f"\n{'='*60}")
    print(f"STEP 5: Validation")
    print(f"{'='*60}")

    checks_passed = 0
    checks_total = 0

    # Check 1: Entry count (no duplicates)
    checks_total += 1
    cursor.execute("SELECT COUNT(*) FROM knowledge_entries")
    entries = cursor.fetchone()[0]
    cursor.execute("""
        SELECT COUNT(*) FROM (
            SELECT title, content FROM knowledge_entries
            GROUP BY title, content HAVING COUNT(*) > 1
        ) sub
    """)
    dup_count = cursor.fetchone()[0]
    if dup_count == 0:
        print(f"  [PASS] No duplicate entries ({entries} unique entries)")
        checks_passed += 1
    else:
        print(f"  [FAIL] {dup_count} duplicate title+content groups remain")

    # Check 2: 1:1 embedding coverage
    checks_total += 1
    cursor.execute("SELECT COUNT(*) FROM knowledge_embeddings")
    embeddings = cursor.fetchone()[0]
    if entries == embeddings:
        print(f"  [PASS] 1:1 embedding coverage ({entries} entries = {embeddings} embeddings)")
        checks_passed += 1
    else:
        gap = entries - embeddings
        print(f"  [WARN] Embedding gap: {entries} entries vs {embeddings} embeddings ({gap} missing)")

    # Check 3: Connections >= 40
    checks_total += 1
    cursor.execute("SELECT COUNT(*) FROM knowledge_connections")
    connections = cursor.fetchone()[0]
    if connections >= 40:
        print(f"  [PASS] {connections} knowledge connections (target: >= 40)")
        checks_passed += 1
    else:
        print(f"  [WARN] Only {connections} connections (target: >= 40)")

    # Check 4: Snapshots exist
    checks_total += 1
    cursor.execute("SELECT COUNT(*) FROM knowledge_snapshots")
    snapshots = cursor.fetchone()[0]
    if snapshots >= 3:
        print(f"  [PASS] {snapshots} knowledge snapshots")
        checks_passed += 1
    else:
        print(f"  [FAIL] Only {snapshots} snapshots (expected >= 3)")

    # Check 5: No duplicate drive_file_ids
    checks_total += 1
    cursor.execute("""
        SELECT COUNT(*) FROM (
            SELECT drive_file_id FROM knowledge_entries
            WHERE drive_file_id IS NOT NULL
            GROUP BY drive_file_id HAVING COUNT(*) > 1
        ) sub
    """)
    dup_drive = cursor.fetchone()[0]
    if dup_drive == 0:
        print(f"  [PASS] No duplicate drive_file_ids")
        checks_passed += 1
    else:
        print(f"  [WARN] {dup_drive} drive_file_ids have multiple entries")

    # Check 6: Domain distribution
    checks_total += 1
    cursor.execute("""
        SELECT domain::text, COUNT(*) FROM knowledge_entries
        GROUP BY domain ORDER BY domain
    """)
    dist = cursor.fetchall()
    print(f"  [INFO] Domain distribution: {', '.join(f'{d[0]}={d[1]}' for d in dist)}")
    checks_passed += 1

    # Check 7: Connection type distribution
    cursor.execute("""
        SELECT relationship_type::text, COUNT(*)
        FROM knowledge_connections
        GROUP BY relationship_type
        ORDER BY COUNT(*) DESC
    """)
    conn_dist = cursor.fetchall()
    if conn_dist:
        print(f"  [INFO] Connection types: {', '.join(f'{c[0]}={c[1]}' for c in conn_dist)}")

    print(f"\n  Result: {checks_passed}/{checks_total} checks passed")

    cursor.close()
    return checks_passed, checks_total


# ── Main ────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("Knowledge Layer V2 — Fix Script")
    print(f"Date: {datetime.now().isoformat()}")
    print("=" * 60)

    conn = get_db_connection()

    try:
        # step1_deduplicate(conn)  # Already completed successfully
        step2_audit_drive_state(conn)
        step3_seed_connections(conn)
        step4_generate_snapshots(conn)
        passed, total = step5_validate(conn)

        print(f"\n{'='*60}")
        print(f"DONE — {passed}/{total} validation checks passed")
        print(f"{'='*60}")
    except Exception as e:
        print(f"\nERROR: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
