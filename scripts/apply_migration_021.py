"""Apply migration 021_embedding_freshness to Cloud SQL.

Connects via cloud-sql-proxy TCP on localhost:5432 or directly to Cloud SQL
using the same pattern as the Category B pipelines.

Usage:
  1. Start cloud-sql-proxy:
     cloud-sql-proxy bharatvarsh-website:us-central1:bharatvarsh-db --port=5432
  2. Set env: AI_OS_DB_PASSWORD=<password>
  3. Run: python scripts/apply_migration_021.py

Or set DB_HOST to connect to a remote proxy / Docker container.
"""

import os
import sys

import pg8000

DB_USER = os.getenv("DB_USER", "ai_os_admin")
DB_NAME = os.getenv("DB_NAME", "ai_os")
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_PASSWORD = os.getenv("AI_OS_DB_PASSWORD")

if not DB_PASSWORD:
    print("ERROR: Set AI_OS_DB_PASSWORD environment variable")
    sys.exit(1)


STATEMENTS = [
    # 1. Add content_hash to knowledge_entries
    """ALTER TABLE knowledge_entries ADD COLUMN IF NOT EXISTS content_hash TEXT""",

    # 2. Index for content_hash
    """CREATE INDEX IF NOT EXISTS idx_knowledge_entries_content_hash ON knowledge_entries(content_hash)""",

    # 3. Add updated_at to knowledge_embeddings (with default)
    """DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'knowledge_embeddings' AND column_name = 'updated_at'
        ) THEN
            ALTER TABLE knowledge_embeddings ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
        END IF;
    END $$""",

    # 4. Create trigger for updated_at on knowledge_embeddings
    """DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_trigger WHERE tgname = 'knowledge_embeddings_updated_at'
        ) THEN
            CREATE TRIGGER knowledge_embeddings_updated_at
                BEFORE UPDATE ON knowledge_embeddings
                FOR EACH ROW
                EXECUTE FUNCTION moddatetime(updated_at);
        END IF;
    END $$""",

    # 5. Ensure pgcrypto exists
    """CREATE EXTENSION IF NOT EXISTS pgcrypto""",

    # 6. Backfill content_hash for existing entries
    """UPDATE knowledge_entries
       SET content_hash = encode(digest(title || E'\\n\\n' || content, 'sha256'), 'hex')
       WHERE content_hash IS NULL""",

    # 7. Backfill updated_at for existing embeddings
    # Set to created_at so staleness comparison is accurate
    """UPDATE knowledge_embeddings SET updated_at = created_at
       WHERE updated_at > created_at + interval '1 second'""",
]


def main():
    print(f"Connecting to {DB_HOST}:{DB_PORT}/{DB_NAME} as {DB_USER}...")
    conn = pg8000.connect(
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        host=DB_HOST,
        port=DB_PORT,
    )
    conn.autocommit = False
    cursor = conn.cursor()

    try:
        for i, stmt in enumerate(STATEMENTS, 1):
            label = stmt.strip().split("\n")[0][:80]
            print(f"  [{i}/{len(STATEMENTS)}] {label}...")
            cursor.execute(stmt)
            print(f"           OK (rowcount={cursor.rowcount})")

        conn.commit()
        print("\nMigration 021 applied successfully.")

        # Verify
        cursor.execute(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = 'knowledge_entries' AND column_name = 'content_hash'"
        )
        has_hash = cursor.fetchone()
        cursor.execute(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = 'knowledge_embeddings' AND column_name = 'updated_at'"
        )
        has_updated = cursor.fetchone()

        cursor.execute(
            "SELECT COUNT(*) FROM knowledge_entries WHERE content_hash IS NOT NULL"
        )
        hash_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM knowledge_entries")
        total_count = cursor.fetchone()[0]

        print(f"\nVerification:")
        print(f"  knowledge_entries.content_hash column: {'EXISTS' if has_hash else 'MISSING'}")
        print(f"  knowledge_embeddings.updated_at column: {'EXISTS' if has_updated else 'MISSING'}")
        print(f"  Entries with content_hash: {hash_count}/{total_count}")

    except Exception as e:
        conn.rollback()
        print(f"\nERROR: {e}")
        sys.exit(1)
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    main()
