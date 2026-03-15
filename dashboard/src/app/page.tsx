import { query } from '@/lib/db';
import { ProjectCard } from '@/components/ProjectCard';
import { MilestoneRibbon } from '@/components/MilestoneRibbon';
import { TodayTasks } from '@/components/TodayTasks';
import type { ProjectWithHealth, HealthColor, Milestone } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function getProjects(): Promise<ProjectWithHealth[]> {
  const rows = await query<Record<string, unknown>>(`
    SELECT
      p.*,
      COALESCE(tc.open_count, 0)::int AS open_task_count,
      COALESCE(tc.overdue_count, 0)::int AS overdue_task_count,
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

  return rows.map((r) => {
    const overdue = Number(r.overdue_task_count);
    let health: HealthColor = 'green';
    if (overdue >= 4) health = 'red';
    else if (overdue >= 1) health = 'gold';
    return { ...r, health, overdue_task_count: overdue, open_task_count: Number(r.open_task_count) } as ProjectWithHealth;
  });
}

async function getUpcomingMilestones(): Promise<(Milestone & { project_name: string })[]> {
  return query<Milestone & { project_name: string }>(`
    SELECT m.*, p.name AS project_name
    FROM milestones m
    JOIN projects p ON p.id = m.project_id
    WHERE m.status IN ('pending', 'in_progress') AND m.due_date IS NOT NULL
    ORDER BY m.due_date ASC
    LIMIT 5
  `);
}

export default async function CommandCenter() {
  const [projects, milestones] = await Promise.all([
    getProjects(),
    getUpcomingMilestones(),
  ]);

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <header>
        <h1 className="font-display text-3xl lg:text-4xl text-text-primary">
          Command Center
        </h1>
        <p className="text-text-secondary mt-1">Project health at a glance</p>
      </header>

      {/* Project health cards */}
      <section>
        <h2 className="text-sm font-mono text-text-muted uppercase tracking-wider mb-4">
          Active Projects
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>

      {/* Milestone ribbon */}
      <section>
        <h2 className="text-sm font-mono text-text-muted uppercase tracking-wider mb-4">
          Upcoming Milestones
        </h2>
        <MilestoneRibbon milestones={milestones} />
      </section>

      {/* Today's tasks */}
      <section>
        <h2 className="text-sm font-mono text-text-muted uppercase tracking-wider mb-4">
          Today&apos;s Tasks
        </h2>
        <TodayTasks />
      </section>
    </div>
  );
}
