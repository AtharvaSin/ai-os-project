import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import type { LifeDomain, DomainContextItem, Task, DomainHealthSnapshot } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } },
) {
  try {
    /* 1. Domain info */
    const domain = await queryOne<LifeDomain>(
      'SELECT * FROM life_domains WHERE slug = $1',
      [params.slug],
    );
    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    /* 2. Context items for this domain */
    const contextItems = await query<DomainContextItem>(
      `SELECT * FROM domain_context_items
       WHERE domain_id = $1
       ORDER BY
         CASE status WHEN 'active' THEN 0 WHEN 'paused' THEN 1 ELSE 2 END,
         CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
         target_date NULLS LAST`,
      [domain.id],
    );

    /* 3. Tasks for this domain and all sub-domains (ltree descendant query) */
    const tasks = await query<Task & { domain_name: string; domain_slug: string }>(
      `SELECT t.*, d.name AS domain_name, d.slug AS domain_slug
       FROM tasks t
       JOIN life_domains d ON d.id = t.domain_id
       WHERE d.path <@ $1::ltree
       ORDER BY
         CASE t.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
         t.due_date NULLS LAST`,
      [domain.path],
    );

    /* 4. Latest health snapshot */
    const healthSnapshot = await queryOne<DomainHealthSnapshot>(
      `SELECT * FROM domain_health_snapshots
       WHERE domain_id = $1
       ORDER BY snapshot_date DESC
       LIMIT 1`,
      [domain.id],
    );

    return NextResponse.json({
      data: {
        ...domain,
        context_items: contextItems,
        tasks,
        health_snapshot: healthSnapshot,
      },
    });
  } catch (err) {
    console.error('[api/domains/slug] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch domain' }, { status: 500 });
  }
}
