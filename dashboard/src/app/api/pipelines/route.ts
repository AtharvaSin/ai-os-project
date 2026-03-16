import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const pipelines = await query<Record<string, unknown>>(`
      SELECT
        p.*,
        lr.id AS latest_run_id,
        lr.status AS latest_run_status,
        lr.trigger_type AS latest_run_trigger,
        lr.started_at AS latest_run_started,
        lr.completed_at AS latest_run_completed,
        lr.duration_ms AS latest_run_duration_ms,
        lr.tokens_used AS latest_run_tokens,
        lr.cost_estimate_usd AS latest_run_cost,
        lr.output_summary AS latest_run_summary,
        lr.error_message AS latest_run_error,
        COALESCE(stats.total_runs, 0)::int AS total_runs,
        COALESCE(stats.success_count, 0)::int AS success_count,
        COALESCE(stats.failed_count, 0)::int AS failed_count,
        CASE WHEN COALESCE(stats.total_runs, 0) > 0
             THEN ROUND(COALESCE(stats.success_count, 0)::numeric / stats.total_runs * 100, 1)
             ELSE 0 END AS success_rate,
        stats.avg_duration_ms::int AS avg_duration_ms
      FROM pipelines p
      LEFT JOIN LATERAL (
        SELECT *
        FROM pipeline_runs pr
        WHERE pr.pipeline_id = p.id
        ORDER BY pr.started_at DESC
        LIMIT 1
      ) lr ON true
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*) AS total_runs,
          COUNT(*) FILTER (WHERE pr.status = 'success') AS success_count,
          COUNT(*) FILTER (WHERE pr.status = 'failed') AS failed_count,
          AVG(pr.duration_ms) AS avg_duration_ms
        FROM pipeline_runs pr
        WHERE pr.pipeline_id = p.id
      ) stats ON true
      ORDER BY p.category, p.name
    `);

    return NextResponse.json({ pipelines });
  } catch (err) {
    console.error('[api/pipelines] GET Error:', err);
    return NextResponse.json({ error: 'Failed to fetch pipelines' }, { status: 500 });
  }
}
