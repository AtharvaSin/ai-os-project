"""Extract full schema from ai_os database via Cloud SQL Python Connector."""
import json
import os
from google.cloud.sql.connector import Connector

INSTANCE_CONNECTION_NAME = "bharatvarsh-website:us-central1:bharatvarsh-db"
DB_USER = "ai_os_admin"
DB_NAME = "ai_os"

def get_password() -> str:
    """Get password from Secret Manager or env var."""
    pw = os.environ.get("AI_OS_DB_PASSWORD")
    if pw:
        return pw
    from google.cloud import secretmanager
    client = secretmanager.SecretManagerServiceClient()
    name = "projects/ai-operating-system-490208/secrets/AI_OS_DB_PASSWORD/versions/latest"
    response = client.access_secret_version(request={"name": name})
    return response.payload.data.decode("UTF-8")

def main():
    password = get_password()
    connector = Connector()

    def getconn():
        return connector.connect(
            INSTANCE_CONNECTION_NAME,
            "pg8000",
            user=DB_USER,
            password=password,
            db=DB_NAME,
        )

    conn = getconn()
    cursor = conn.cursor()
    results = {}

    queries = {
        "columns": """
            SELECT table_name, column_name, data_type, column_default, is_nullable, character_maximum_length
            FROM information_schema.columns
            WHERE table_schema = 'public'
            ORDER BY table_name, ordinal_position;
        """,
        "constraints": """
            SELECT tc.table_name, tc.constraint_name, tc.constraint_type, kcu.column_name,
                   ccu.table_name AS foreign_table, ccu.column_name AS foreign_column
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
            WHERE tc.table_schema = 'public'
            ORDER BY tc.table_name;
        """,
        "indexes": """
            SELECT indexname, tablename, indexdef
            FROM pg_indexes
            WHERE schemaname = 'public'
            ORDER BY tablename, indexname;
        """,
        "routines": """
            SELECT routine_name, routine_type, data_type AS return_type
            FROM information_schema.routines
            WHERE routine_schema = 'public';
        """,
        "function_defs": """
            SELECT pg_get_functiondef(oid)
            FROM pg_proc
            WHERE pronamespace = 'public'::regnamespace
              AND prokind = 'f';
        """,
        "extensions": """
            SELECT extname, extversion
            FROM pg_extension
            WHERE extname IN ('vector', 'pg_trgm', 'moddatetime');
        """,
        "triggers": """
            SELECT trigger_name, event_object_table, action_timing, event_manipulation, action_statement
            FROM information_schema.triggers
            WHERE trigger_schema = 'public';
        """,
        "table_stats": """
            SELECT c.relname AS table_name,
                   pg_total_relation_size(c.oid) AS total_bytes,
                   (SELECT count(*) FROM information_schema.columns
                    WHERE table_name = c.relname AND table_schema = 'public') AS column_count
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public' AND c.relkind = 'r'
            ORDER BY c.relname;
        """,
    }

    for key, query in queries.items():
        cursor.execute(query)
        cols = [desc[0] for desc in cursor.description]
        rows = cursor.fetchall()
        data = []
        for row in rows:
            record = {}
            for i, val in enumerate(row):
                if isinstance(val, (int, float, str, bool, type(None))):
                    record[cols[i]] = val
                else:
                    record[cols[i]] = str(val)
            data.append(record)
        results[key] = data

    # Get table names for row counts
    table_names = sorted(set(r["table_name"] for r in results.get("columns", [])))
    row_counts = {}
    for tbl in table_names:
        cursor.execute(f'SELECT count(*) FROM "{tbl}";')
        row_counts[tbl] = cursor.fetchone()[0]
    results["row_counts"] = row_counts

    # Get CHECK constraints
    cursor.execute("""
        SELECT conname AS constraint_name,
               conrelid::regclass::text AS table_name,
               pg_get_constraintdef(oid) AS definition
        FROM pg_constraint
        WHERE contype = 'c' AND connamespace = 'public'::regnamespace
        ORDER BY conrelid::regclass::text, conname;
    """)
    cols = [desc[0] for desc in cursor.description]
    rows = cursor.fetchall()
    results["check_constraints"] = [dict(zip(cols, row)) for row in rows]

    # Get FK ON DELETE behavior
    cursor.execute("""
        SELECT conname AS constraint_name,
               conrelid::regclass::text AS source_table,
               a.attname AS source_column,
               confrelid::regclass::text AS target_table,
               af.attname AS target_column,
               CASE confdeltype
                   WHEN 'a' THEN 'NO ACTION'
                   WHEN 'r' THEN 'RESTRICT'
                   WHEN 'c' THEN 'CASCADE'
                   WHEN 'n' THEN 'SET NULL'
                   WHEN 'd' THEN 'SET DEFAULT'
               END AS on_delete
        FROM pg_constraint c
        JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
        JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
        WHERE c.contype = 'f' AND c.connamespace = 'public'::regnamespace
        ORDER BY source_table, constraint_name;
    """)
    cols = [desc[0] for desc in cursor.description]
    rows = cursor.fetchall()
    results["foreign_keys"] = [dict(zip(cols, row)) for row in rows]

    cursor.close()
    conn.close()
    connector.close()

    print(json.dumps(results, indent=2, default=str))

if __name__ == "__main__":
    main()
