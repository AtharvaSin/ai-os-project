'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { StatusBadge } from './StatusBadge';
import { MilestoneCard } from './MilestoneCard';
import type { PhaseWithProgress } from '@/lib/types';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface PhaseAccordionProps {
  phase: PhaseWithProgress;
  className?: string;
}

export function PhaseAccordion({ phase, className }: PhaseAccordionProps) {
  const [open, setOpen] = useState(phase.status === 'in_progress');
  const progress = phase.total_milestones > 0
    ? Math.round((phase.completed_milestones / phase.total_milestones) * 100)
    : 0;

  return (
    <div className={cn('card overflow-hidden', className)}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 hover:bg-hover transition-colors text-left"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 text-text-muted shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-text-muted shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-text-primary truncate">
              {phase.name}
            </h3>
            <StatusBadge status={phase.status} />
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex-1 h-1.5 rounded-full bg-hover overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${progress}%`,
                  backgroundColor: progress === 100 ? 'var(--accent-teal)' : 'var(--accent-purple)',
                }}
              />
            </div>
            <span className="text-xs font-mono text-text-muted shrink-0">
              {phase.completed_milestones}/{phase.total_milestones}
            </span>
          </div>
        </div>
      </button>

      {open && phase.milestones.length > 0 && (
        <div className="border-t border-border p-4 space-y-3">
          {phase.milestones.map((milestone) => (
            <MilestoneCard key={milestone.id} milestone={milestone} />
          ))}
        </div>
      )}
    </div>
  );
}
