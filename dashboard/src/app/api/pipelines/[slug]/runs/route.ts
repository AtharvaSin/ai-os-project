import { NextResponse, type NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const pipeline = await queryOne<Record<string, unknown>>(
      `SELECT * FROM pipelines WHERE slug = $1`,
      [slug],
    );

    if (!pipeline) {
      return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });
    }

    const runs = await query<Record<string, unknown>>(
      `SELECT *
       FROM pipeline_runs
       WHERE pipeline_id = $1
       ORDER BY started_at DESC
       LIMIT 20`,
      [pipeline.id],
    );

    return NextResponse.json({ pipeline, runs });
  } catch (err) {
    console.error('[api/pipelines/[slug]/runs] GET Error:', err);
    return NextResponse.json({ error: 'Failed to fetch pipeline runs' }, { status: 500 });
  }
}
