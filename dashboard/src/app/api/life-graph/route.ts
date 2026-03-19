import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { DomainWithCounts, LifeGraphResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/life-graph
 * Returns the full domain tree with computed stats (active tasks, overdue tasks,
 * objectives, automations, health score, health trend) plus a summary rollup.
 */
export async function GET() {
  try {
    /* Fetch all domains with aggregated counts via correlated sub-queries.
       Tasks use ltree descendant matching (d.path <@) so a parent domain's
       counts include all children. Context items and health are per-domain. */
    const rows = await query<DomainWithCounts>(
      `SELECT
         d.*,
         (SELECT COUNT(*) FROM tasks t
          JOIN life_domains td ON t.domain_id = td.id
          WHERE td.path <@ d.path AND t.status NOT IN ('done','cancelled'))::int AS active_tasks,
         (SELECT COUNT(*) FROM tasks t
          JOIN life_domains td ON t.domain_id = td.id
          WHERE td.path <@ d.path AND t.status NOT IN ('done','cancelled')
          AND t.due_date < CURRENT_DATE)::int AS overdue_tasks,
         (SELECT COUNT(*) FROM domain_context_items ci
          WHERE ci.domain_id = d.id AND ci.item_type = 'objective'
          AND ci.status = 'active')::int AS active_objectives,
         (SELECT COUNT(*) FROM domain_context_items ci
          WHERE ci.domain_id = d.id AND ci.item_type = 'automation'
          AND ci.status = 'active')::int AS active_automations,
         (SELECT health_score FROM domain_health_snapshots dh
          WHERE dh.domain_id = d.id
          ORDER BY dh.snapshot_date DESC LIMIT 1) AS health_score
       FROM life_domains d
       WHERE d.status = 'active'
       ORDER BY d.sort_order, d.name`,
    );

    /* Compute health_trend per domain by comparing the two most recent snapshots.
       We do a single query to grab the latest two snapshots for every domain that
       has at least one snapshot, then merge results into a lookup map. */
    const trendRows = await query<{
      domain_id: string;
      health_score: number;
      rn: number;
    }>(
      `SELECT domain_id, health_score, rn::int FROM (
         SELECT domain_id, health_score,
                ROW_NUMBER() OVER (PARTITION BY domain_id ORDER BY snapshot_date DESC) AS rn
         FROM domain_health_snapshots
       ) sub
       WHERE rn <= 2
       ORDER BY domain_id, rn`,
    );

    const trendMap = new Map<string, 'up' | 'down' | 'stable'>();
    const latestByDomain = new Map<string, number>();
    const prevByDomain = new Map<string, number>();

    for (const row of trendRows) {
      if (row.rn === 1) latestByDomain.set(row.domain_id, Number(row.health_score));
      if (row.rn === 2) prevByDomain.set(row.domain_id, Number(row.health_score));
    }

    latestByDomain.forEach((latest, domainId) => {
      const prev = prevByDomain.get(domainId);
      if (prev === undefined) {
        trendMap.set(domainId, 'stable');
      } else if (latest > prev) {
        trendMap.set(domainId, 'up');
      } else if (latest < prev) {
        trendMap.set(domainId, 'down');
      } else {
        trendMap.set(domainId, 'stable');
      }
    });

    /* Attach health_trend to each domain row */
    const domains: DomainWithCounts[] = rows.map((row) => ({
      ...row,
      health_trend: trendMap.get(row.id) ?? null,
    }));

    /* Build summary rollup */
    const summary = {
      total_domains: domains.length,
      active_tasks: domains
        .filter((d) => d.parent_id === null || d.level === 1)
        .reduce((sum, d) => sum + d.active_tasks, 0),
      overdue_tasks: domains
        .filter((d) => d.parent_id === null || d.level === 1)
        .reduce((sum, d) => sum + d.overdue_tasks, 0),
      active_objectives: domains.reduce((sum, d) => sum + d.active_objectives, 0),
    };

    const response: LifeGraphResponse = { domains, summary };

    return NextResponse.json(response);
  } catch (err) {
    console.error('[api/life-graph] GET Error:', err);
    return NextResponse.json({ error: 'Failed to fetch life graph' }, { status: 500 });
  }
}
