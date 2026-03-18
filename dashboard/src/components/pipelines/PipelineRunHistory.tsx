import { cn, pipelineRunStatusColor, formatDate, formatDuration } from '@/lib/utils';
import type { PipelineRun } from '@/lib/types';

interface PipelineRunHistoryProps {
  runs: PipelineRun[];
  loading: boolean;
}

export function PipelineRunHistory({ runs, loading }: PipelineRunHistoryProps) {
  if (loading) {
    return (
      <div className="card mt-2 p-4 text-center text-text-muted text-sm animate-pulse">
        Loading run history...
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="card mt-2 p-4 text-center text-text-muted text-sm">
        No runs recorded yet
      </div>
    );
  }

  return (
    <div className="card mt-2 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="px-3 py-2 text-left font-semibold text-accent-primary uppercase tracking-[0.15em]">
                When
              </th>
              <th className="px-3 py-2 text-left font-semibold text-accent-primary uppercase tracking-[0.15em]">
                Status
              </th>
              <th className="px-3 py-2 text-left font-semibold text-accent-primary uppercase tracking-[0.15em]">
                Duration
              </th>
              <th className="px-3 py-2 text-left font-semibold text-accent-primary uppercase tracking-[0.15em]">
                Tokens
              </th>
              <th className="px-3 py-2 text-left font-semibold text-accent-primary uppercase tracking-[0.15em]">
                Cost
              </th>
              <th className="px-3 py-2 text-left font-semibold text-accent-primary uppercase tracking-[0.15em]">
                Summary
              </th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr
                key={run.id}
                className="border-b border-border last:border-0 hover:bg-hover transition-colors"
              >
                <td className="px-3 py-2 text-text-secondary whitespace-nowrap">
                  {formatDate(run.started_at)}
                </td>
                <td className="px-3 py-2">
                  <span className={cn('badge', pipelineRunStatusColor(run.status))}>
                    {run.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-text-secondary font-mono">
                  {formatDuration(run.duration_ms)}
                </td>
                <td className="px-3 py-2 text-text-secondary font-mono">
                  {run.tokens_used?.toLocaleString() ?? '\u2014'}
                </td>
                <td className="px-3 py-2 text-text-secondary font-mono">
                  {run.cost_estimate_usd != null
                    ? `$${run.cost_estimate_usd.toFixed(4)}`
                    : '\u2014'}
                </td>
                <td className="px-3 py-2 text-text-muted max-w-[200px] truncate">
                  {run.error_message ? (
                    <span className="text-accent-red">{run.error_message}</span>
                  ) : (
                    run.output_summary ?? '\u2014'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
