import { NextResponse, type NextRequest } from 'next/server';
import { queryOne } from '@/lib/db';
import type { LifeDomain, LifeDomainStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface PatchBody {
  name?: string;
  description?: string | null;
  status?: LifeDomainStatus;
  priority_weight?: number;
  color_code?: string | null;
  icon?: string | null;
  sort_order?: number;
}

/**
 * PATCH /api/life-graph/domains/[id]
 * Updates a life domain. Only fields present in the request body are modified.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = (await req.json()) as PatchBody;

    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (body.name !== undefined) {
      sets.push(`name = $${idx++}`);
      values.push(body.name);
    }
    if (body.description !== undefined) {
      sets.push(`description = $${idx++}`);
      values.push(body.description);
    }
    if (body.status !== undefined) {
      sets.push(`status = $${idx++}`);
      values.push(body.status);
    }
    if (body.priority_weight !== undefined) {
      sets.push(`priority_weight = $${idx++}`);
      values.push(body.priority_weight);
    }
    if (body.color_code !== undefined) {
      sets.push(`color_code = $${idx++}`);
      values.push(body.color_code);
    }
    if (body.icon !== undefined) {
      sets.push(`icon = $${idx++}`);
      values.push(body.icon);
    }
    if (body.sort_order !== undefined) {
      sets.push(`sort_order = $${idx++}`);
      values.push(body.sort_order);
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    /* Always bump updated_at */
    sets.push('updated_at = NOW()');

    values.push(id);
    const domain = await queryOne<LifeDomain>(
      `UPDATE life_domains SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      values,
    );

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    return NextResponse.json({ data: domain });
  } catch (err) {
    console.error('[api/life-graph/domains/[id]] PATCH Error:', err);
    return NextResponse.json({ error: 'Failed to update domain' }, { status: 500 });
  }
}
