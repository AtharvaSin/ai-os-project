'use client';

import type { ContentPipelineSummary, ContentPostStatus } from '@/lib/types';
import { cn, contentPostStatusColor, contentPostStatusLabel } from '@/lib/utils';

interface PipelineSummaryProps {
  summary: ContentPipelineSummary;
}

/** Ordered pipeline stages for display */
const STATUS_ORDER: ContentPostStatus[] = [
  'planned', 'prompt_ready', 'awaiting_image', 'image_uploaded',
  'rendered', 'approved', 'scheduled', 'published', 'failed',
];

export function PipelineSummary({ summary }: PipelineSummaryProps) {
  const total = summary.total;
  const completedCount =
    (summary.by_status.approved ?? 0) +
    (summary.by_status.scheduled ?? 0) +
    (summary.by_status.published ?? 0);
  const progressPct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <div className="card p-5">
      {/* Top row: total + progress */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <p className="text-[11px] font-semibold text-accent-primary uppercase tracking-[0.15em]">
            Pipeline Overview
          </p>
          <span className="text-2xl font-mono font-bold text-text-primary">{total}</span>
          <span className="text-xs text-text-muted">total posts</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted font-mono">{progressPct}% ready</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full bg-border rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-accent-teal rounded-full transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Status badges row */}
      <div className="flex flex-wrap gap-2">
        {STATUS_ORDER.map(status => {
          const count = summary.by_status[status] ?? 0;
          if (count === 0) return null;
          return (
            <span
              key={status}
              className={cn('badge gap-1.5', contentPostStatusColor(status))}
            >
              <span className="font-mono">{count}</span>
              {contentPostStatusLabel(status)}
            </span>
          );
        })}
      </div>
    </div>
  );
}
