import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await queryOne<Record<string, unknown>>(`
      SELECT
        (SELECT COUNT(*) FROM knowledge_entries)::int AS total_entries,
        (SELECT COUNT(*) FROM knowledge_embeddings)::int AS with_embeddings,
        CASE WHEN (SELECT COUNT(*) FROM knowledge_entries) > 0
             THEN ROUND(
               (SELECT COUNT(*) FROM knowledge_embeddings)::numeric /
               (SELECT COUNT(*) FROM knowledge_entries) * 100, 1
             )
             ELSE 0 END AS embedding_coverage_pct,
        (SELECT COUNT(DISTINCT domain) FROM knowledge_entries)::int AS domain_count,
        (SELECT COUNT(*) FROM knowledge_connections)::int AS connection_count,
        (SELECT MAX(completed_at) FROM knowledge_ingestion_jobs WHERE status = 'completed')::text AS last_ingestion
    `);

    return NextResponse.json({
      total_entries: Number(stats?.total_entries ?? 0),
      with_embeddings: Number(stats?.with_embeddings ?? 0),
      embedding_coverage_pct: Number(stats?.embedding_coverage_pct ?? 0),
      domain_count: Number(stats?.domain_count ?? 0),
      connection_count: Number(stats?.connection_count ?? 0),
      last_ingestion: stats?.last_ingestion ?? null,
    });
  } catch (err) {
    console.error('[api/knowledge-health] GET Error:', err);
    return NextResponse.json({ error: 'Failed to fetch knowledge health' }, { status: 500 });
  }
}
