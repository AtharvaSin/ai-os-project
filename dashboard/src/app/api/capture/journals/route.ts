import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '30', 10), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);
    const mood = searchParams.get('mood');
    const daysBack = parseInt(searchParams.get('days_back') ?? '30', 10);

    const conditions = ['j.created_at >= NOW() - make_interval(days => $1)'];
    const params: unknown[] = [daysBack];
    let paramIdx = 2;

    if (mood) {
      conditions.push(`j.mood = $${paramIdx}`);
      params.push(mood);
      paramIdx++;
    }

    params.push(limit, offset);

    const journals = await query<Record<string, unknown>>(
      `SELECT
        j.id,
        LEFT(j.content, 400) AS content_preview,
        j.mood,
        j.energy_level,
        j.word_count,
        j.tags,
        j.is_embedded,
        j.distilled_at,
        j.created_at,
        d.name AS domain_name,
        d.slug AS domain_slug
      FROM journals j
      LEFT JOIN life_domains d ON j.domain_id = d.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY j.created_at DESC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      params,
    );

    const total = await query<Record<string, unknown>>(
      `SELECT COUNT(*)::int AS count FROM journals
       WHERE created_at >= NOW() - make_interval(days => $1)`,
      [daysBack],
    );

    return NextResponse.json({
      journals,
      total: Number(total[0]?.count ?? 0),
      limit,
      offset,
    });
  } catch (err) {
    console.error('[api/capture/journals] GET Error:', err);
    return NextResponse.json({ error: 'Failed to fetch journals' }, { status: 500 });
  }
}
