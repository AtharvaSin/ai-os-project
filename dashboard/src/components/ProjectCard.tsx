import Link from 'next/link';
import { StatusBadge } from './StatusBadge';
import { cn, healthCssColor, formatDate } from '@/lib/utils';
import type { ProjectWithHealth } from '@/lib/types';
import { Folder, AlertTriangle, CheckCircle, Diamond } from 'lucide-react';

interface ProjectCardProps {
  project: ProjectWithHealth;
  className?: string;
}

export function ProjectCard({ project, className }: ProjectCardProps) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className={cn('card-hover block p-5', className)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: healthCssColor(project.health) }}
          />
          <h3 className="font-display text-lg text-text-primary leading-tight">
            {project.name}
          </h3>
        </div>
        <StatusBadge status={project.status} />
      </div>

      {project.category && (
        <p className="text-text-muted text-xs font-mono mb-3">{project.category}</p>
      )}

      <div className="flex items-center gap-4 text-sm text-text-secondary mb-3">
        <span className="flex items-center gap-1.5">
          <Folder className="h-3.5 w-3.5" />
          {project.open_task_count} open
        </span>
        {project.overdue_task_count > 0 && (
          <span className="flex items-center gap-1.5 text-accent-red">
            <AlertTriangle className="h-3.5 w-3.5" />
            {project.overdue_task_count} overdue
          </span>
        )}
        {project.overdue_task_count === 0 && project.open_task_count > 0 && (
          <span className="flex items-center gap-1.5 text-accent-teal">
            <CheckCircle className="h-3.5 w-3.5" />
            On track
          </span>
        )}
      </div>

      {project.next_milestone_name && (
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Diamond className="h-3 w-3 text-accent-primary" />
          <span className="truncate">{project.next_milestone_name}</span>
          {project.next_milestone_date && (
            <span className="shrink-0">· {formatDate(project.next_milestone_date)}</span>
          )}
        </div>
      )}
    </Link>
  );
}
