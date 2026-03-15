import { NextResponse, type NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db';
import type { Task, CreateTaskPayload } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const filter = searchParams.get('filter');
    const projectId = searchParams.get('project_id');
    const priorities = searchParams.getAll('priority');
    const statuses = searchParams.getAll('status');

    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (filter === 'today') {
      conditions.push(`(t.due_date = CURRENT_DATE OR (t.due_date < CURRENT_DATE AND t.status NOT IN ('done','cancelled')))`);
    }

    if (projectId) {
      conditions.push(`t.project_id = $${idx++}`);
      params.push(projectId);
    }

    if (priorities.length > 0) {
      conditions.push(`t.priority = ANY($${idx++}::task_priority[])`);
      params.push(priorities);
    }

    if (statuses.length > 0) {
      conditions.push(`t.status = ANY($${idx++}::task_status[])`);
      params.push(statuses);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const rows = await query<Task & { project_name: string; project_slug: string }>(
      `SELECT t.*, p.name AS project_name, p.slug AS project_slug
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       ${where}
       ORDER BY
         CASE t.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
         t.due_date NULLS LAST`,
      params,
    );

    return NextResponse.json({ data: rows });
  } catch (err) {
    console.error('[api/tasks] GET Error:', err);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateTaskPayload;

    if (!body.title || !body.project_id) {
      return NextResponse.json({ error: 'title and project_id are required' }, { status: 400 });
    }

    const task = await queryOne<Task>(
      `INSERT INTO tasks (title, project_id, milestone_id, priority, due_date, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        body.title,
        body.project_id,
        body.milestone_id ?? null,
        body.priority ?? 'medium',
        body.due_date ?? null,
        body.description ?? null,
      ],
    );

    return NextResponse.json({ data: task }, { status: 201 });
  } catch (err) {
    console.error('[api/tasks] POST Error:', err);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
