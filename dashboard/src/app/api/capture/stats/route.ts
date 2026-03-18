import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await queryOne<Record<string, unknown>>(`
      SELECT
        (SELECT COUNT(*) FROM journals)::int AS total_journals,
        (SELECT COUNT(*) FROM journals WHERE created_at >= NOW() - INTERVAL '7 days')::int AS journals_this_week,
        (SELECT COUNT(*) FROM journals WHERE distilled_at IS NULL)::int AS undistilled_journals,
        (SELECT COUNT(*) FROM knowledge_entries WHERE source_type = 'quick_capture')::int AS total_quick_entries,
        (SELECT COUNT(*) FROM knowledge_entries
         WHERE source_type = 'quick_capture'
         AND (metadata->>'analysed_at') IS NULL)::int AS unprocessed_entries,
        (SELECT COUNT(*) FROM knowledge_entries
         WHERE source_type = 'quick_capture'
         AND created_at >= NOW() - INTERVAL '7 days')::int AS entries_this_week,
        (SELECT COUNT(*) FROM knowledge_entries WHERE source_type = 'journal_entry')::int AS distilled_entries
    `);

    return NextResponse.json({
      total_journals: Number(stats?.total_journals ?? 0),
      journals_this_week: Number(stats?.journals_this_week ?? 0),
      undistilled_journals: Number(stats?.undistilled_journals ?? 0),
      total_quick_entries: Number(stats?.total_quick_entries ?? 0),
      unprocessed_entries: Number(stats?.unprocessed_entries ?? 0),
      entries_this_week: Number(stats?.entries_this_week ?? 0),
      distilled_entries: Number(stats?.distilled_entries ?? 0),
    });
  } catch (err) {
    console.error('[api/capture/stats] GET Error:', err);
    return NextResponse.json({ error: 'Failed to fetch capture stats' }, { status: 500 });
  }
}
