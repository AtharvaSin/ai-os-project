'use client';

import { useEffect, useState, useCallback } from 'react';
import { PipelineCard } from '@/components/pipelines/PipelineCard';
import { PipelineRunHistory } from '@/components/pipelines/PipelineRunHistory';
import type { PipelineWithStats, PipelineRun } from '@/lib/types';

export default function PipelinesPage() {
  const [pipelines, setPipelines] = useState<PipelineWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [runsLoading, setRunsLoading] = useState(false);

  const fetchPipelines = useCallback(async () => {
    try {
      const res = await fetch('/api/pipelines');
      const json = await res.json();
      setPipelines(json.pipelines ?? []);
    } catch {
      /* silently handle */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPipelines();
  }, [fetchPipelines]);

  const handleExpand = async (slug: string) => {
    if (expandedSlug === slug) {
      setExpandedSlug(null);
      return;
    }
    setExpandedSlug(slug);
    setRunsLoading(true);
    try {
      const res = await fetch(`/api/pipelines/${slug}/runs`);
      const json = await res.json();
      setRuns(json.runs ?? []);
    } catch {
      setRuns([]);
    } finally {
      setRunsLoading(false);
    }
  };

  const scheduled = pipelines.filter((p) => p.schedule);
  const eventDriven = pipelines.filter((p) => !p.schedule);

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <header>
        <h1 className="font-display text-3xl lg:text-4xl text-text-primary">
          Pipeline Monitor
        </h1>
        <p className="text-text-secondary mt-1">
          Real-time status of all {pipelines.length} autonomous pipelines
        </p>
      </header>

      {loading ? (
        <div className="card p-8 text-center text-text-muted animate-pulse">
          Loading pipelines...
        </div>
      ) : (
        <>
          {scheduled.length > 0 && (
            <section>
              <h2 className="text-[11px] font-semibold text-accent-primary uppercase tracking-[0.15em] mb-4">
                Scheduled ({scheduled.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {scheduled.map((p) => (
                  <div key={p.id}>
                    <PipelineCard
                      pipeline={p}
                      isExpanded={expandedSlug === p.slug}
                      onToggle={() => handleExpand(p.slug)}
                    />
                    {expandedSlug === p.slug && (
                      <PipelineRunHistory runs={runs} loading={runsLoading} />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {eventDriven.length > 0 && (
            <section>
              <h2 className="text-[11px] font-semibold text-accent-primary uppercase tracking-[0.15em] mb-4">
                Event-driven ({eventDriven.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {eventDriven.map((p) => (
                  <div key={p.id}>
                    <PipelineCard
                      pipeline={p}
                      isExpanded={expandedSlug === p.slug}
                      onToggle={() => handleExpand(p.slug)}
                    />
                    {expandedSlug === p.slug && (
                      <PipelineRunHistory runs={runs} loading={runsLoading} />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
