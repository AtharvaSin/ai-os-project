import { notFound } from 'next/navigation';
import { query, queryOne } from '@/lib/db';
import { StatusBadge } from '@/components/StatusBadge';
import { PhaseAccordion } from '@/components/PhaseAccordion';
import { ArtifactSidebar } from '@/components/ArtifactSidebar';
import type { Project, PhaseWithProgress, MilestoneWithTasks, Task, Artifact } from '@/lib/types';
import { ExternalLink, GitBranch } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props) {
  const project = await queryOne<{ name: string }>('SELECT name FROM projects WHERE slug = $1', [params.slug]);
  return { title: project ? `${project.name} — AI OS` : 'Project Not Found' };
}

async function getProjectDetail(slug: string) {
  const project = await queryOne<Project>('SELECT * FROM projects WHERE slug = $1', [slug]);
  if (!project) return null;

  const [phases, milestones, tasks, artifacts, tagRows] = await Promise.all([
    query<Record<string, unknown>>('SELECT * FROM project_phases WHERE project_id = $1 ORDER BY sort_order', [project.id]),
    query<Record<string, unknown>>('SELECT * FROM milestones WHERE project_id = $1 ORDER BY due_date NULLS LAST', [project.id]),
    query<Task>('SELECT * FROM tasks WHERE project_id = $1 ORDER BY CASE priority WHEN \'urgent\' THEN 0 WHEN \'high\' THEN 1 WHEN \'medium\' THEN 2 ELSE 3 END, due_date NULLS LAST', [project.id]),
    query<Artifact>('SELECT * FROM artifacts WHERE project_id = $1 ORDER BY artifact_type, created_at DESC', [project.id]),
    query<{ tag: string }>('SELECT tag FROM project_tags WHERE project_id = $1 ORDER BY tag', [project.id]),
  ]);

  const milestonesWithTasks: MilestoneWithTasks[] = milestones.map((m) => {
    const mTasks = tasks.filter((t) => t.milestone_id === m.id);
    return {
      ...m,
      done_tasks: mTasks.filter((t) => t.status === 'done').length,
      total_tasks: mTasks.length,
      tasks: mTasks,
    } as MilestoneWithTasks;
  });

  const phasesWithProgress: PhaseWithProgress[] = phases.map((p) => {
    const pMilestones = milestonesWithTasks.filter((m) => m.phase_id === p.id);
    return {
      ...p,
      completed_milestones: pMilestones.filter((m) => m.status === 'completed').length,
      total_milestones: pMilestones.length,
      milestones: pMilestones,
    } as PhaseWithProgress;
  });

  return {
    ...project,
    tags: tagRows.map((t) => t.tag),
    phases: phasesWithProgress,
    artifacts,
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const project = await getProjectDetail(params.slug);
  if (!project) notFound();

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Project header */}
      <header className="mb-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl lg:text-4xl text-text-primary">
              {project.name}
            </h1>
            {project.description && (
              <p className="text-text-secondary mt-2 max-w-2xl">{project.description}</p>
            )}
          </div>
          <StatusBadge status={project.status} className="text-sm" />
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-4">
          {project.category && (
            <span className="badge bg-accent-gold/10 text-accent-gold">{project.category}</span>
          )}
          {project.tags.map((tag) => (
            <span key={tag} className="badge bg-hover text-text-secondary">{tag}</span>
          ))}
        </div>

        {project.tech_stack && project.tech_stack.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {project.tech_stack.map((tech) => (
              <span key={tech} className="text-xs font-mono text-text-muted px-2 py-0.5 rounded bg-hover">
                {tech}
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-4 mt-4">
          {project.repo_url && (
            <a href={project.repo_url} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-1.5 text-sm text-accent-purple hover:underline">
              <GitBranch className="h-3.5 w-3.5" /> Repo
            </a>
          )}
          {project.live_url && (
            <a href={project.live_url} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-1.5 text-sm text-accent-teal hover:underline">
              <ExternalLink className="h-3.5 w-3.5" /> Live Site
            </a>
          )}
        </div>
      </header>

      {/* Content grid */}
      <div className="flex flex-col xl:flex-row gap-8">
        {/* Phases + Milestones + Tasks */}
        <div className="flex-1 space-y-4">
          <h2 className="text-sm font-mono text-text-muted uppercase tracking-wider">
            Phases & Milestones
          </h2>
          {project.phases.map((phase) => (
            <PhaseAccordion key={phase.id} phase={phase} />
          ))}
        </div>

        {/* Artifacts sidebar */}
        {project.artifacts.length > 0 && (
          <ArtifactSidebar artifacts={project.artifacts} />
        )}
      </div>
    </div>
  );
}
