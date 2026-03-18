import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { query, queryOne } from '@/lib/db';
import { ProjectCard } from '@/components/ProjectCard';
import { MilestoneRibbon } from '@/components/MilestoneRibbon';
import { TodayTasks } from '@/components/TodayTasks';
import { KnowledgeHealthCard } from '@/components/KnowledgeHealthCard';
import { LifeGraphSection } from '@/components/LifeGraphSection';
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

async function getRiskCount(): Promise<{ total: number; critical: number }> {
  try {
    const row = await queryOne<{ total: string; critical: string }>(`
      SELECT
        COUNT(*) FILTER (WHERE NOT is_resolved) AS total,
        COUNT(*) FILTER (WHERE NOT is_resolved AND severity = 'critical') AS critical
      FROM risk_alerts
    `);
    return {
      total: Number(row?.total ?? 0),
      critical: Number(row?.critical ?? 0),
    };
  } catch {
    return { total: 0, critical: 0 };
  }
}

export default async function CommandCenter() {
  const [projects, milestones, riskCount] = await Promise.all([
    getProjects(),
    getUpcomingMilestones(),
    getRiskCount(),
  ]);

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl lg:text-4xl text-text-primary">
            Command Center
          </h1>
          <p className="text-text-secondary mt-1">Project health at a glance</p>
        </div>
        {riskCount.total > 0 && (
          <Link
            href="/risks"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-red/10 hover:bg-accent-red/20 transition-colors"
          >
            <ShieldAlert className="h-4 w-4 text-accent-red" />
            <span className="text-sm font-medium text-accent-red">
              {riskCount.total} active risk{riskCount.total !== 1 ? 's' : ''}
            </span>
            {riskCount.critical > 0 && (
              <span className="badge bg-[#FF6B6B]/20 text-[#FF6B6B] text-[10px]">
                {riskCount.critical} critical
              </span>
            )}
          </Link>
        )}
      </header>

      {/* Project health cards */}
      <section>
        <h2 className="text-[11px] font-semibold text-accent-primary uppercase tracking-[0.15em] mb-4">
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
        <h2 className="text-[11px] font-semibold text-accent-primary uppercase tracking-[0.15em] mb-4">
          Upcoming Milestones
        </h2>
        <MilestoneRibbon milestones={milestones} />
      </section>

      {/* Life Graph */}
      <LifeGraphSection />

      {/* Today's tasks + Knowledge Health */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <h2 className="text-[11px] font-semibold text-accent-primary uppercase tracking-[0.15em] mb-4">
            Today&apos;s Tasks
          </h2>
          <TodayTasks />
        </div>
        <div>
          <h2 className="text-[11px] font-semibold text-accent-primary uppercase tracking-[0.15em] mb-4">
            Knowledge Layer
          </h2>
          <KnowledgeHealthCard />
        </div>
      </section>
    </div>
  );
}
