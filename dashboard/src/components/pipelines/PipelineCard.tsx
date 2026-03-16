import { cn, formatDate, formatDuration } from '@/lib/utils';
import {
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { PipelineWithStats } from '@/lib/types';

interface PipelineCardProps {
  pipeline: PipelineWithStats;
  isExpanded: boolean;
  onToggle: () => void;
}

export function PipelineCard({ pipeline, isExpanded, onToggle }: PipelineCardProps) {
  const p = pipeline;
  const categoryColor =
    p.category === 'B'
      ? 'bg-accent-teal/15 text-accent-teal'
      : 'bg-accent-purple/15 text-accent-purple';

  /*
   * The /api/pipelines endpoint returns flat fields from a LATERAL join
   * (e.g. latest_run_status, latest_run_started, latest_run_duration_ms)
   * rather than a nested latest_run object. We handle both shapes here
   * for resilience.
   */
  const raw = p as unknown as Record<string, unknown>;
  const latestRunStatus =
    (raw.latest_run_status as string | null) ?? p.latest_run?.status ?? null;
  const latestRunStarted =
    (raw.latest_run_started as string | null) ?? p.latest_run?.started_at ?? null;
  const latestRunDuration =
    (raw.latest_run_duration_ms as number | null) ?? p.latest_run?.duration_ms ?? null;

  let statusDot = 'bg-text-muted'; // no runs
  if (latestRunStatus === 'success') statusDot = 'bg-accent-teal';
  else if (latestRunStatus === 'failed') statusDot = 'bg-accent-red';
  else if (latestRunStatus === 'running') statusDot = 'bg-accent-purple animate-pulse';

  return (
    <div
      className={cn(
        'card p-4 cursor-pointer transition-colors hover:bg-hover',
        isExpanded && 'border-accent-purple/30',
      )}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn('h-2 w-2 rounded-full shrink-0', statusDot)} />
          <h3 className="text-sm font-medium text-text-primary">{p.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('badge text-[10px]', categoryColor)}>Cat {p.category}</span>
          {isExpanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-text-muted" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
          )}
        </div>
      </div>

      {/* Description */}
      {p.description && (
        <p className="text-xs text-text-muted mb-3 line-clamp-2">{p.description}</p>
      )}

      {/* Schedule */}
      {p.schedule && (
        <div className="flex items-center gap-1.5 text-xs text-text-muted mb-3">
          <Clock className="h-3 w-3" />
          {p.schedule}
        </div>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-text-secondary">
        <span className="flex items-center gap-1">
          <Activity className="h-3 w-3" />
          {p.total_runs} runs
        </span>
        {p.total_runs > 0 && (
          <>
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-accent-teal" />
              {p.success_rate}%
            </span>
            {p.failed_count > 0 && (
              <span className="flex items-center gap-1">
                <XCircle className="h-3 w-3 text-accent-red" />
                {p.failed_count} failed
              </span>
            )}
          </>
        )}
      </div>

      {/* Latest run footer */}
      {latestRunStarted && (
        <div className="mt-2 pt-2 border-t border-border flex items-center justify-between text-[10px] text-text-muted">
          <span>Last: {formatDate(latestRunStarted)}</span>
          <span>{formatDuration(latestRunDuration)}</span>
        </div>
      )}
    </div>
  );
}
