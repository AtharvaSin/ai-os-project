import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import type { Project, PhaseWithProgress, MilestoneWithTasks, Task, Artifact } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } },
) {
  try {
    const project = await queryOne<Project>(
      'SELECT * FROM projects WHERE slug = $1',
      [params.slug],
    );
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const phases = await query<{
      id: string;
      project_id: string;
      name: string;
      description: string | null;
      status: string;
      sort_order: number;
      started_at: string | null;
      completed_at: string | null;
      created_at: string;
    }>(
      'SELECT * FROM project_phases WHERE project_id = $1 ORDER BY sort_order',
      [project.id],
    );

    const milestones = await query<{
      id: string;
      phase_id: string;
      project_id: string;
      name: string;
      description: string | null;
      status: string;
      due_date: string | null;
      completed_at: string | null;
      created_at: string;
    }>(
      'SELECT * FROM milestones WHERE project_id = $1 ORDER BY due_date NULLS LAST',
      [project.id],
    );

    const tasks = await query<Task>(
      'SELECT * FROM tasks WHERE project_id = $1 ORDER BY priority DESC, due_date NULLS LAST',
      [project.id],
    );

    const artifacts = await query<Artifact>(
      'SELECT * FROM artifacts WHERE project_id = $1 ORDER BY artifact_type, created_at DESC',
      [project.id],
    );

    const tags = await query<{ tag: string }>(
      'SELECT tag FROM project_tags WHERE project_id = $1 ORDER BY tag',
      [project.id],
    );

    const milestonesWithTasks: MilestoneWithTasks[] = milestones.map((m) => {
      const mTasks = tasks.filter((t) => t.milestone_id === m.id);
      return {
        ...m,
        status: m.status as MilestoneWithTasks['status'],
        done_tasks: mTasks.filter((t) => t.status === 'done').length,
        total_tasks: mTasks.length,
        tasks: mTasks,
      };
    });

    const phasesWithProgress: PhaseWithProgress[] = phases.map((p) => {
      const pMilestones = milestonesWithTasks.filter((m) => m.phase_id === p.id);
      return {
        ...p,
        status: p.status as PhaseWithProgress['status'],
        completed_milestones: pMilestones.filter((m) => m.status === 'completed').length,
        total_milestones: pMilestones.length,
        milestones: pMilestones,
      };
    });

    const unassignedTasks = tasks.filter((t) => !t.milestone_id);

    return NextResponse.json({
      data: {
        ...project,
        tags: tags.map((t) => t.tag),
        phases: phasesWithProgress,
        unassigned_tasks: unassignedTasks,
        artifacts,
      },
    });
  } catch (err) {
    console.error('[api/projects/slug] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}
