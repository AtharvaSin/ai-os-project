import { NextResponse, type NextRequest } from 'next/server';
import { queryOne } from '@/lib/db';
import type { Milestone, MilestoneStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface PatchBody {
  due_date?: string | null;
  status?: MilestoneStatus;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = (await req.json()) as PatchBody;
    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (body.due_date !== undefined) {
      sets.push(`due_date = $${idx++}`);
      values.push(body.due_date);
    }
    if (body.status !== undefined) {
      sets.push(`status = $${idx++}`);
      values.push(body.status);
      if (body.status === 'completed') {
        sets.push('completed_at = NOW()');
      }
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(params.id);
    const milestone = await queryOne<Milestone>(
      `UPDATE milestones SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      values,
    );

    if (!milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    return NextResponse.json({ data: milestone });
  } catch (err) {
    console.error('[api/milestones/id] PATCH Error:', err);
    return NextResponse.json({ error: 'Failed to update milestone' }, { status: 500 });
  }
}
