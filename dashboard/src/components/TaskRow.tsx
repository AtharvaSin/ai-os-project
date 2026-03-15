'use client';

import { PriorityPill } from './PriorityPill';
import { StatusBadge } from './StatusBadge';
import { cn, formatDate, isOverdue } from '@/lib/utils';
import type { Task, TaskStatus } from '@/lib/types';

interface TaskRowProps {
  task: Task & { project_name?: string; project_slug?: string };
  showProject?: boolean;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  className?: string;
}

export function TaskRow({ task, showProject = false, onStatusChange, className }: TaskRowProps) {
  const overdue = isOverdue(task.due_date) && task.status !== 'done' && task.status !== 'cancelled';

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 border-b transition-colors',
      'border-border hover:bg-hover',
      className,
    )}>
      <input
        type="checkbox"
        checked={task.status === 'done'}
        onChange={() => onStatusChange?.(task.id, task.status === 'done' ? 'todo' : 'done')}
        className="h-4 w-4 rounded border-border bg-card accent-accent-purple shrink-0"
        aria-label={`Mark "${task.title}" as ${task.status === 'done' ? 'todo' : 'done'}`}
      />

      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm truncate',
          task.status === 'done' ? 'line-through text-text-muted' : 'text-text-primary',
        )}>
          {task.title}
        </p>
      </div>

      {showProject && task.project_name && (
        <span className="badge bg-accent-purple/10 text-accent-purple shrink-0">
          {task.project_name}
        </span>
      )}

      <PriorityPill priority={task.priority} />
      <StatusBadge status={task.status} />

      <span className={cn(
        'text-xs font-mono shrink-0 w-20 text-right',
        overdue ? 'text-accent-red' : 'text-text-muted',
      )}>
        {formatDate(task.due_date)}
      </span>
    </div>
  );
}
