import { cn, priorityColor } from '@/lib/utils';
import type { TaskPriority } from '@/lib/types';

interface PriorityPillProps {
  priority: TaskPriority;
  className?: string;
}

const labels: Record<TaskPriority, string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export function PriorityPill({ priority, className }: PriorityPillProps) {
  return (
    <span className={cn('badge', priorityColor(priority), className)}>
      {labels[priority]}
    </span>
  );
}
