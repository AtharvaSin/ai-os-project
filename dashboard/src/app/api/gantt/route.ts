import { NextResponse, type NextRequest } from 'next/server';
import { query } from '@/lib/db';
import type { GanttPhase, GanttMilestone, PhaseStatus, MilestoneStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('project_id');

    const condition = projectId ? 'WHERE pp.project_id = $1' : '';
    const params = projectId ? [projectId] : [];

    const phases = await query<{
      id: string;
      project_id: string;
      project_name: string;
      name: string;
      status: string;
      started_at: string | null;
      completed_at: string | null;
      sort_order: number;
    }>(
      `SELECT pp.*, p.name AS project_name
       FROM project_phases pp
       JOIN projects p ON p.id = pp.project_id
       ${condition}
       ORDER BY p.name, pp.sort_order`,
      params,
    );

    const phaseIds = phases.map((p) => p.id);
    if (phaseIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const milestones = await query<{
      id: string;
      phase_id: string;
      name: string;
      status: string;
      due_date: string | null;
    }>(
      `SELECT id, phase_id, name, status, due_date::text
       FROM milestones
       WHERE phase_id = ANY($1::uuid[])
       ORDER BY due_date NULLS LAST`,
      [phaseIds],
    );

    const result: GanttPhase[] = phases.map((p) => ({
      id: p.id,
      project_id: p.project_id,
      project_name: p.project_name,
      name: p.name,
      status: p.status as PhaseStatus,
      started_at: p.started_at,
      completed_at: p.completed_at,
      milestones: milestones
        .filter((m) => m.phase_id === p.id)
        .map((m): GanttMilestone => ({
          id: m.id,
          name: m.name,
          status: m.status as MilestoneStatus,
          due_date: m.due_date,
        })),
    }));

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error('[api/gantt] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch gantt data' }, { status: 500 });
  }
}
