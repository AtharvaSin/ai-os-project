import { cn, formatDate, isOverdue } from '@/lib/utils';
import { StatusBadge } from './StatusBadge';
import { Diamond } from 'lucide-react';
import type { Milestone } from '@/lib/types';

interface MilestoneRibbonProps {
  milestones: (Milestone & { project_name?: string })[];
  className?: string;
}

export function MilestoneRibbon({ milestones, className }: MilestoneRibbonProps) {
  if (milestones.length === 0) return null;

  return (
    <div className={cn('overflow-x-auto', className)}>
      <div className="flex gap-3 pb-2" style={{ minWidth: 'max-content' }}>
        {milestones.map((m) => {
          const overdue = isOverdue(m.due_date) && m.status !== 'completed';
          return (
            <div
              key={m.id}
              className="card-hover flex items-start gap-3 px-4 py-3 min-w-[220px] max-w-[280px]"
            >
              <Diamond className={cn(
                'h-4 w-4 mt-0.5 shrink-0',
                overdue ? 'text-accent-red' : 'text-accent-primary',
              )} />
              <div className="min-w-0">
                <p className="text-sm text-text-primary truncate">{m.name}</p>
                {m.project_name && (
                  <p className="text-xs text-text-muted mt-0.5">{m.project_name}</p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <StatusBadge status={m.status} />
                  {m.due_date && (
                    <span className={cn(
                      'text-xs font-mono',
                      overdue ? 'text-accent-red' : 'text-text-muted',
                    )}>
                      {formatDate(m.due_date)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
