import { NextResponse, type NextRequest } from 'next/server';
import { queryOne } from '@/lib/db';
import type { DomainContextItem, CreateContextItemPayload } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/life-graph/context-items
 * Creates a new context item (objective or automation) for a domain.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateContextItemPayload;

    /* Validate required fields */
    if (!body.domain_id) {
      return NextResponse.json({ error: 'domain_id is required' }, { status: 400 });
    }
    if (!body.item_type || !['objective', 'automation'].includes(body.item_type)) {
      return NextResponse.json(
        { error: "item_type is required and must be 'objective' or 'automation'" },
        { status: 400 },
      );
    }
    if (!body.title || !body.title.trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    /* Verify the target domain exists */
    const domainExists = await queryOne<{ id: string }>(
      'SELECT id FROM life_domains WHERE id = $1',
      [body.domain_id],
    );
    if (!domainExists) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    const item = await queryOne<DomainContextItem>(
      `INSERT INTO domain_context_items
         (domain_id, item_type, title, description, priority, target_date, automation_config)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        body.domain_id,
        body.item_type,
        body.title.trim(),
        body.description ?? null,
        body.priority ?? 'medium',
        body.target_date ?? null,
        body.automation_config ? JSON.stringify(body.automation_config) : null,
      ],
    );

    return NextResponse.json({ data: item }, { status: 201 });
  } catch (err) {
    console.error('[api/life-graph/context-items] POST Error:', err);
    return NextResponse.json({ error: 'Failed to create context item' }, { status: 500 });
  }
}
