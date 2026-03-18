import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    const entries = await query<Record<string, unknown>>(
      `SELECT
        ke.id,
        ke.title,
        LEFT(ke.content, 300) AS content_preview,
        ke.domain,
        ke.tags,
        ke.metadata,
        ke.created_at,
        (ke.metadata->>'capture_type') AS capture_type,
        (ke.metadata->>'urgency') AS urgency,
        (ke.metadata->>'source_interface') AS source_interface,
        (ke.metadata->>'analysed_at') AS analysed_at
      FROM knowledge_entries ke
      WHERE ke.source_type = 'quick_capture'
      ORDER BY ke.created_at DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset],
    );

    const total = await query<Record<string, unknown>>(
      `SELECT COUNT(*)::int AS count FROM knowledge_entries WHERE source_type = 'quick_capture'`,
    );

    return NextResponse.json({
      entries,
      total: Number(total[0]?.count ?? 0),
      limit,
      offset,
    });
  } catch (err) {
    console.error('[api/capture/inbox] GET Error:', err);
    return NextResponse.json({ error: 'Failed to fetch inbox' }, { status: 500 });
  }
}
