'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn, formatDate, statusColor } from '@/lib/utils';
import { StatusBadge } from './StatusBadge';
import type { GanttPhase, GanttMilestone } from '@/lib/types';
import {
  addWeeks, startOfWeek, endOfWeek, differenceInDays, format,
  isWithinInterval, addDays, max as maxDate, min as minDate,
} from 'date-fns';
import { Diamond, Calendar } from 'lucide-react';

interface GanttChartProps {
  phases: GanttPhase[];
  onMilestoneReschedule: (milestoneId: string, newDate: string) => void;
}

function computeRange(phases: GanttPhase[]): { start: Date; end: Date; weeks: Date[] } {
  const dates: Date[] = [];
  const now = new Date();
  dates.push(now);

  for (const phase of phases) {
    if (phase.started_at) dates.push(new Date(phase.started_at));
    if (phase.completed_at) dates.push(new Date(phase.completed_at));
    for (const m of phase.milestones) {
      if (m.due_date) dates.push(new Date(m.due_date));
    }
  }

  const earliest = startOfWeek(minDate(dates), { weekStartsOn: 1 });
  const latest = endOfWeek(addWeeks(maxDate(dates), 2), { weekStartsOn: 1 });

  const weeks: Date[] = [];
  let current = earliest;
  while (current <= latest) {
    weeks.push(current);
    current = addWeeks(current, 1);
  }

  return { start: earliest, end: latest, weeks };
}

export function GanttChart({ phases, onMilestoneReschedule }: GanttChartProps) {
  const [rescheduleTarget, setRescheduleTarget] = useState<{ id: string; name: string; date: string } | null>(null);
  const [newDate, setNewDate] = useState('');

  const { start, end, weeks } = useMemo(() => computeRange(phases), [phases]);
  const totalDays = differenceInDays(end, start);
  const today = new Date();
  const todayOffset = Math.max(0, Math.min(100, (differenceInDays(today, start) / totalDays) * 100));

  const dayToPercent = (d: Date): number => {
    return Math.max(0, Math.min(100, (differenceInDays(d, start) / totalDays) * 100));
  };

  const closeReschedule = () => {
    setRescheduleTarget(null);
    setNewDate('');
  };

  const handleConfirmReschedule = () => {
    if (rescheduleTarget && newDate) {
      onMilestoneReschedule(rescheduleTarget.id, newDate);
      closeReschedule();
    }
  };

  useEffect(() => {
    if (!rescheduleTarget) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeReschedule();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [rescheduleTarget]);

  return (
    <div className="card overflow-x-auto">
      {/* Header with weeks */}
      <div className="relative min-w-[800px]">
        <div className="flex border-b border-border">
          <div className="w-52 shrink-0 px-4 py-2 border-r border-border">
            <span className="text-xs font-mono text-text-muted">Phase</span>
          </div>
          <div className="flex-1 flex relative">
            {weeks.map((week, i) => (
              <div
                key={i}
                className="flex-1 text-center py-2 border-r border-border last:border-r-0"
              >
                <span className="text-[10px] font-mono text-text-muted">
                  {format(week, 'MMM d')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Phase rows */}
        {phases.map((phase) => {
          const phaseStart = phase.started_at ? new Date(phase.started_at) : today;
          const phaseEnd = phase.completed_at ? new Date(phase.completed_at) : addWeeks(today, 4);
          const leftPct = dayToPercent(phaseStart);
          const widthPct = dayToPercent(phaseEnd) - leftPct;

          return (
            <div key={phase.id} className="flex border-b border-border hover:bg-hover/30 transition-colors">
              {/* Label */}
              <div className="w-52 shrink-0 px-4 py-3 border-r border-border">
                <p className="text-sm text-text-primary truncate">{phase.name}</p>
                <p className="text-[10px] text-text-muted truncate">{phase.project_name}</p>
              </div>

              {/* Bar area */}
              <div className="flex-1 relative py-3 px-2">
                {/* Phase bar */}
                <div
                  className={cn('absolute h-6 rounded-md top-1/2 -translate-y-1/2 opacity-80')}
                  style={{
                    left: `${leftPct}%`,
                    width: `${Math.max(widthPct, 1)}%`,
                    backgroundColor: phase.status === 'completed' ? 'var(--accent-teal)'
                      : phase.status === 'in_progress' ? 'var(--accent-purple)'
                      : phase.status === 'blocked' ? 'var(--accent-red)'
                      : 'var(--text-muted)',
                    opacity: 0.25,
                  }}
                />

                {/* Milestones */}
                {phase.milestones.map((m) => {
                  if (!m.due_date) return null;
                  const mPct = dayToPercent(new Date(m.due_date));
                  const isOverdue = new Date(m.due_date) < today && m.status !== 'completed';
                  return (
                    <button
                      key={m.id}
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 group"
                      style={{ left: `${mPct}%` }}
                      onClick={() => {
                        setRescheduleTarget({ id: m.id, name: m.name, date: m.due_date! });
                        setNewDate(m.due_date!);
                      }}
                      title={`${m.name} — ${formatDate(m.due_date)}`}
                    >
                      <Diamond
                        className={cn(
                          'h-4 w-4 fill-current',
                          isOverdue ? 'text-accent-red'
                            : m.status === 'completed' ? 'text-accent-teal'
                            : 'text-accent-purple',
                        )}
                      />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block whitespace-nowrap">
                        <div className="rounded-md bg-card border border-border px-2 py-1 text-[10px] text-text-primary shadow-lg">
                          {m.name}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Today marker */}
        <div
          className="absolute top-0 bottom-0 w-px bg-accent-red z-20 pointer-events-none"
          style={{ left: `calc(208px + (100% - 208px) * ${todayOffset / 100})` }}
        >
          <div className="absolute -top-0 -translate-x-1/2 bg-accent-red text-white text-[9px] font-mono px-1.5 py-0.5 rounded-b">
            Today
          </div>
        </div>
      </div>

      {/* Reschedule dialog */}
      {rescheduleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={closeReschedule}>
          <div className="card w-full max-w-sm p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg text-text-primary">Reschedule Milestone</h3>
            <p className="text-sm text-text-secondary">{rescheduleTarget.name}</p>
            <div>
              <label className="block text-xs font-mono text-text-muted mb-1">New Date</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-primary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-purple"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={closeReschedule} className="btn-ghost">Cancel</button>
              <button onClick={handleConfirmReschedule} className="btn-primary">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
