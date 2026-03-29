"""One-shot backfill: generate embeddings for all unembedded Bharatvarsh entries."""

import hashlib
import json
import os
import uuid

import pg8000
from openai import OpenAI

DB_HOST = os.getenv("DB_HOST", "35.222.127.23")
DB_PASSWORD = os.getenv("AI_OS_DB_PASSWORD", "")
OPENAI_KEY = os.getenv("OPENAI_API_KEY", "")
MODEL = "text-embedding-3-small"
BATCH_SIZE = 50


def main():
    conn = pg8000.connect(
        user="ai_os_admin", password=DB_PASSWORD,
        database="ai_os", host=DB_HOST, port=5432,
    )
    cursor = conn.cursor()

    # Fetch all unembedded Bharatvarsh entries
    cursor.execute("""
        SELECT ke.id, ke.title, ke.content
        FROM knowledge_entries ke
        LEFT JOIN knowledge_embeddings kv ON kv.entry_id = ke.id
        WHERE kv.id IS NULL AND ke.sub_domain = 'bharatvarsh'
        ORDER BY ke.created_at ASC
    """)
    rows = cursor.fetchall()
    cols = [d[0] for d in cursor.description]
    entries = [dict(zip(cols, r)) for r in rows]
    print(f"Found {len(entries)} unembedded Bharatvarsh entries")

    if not entries:
        print("Nothing to do.")
        cursor.close()
        conn.close()
        return

    client = OpenAI(api_key=OPENAI_KEY)
    total_tokens = 0
    total_embedded = 0

    total_batches = (len(entries) + BATCH_SIZE - 1) // BATCH_SIZE

    for i in range(0, len(entries), BATCH_SIZE):
        batch = entries[i:i + BATCH_SIZE]
        texts = [e["title"] + "\n\n" + e["content"] for e in batch]

        resp = client.embeddings.create(input=texts, model=MODEL)
        embeddings = [item.embedding for item in resp.data]
        total_tokens += resp.usage.total_tokens

        for entry, emb in zip(batch, embeddings):
            vec_str = "[" + ", ".join(str(v) for v in emb) + "]"
            cursor.execute(
                """
                INSERT INTO knowledge_embeddings (entry_id, embedding, model_used, updated_at)
                VALUES (%s, %s, %s, NOW())
                ON CONFLICT (entry_id) DO UPDATE SET
                    embedding = EXCLUDED.embedding,
                    model_used = EXCLUDED.model_used,
                    updated_at = NOW()
                """,
                (str(entry["id"]), vec_str, MODEL),
            )

            # Sync content_hash
            text = entry["title"] + "\n\n" + entry["content"]
            content_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()
            cursor.execute(
                "UPDATE knowledge_entries SET content_hash = %s WHERE id = %s AND content_hash IS NULL",
                (content_hash, str(entry["id"])),
            )

        conn.commit()
        total_embedded += len(batch)
        batch_num = i // BATCH_SIZE + 1
        print(f"  Batch {batch_num}/{total_batches}: embedded {len(batch)} entries ({total_tokens} tokens so far)")

    # Log the job
    job_id = str(uuid.uuid4())
    cost = round(total_tokens * 0.02 / 1_000_000, 6)
    meta = json.dumps({
        "model": MODEL,
        "batch_size": total_embedded,
        "tokens_used": total_tokens,
        "cost_usd": cost,
        "scope": "bharatvarsh_backfill",
    })
    cursor.execute(
        """
        INSERT INTO knowledge_ingestion_jobs
            (id, job_type, status, entries_created, embeddings_generated,
             tokens_used, cost_estimate_usd, metadata)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (job_id, "embedding_batch", "success", 0, total_embedded,
         total_tokens, cost, meta),
    )
    conn.commit()

    print(f"\nDone! Embedded {total_embedded} Bharatvarsh entries")
    print(f"Tokens used: {total_tokens}")
    print(f"Cost: ${cost:.4f}")

    # Verify
    cursor.execute("""
        SELECT COUNT(*) FROM knowledge_entries ke
        INNER JOIN knowledge_embeddings kv ON kv.entry_id = ke.id
        WHERE ke.sub_domain = 'bharatvarsh'
    """)
    embedded_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM knowledge_entries WHERE sub_domain = 'bharatvarsh'")
    total_count = cursor.fetchone()[0]
    print(f"Bharatvarsh coverage: {embedded_count}/{total_count} ({100 * embedded_count // total_count}%)")

    cursor.close()
    conn.close()


if __name__ == "__main__":
    main()
