import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { ProjectWithHealth, HealthColor } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows = await query<{
      id: string;
      name: string;
      slug: string;
      description: string | null;
      status: string;
      category: string | null;
      tech_stack: string[] | null;
      repo_url: string | null;
      live_url: string | null;
      owner: string;
      metadata: Record<string, unknown>;
      created_at: string;
      updated_at: string;
      open_task_count: string;
      overdue_task_count: string;
      next_milestone_name: string | null;
      next_milestone_date: string | null;
      tags: string[];
    }>(`
      SELECT
        p.*,
        COALESCE(tc.open_count, 0)::text AS open_task_count,
        COALESCE(tc.overdue_count, 0)::text AS overdue_task_count,
        nm.name AS next_milestone_name,
        nm.due_date::text AS next_milestone_date,
        COALESCE(tg.tags, ARRAY[]::text[]) AS tags
      FROM projects p
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*) FILTER (WHERE t.status NOT IN ('done','cancelled')) AS open_count,
          COUNT(*) FILTER (WHERE t.due_date < CURRENT_DATE AND t.status NOT IN ('done','cancelled')) AS overdue_count
        FROM tasks t WHERE t.project_id = p.id
      ) tc ON true
      LEFT JOIN LATERAL (
        SELECT m.name, m.due_date
        FROM milestones m
        WHERE m.project_id = p.id AND m.status IN ('pending','in_progress') AND m.due_date IS NOT NULL
        ORDER BY m.due_date ASC
        LIMIT 1
      ) nm ON true
      LEFT JOIN LATERAL (
        SELECT array_agg(pt.tag) AS tags
        FROM project_tags pt WHERE pt.project_id = p.id
      ) tg ON true
      WHERE p.status IN ('active','planning')
      ORDER BY p.name
    `);

    const projects: ProjectWithHealth[] = rows.map((r) => {
      const overdue = parseInt(r.overdue_task_count, 10);
      let health: HealthColor = 'green';
      if (overdue >= 4) health = 'red';
      else if (overdue >= 1) health = 'gold';

      return {
        id: r.id,
        name: r.name,
        slug: r.slug,
        description: r.description,
        status: r.status as ProjectWithHealth['status'],
        category: r.category,
        tech_stack: r.tech_stack,
        repo_url: r.repo_url,
        live_url: r.live_url,
        owner: r.owner,
        metadata: r.metadata,
        created_at: r.created_at,
        updated_at: r.updated_at,
        open_task_count: parseInt(r.open_task_count, 10),
        overdue_task_count: overdue,
        health,
        next_milestone_name: r.next_milestone_name,
        next_milestone_date: r.next_milestone_date,
        tags: r.tags ?? [],
      };
    });

    return NextResponse.json({ data: projects });
  } catch (err) {
    console.error('[api/projects] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}
