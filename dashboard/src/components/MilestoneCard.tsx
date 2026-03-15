'use client';

import { useState, useCallback } from 'react';
import { StatusBadge } from './StatusBadge';
import { TaskRow } from './TaskRow';
import { cn, formatDate, isOverdue } from '@/lib/utils';
import type { MilestoneWithTasks, TaskStatus } from '@/lib/types';
import { Diamond, ChevronDown, ChevronRight } from 'lucide-react';

interface MilestoneCardProps {
  milestone: MilestoneWithTasks;
  className?: string;
}

export function MilestoneCard({ milestone, className }: MilestoneCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [tasks, setTasks] = useState(milestone.tasks);
  const overdue = isOverdue(milestone.due_date) && milestone.status !== 'completed';

  const handleStatusChange = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  }, []);

  return (
    <div className={cn('rounded-lg border border-border bg-primary/50', className)}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 hover:bg-hover transition-colors text-left"
      >
        <Diamond className={cn(
          'h-3.5 w-3.5 shrink-0',
          overdue ? 'text-accent-red' : 'text-accent-purple',
        )} />

        <span className="text-sm text-text-primary flex-1 truncate">{milestone.name}</span>

        <span className="text-xs font-mono text-text-muted shrink-0">
          {milestone.done_tasks}/{milestone.total_tasks}
        </span>

        <StatusBadge status={milestone.status} />

        {milestone.due_date && (
          <span className={cn(
            'text-xs font-mono shrink-0',
            overdue ? 'text-accent-red' : 'text-text-muted',
          )}>
            {formatDate(milestone.due_date)}
          </span>
        )}

        {tasks.length > 0 && (
          expanded
            ? <ChevronDown className="h-3.5 w-3.5 text-text-muted shrink-0" />
            : <ChevronRight className="h-3.5 w-3.5 text-text-muted shrink-0" />
        )}
      </button>

      {expanded && tasks.length > 0 && (
        <div className="border-t border-border">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
