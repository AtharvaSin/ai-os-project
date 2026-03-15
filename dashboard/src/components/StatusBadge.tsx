import { cn, statusColor } from '@/lib/utils';
import type { TaskStatus, MilestoneStatus, PhaseStatus, ProjectStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: TaskStatus | MilestoneStatus | PhaseStatus | ProjectStatus;
  className?: string;
}

const labels: Record<string, string> = {
  todo: 'Todo',
  not_started: 'Not Started',
  pending: 'Pending',
  planning: 'Planning',
  in_progress: 'In Progress',
  active: 'Active',
  done: 'Done',
  completed: 'Completed',
  blocked: 'Blocked',
  missed: 'Missed',
  cancelled: 'Cancelled',
  paused: 'Paused',
  archived: 'Archived',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn('badge', statusColor(status), className)}>
      {labels[status] ?? status}
    </span>
  );
}
