import { NextResponse, type NextRequest } from 'next/server';
import { queryOne } from '@/lib/db';
import type { DomainContextItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface PatchBody {
  status?: string;
  progress_pct?: number;
  title?: string;
  description?: string | null;
}

/**
 * PATCH /api/life-graph/context-items/[id]
 * Updates a context item. Only fields present in the request body are modified.
 * Setting status to 'completed' automatically sets completed_at to NOW().
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

    if (body.title !== undefined) {
      sets.push(`title = $${idx++}`);
      values.push(body.title);
    }
    if (body.description !== undefined) {
      sets.push(`description = $${idx++}`);
      values.push(body.description);
    }
    if (body.status !== undefined) {
      sets.push(`status = $${idx++}`);
      values.push(body.status);

      /* Auto-set completed_at when marking as completed */
      if (body.status === 'completed') {
        sets.push('completed_at = NOW()');
      }
    }
    if (body.progress_pct !== undefined) {
      sets.push(`progress_pct = $${idx++}`);
      values.push(body.progress_pct);
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    /* Always bump updated_at */
    sets.push('updated_at = NOW()');

    values.push(id);
    const item = await queryOne<DomainContextItem>(
      `UPDATE domain_context_items SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      values,
    );

    if (!item) {
      return NextResponse.json({ error: 'Context item not found' }, { status: 404 });
    }

    return NextResponse.json({ data: item });
  } catch (err) {
    console.error('[api/life-graph/context-items/[id]] PATCH Error:', err);
    return NextResponse.json({ error: 'Failed to update context item' }, { status: 500 });
  }
}
