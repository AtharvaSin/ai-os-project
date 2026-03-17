import { NextResponse, type NextRequest } from 'next/server';
import { queryOne } from '@/lib/db';
import type { LifeDomain, CreateDomainPayload } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/life-graph/domains
 * Creates a new life domain. The database trigger automatically computes
 * the `path` (ltree) and `level` fields from `parent_id`.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateDomainPayload;

    /* Validate required fields */
    if (!body.slug || !body.slug.trim()) {
      return NextResponse.json({ error: 'slug is required' }, { status: 400 });
    }
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }
    if (!body.parent_id) {
      return NextResponse.json({ error: 'parent_id is required' }, { status: 400 });
    }

    const domain = await queryOne<LifeDomain>(
      `INSERT INTO life_domains (name, slug, parent_id, domain_number, description, color_code)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        body.name.trim(),
        body.slug.trim(),
        body.parent_id,
        body.domain_number ?? null,
        body.description ?? null,
        body.color_code ?? null,
      ],
    );

    return NextResponse.json({ data: domain }, { status: 201 });
  } catch (err) {
    console.error('[api/life-graph/domains] POST Error:', err);

    /* Handle unique constraint violation on slug */
    const message = err instanceof Error ? err.message : '';
    if (message.includes('unique') || message.includes('duplicate')) {
      return NextResponse.json(
        { error: 'A domain with this slug already exists' },
        { status: 409 },
      );
    }

    return NextResponse.json({ error: 'Failed to create domain' }, { status: 500 });
  }
}
