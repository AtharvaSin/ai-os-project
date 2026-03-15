import { NextResponse, type NextRequest } from 'next/server';
import { queryOne } from '@/lib/db';
import type { Task, TaskStatus, TaskPriority } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface PatchBody {
  status?: TaskStatus;
  priority?: TaskPriority;
  title?: string;
  due_date?: string | null;
  description?: string | null;
  milestone_id?: string | null;
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

    if (body.status !== undefined) {
      sets.push(`status = $${idx++}`);
      values.push(body.status);
      if (body.status === 'done') {
        sets.push(`completed_at = NOW()`);
      }
    }
    if (body.priority !== undefined) {
      sets.push(`priority = $${idx++}`);
      values.push(body.priority);
    }
    if (body.title !== undefined) {
      sets.push(`title = $${idx++}`);
      values.push(body.title);
    }
    if (body.due_date !== undefined) {
      sets.push(`due_date = $${idx++}`);
      values.push(body.due_date);
    }
    if (body.description !== undefined) {
      sets.push(`description = $${idx++}`);
      values.push(body.description);
    }
    if (body.milestone_id !== undefined) {
      sets.push(`milestone_id = $${idx++}`);
      values.push(body.milestone_id);
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(params.id);
    const task = await queryOne<Task>(
      `UPDATE tasks SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      values,
    );

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ data: task });
  } catch (err) {
    console.error('[api/tasks/id] PATCH Error:', err);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}
