import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Summary stats
    const summary = await queryOne<{
      total_active: string;
      critical_count: string;
      high_count: string;
      projects_affected: string;
      oldest_unresolved_days: string;
    }>(`
      SELECT
        COUNT(*) FILTER (WHERE NOT is_resolved) AS total_active,
        COUNT(*) FILTER (WHERE NOT is_resolved AND severity = 'critical') AS critical_count,
        COUNT(*) FILTER (WHERE NOT is_resolved AND severity = 'high') AS high_count,
        COUNT(DISTINCT project_id) FILTER (WHERE NOT is_resolved) AS projects_affected,
        COALESCE(
          EXTRACT(DAY FROM NOW() - MIN(created_at) FILTER (WHERE NOT is_resolved)),
          0
        )::int AS oldest_unresolved_days
      FROM risk_alerts
    `);

    // Active alerts with project info
    const alerts = await query<Record<string, unknown>>(`
      SELECT ra.*, p.name AS project_name, p.slug AS project_slug
      FROM risk_alerts ra
      JOIN projects p ON ra.project_id = p.id
      WHERE NOT ra.is_resolved
      ORDER BY
        CASE ra.severity
          WHEN 'critical' THEN 0
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          ELSE 3
        END,
        ra.created_at DESC
    `);

    // 14-day velocity data (daily completions per project)
    const velocity = await query<Record<string, unknown>>(`
      SELECT
        d.date::text AS date,
        p.name AS project_name,
        p.slug AS project_slug,
        COALESCE(c.cnt, 0)::int AS completed_count
      FROM generate_series(
        CURRENT_DATE - INTERVAL '13 days',
        CURRENT_DATE,
        '1 day'
      ) AS d(date)
      CROSS JOIN (
        SELECT id, name, slug FROM projects WHERE status = 'active'
      ) p
      LEFT JOIN LATERAL (
        SELECT COUNT(*) AS cnt
        FROM tasks t
        WHERE t.project_id = p.id
          AND t.status = 'done'
          AND t.completed_at::date = d.date
      ) c ON true
      ORDER BY d.date, p.name
    `);

    return NextResponse.json({
      summary: {
        total_active: Number(summary?.total_active ?? 0),
        critical_count: Number(summary?.critical_count ?? 0),
        high_count: Number(summary?.high_count ?? 0),
        projects_affected: Number(summary?.projects_affected ?? 0),
        oldest_unresolved_days: Number(summary?.oldest_unresolved_days ?? 0),
      },
      alerts,
      velocity,
    });
  } catch (err) {
    console.error('[api/risks] GET Error:', err);
    return NextResponse.json({ error: 'Failed to fetch risk data' }, { status: 500 });
  }
}
