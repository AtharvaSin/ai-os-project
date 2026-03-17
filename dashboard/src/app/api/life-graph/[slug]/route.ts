import { NextResponse, type NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db';
import type {
  LifeDomain,
  DomainContextItem,
  Task,
  DomainHealthSnapshot,
  DomainDetailResponse,
} from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/life-graph/[slug]
 * Returns full detail for a single domain: domain info, context items,
 * recursive task list (via ltree), health history, and ancestor breadcrumb.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    /* 1. Domain info */
    const domain = await queryOne<LifeDomain>(
      'SELECT * FROM life_domains WHERE slug = $1',
      [slug],
    );

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    /* 2-5: Run remaining queries in parallel for performance */
    const [contextItems, tasks, healthSnapshots, breadcrumb] = await Promise.all([
      /* 2. Context items for this domain */
      query<DomainContextItem>(
        `SELECT * FROM domain_context_items
         WHERE domain_id = $1
         ORDER BY item_type,
           CASE status WHEN 'active' THEN 0 WHEN 'paused' THEN 1 ELSE 2 END,
           created_at`,
        [domain.id],
      ),

      /* 3. Tasks for this domain and all sub-domains (ltree descendant match) */
      query<Task & { domain_name: string; domain_slug: string }>(
        `SELECT t.*, d.name AS domain_name, d.slug AS domain_slug
         FROM tasks t
         JOIN life_domains d ON t.domain_id = d.id
         WHERE d.path <@ $1::ltree
         ORDER BY
           CASE t.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
           t.due_date NULLS LAST`,
        [domain.path],
      ),

      /* 4. Health history — last 8 snapshots */
      query<DomainHealthSnapshot>(
        `SELECT * FROM domain_health_snapshots
         WHERE domain_id = $1
         ORDER BY snapshot_date DESC
         LIMIT 8`,
        [domain.id],
      ),

      /* 5. Breadcrumb — all ancestors (and self) via ltree ancestor match */
      query<{ depth: number; name: string; slug: string }>(
        `SELECT (nlevel(d.path) - 1)::int AS depth, d.name, d.slug
         FROM life_domains d
         WHERE d.path @> (SELECT path FROM life_domains WHERE slug = $1)
         ORDER BY d.path`,
        [slug],
      ),
    ]);

    const response: { data: DomainDetailResponse } = {
      data: {
        domain,
        context_items: contextItems,
        tasks,
        health_snapshots: healthSnapshots,
        breadcrumb,
      },
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('[api/life-graph/[slug]] GET Error:', err);
    return NextResponse.json({ error: 'Failed to fetch domain detail' }, { status: 500 });
  }
}
