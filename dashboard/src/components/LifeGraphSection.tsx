'use client';

import { useEffect, useState, useCallback } from 'react';
import { Activity, ListTodo, AlertTriangle, Target } from 'lucide-react';
import { RadialLifeGraph } from './RadialLifeGraph';
import { DomainDetailPanel } from './DomainDetailPanel';
import { AddDomainModal } from './AddDomainModal';
import type { DomainWithCounts, LifeGraphResponse } from '@/lib/types';

export function LifeGraphSection() {
  const [domains, setDomains] = useState<DomainWithCounts[]>([]);
  const [summary, setSummary] = useState<LifeGraphResponse['summary'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [addModalParentId, setAddModalParentId] = useState<string | null>(null);

  const fetchTree = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/life-graph');
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const json: LifeGraphResponse = await res.json();
      setDomains(json.domains ?? []);
      setSummary(json.summary ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Life Graph');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  const refreshTree = useCallback(() => {
    fetchTree();
  }, [fetchTree]);

  const addModalParent = addModalParentId
    ? domains.find((d) => d.id === addModalParentId)
    : null;

  if (loading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="h-4 w-4 text-accent-teal" />
          <h2 className="text-[11px] font-semibold text-accent-primary uppercase tracking-[0.15em]">
            Life Graph
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-7 w-7 rounded-full bg-hover" />
                <div className="h-4 bg-hover rounded w-24" />
              </div>
              <div className="h-2 bg-hover rounded w-full mb-3" />
              <div className="h-3 bg-hover rounded w-32" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="h-4 w-4 text-accent-red" />
          <h2 className="text-[11px] font-semibold text-accent-primary uppercase tracking-[0.15em]">
            Life Graph
          </h2>
        </div>
        <div className="card p-8 text-center">
          <AlertTriangle className="h-8 w-8 text-accent-red mx-auto mb-2" />
          <p className="text-text-secondary text-sm mb-3">{error}</p>
          <button onClick={refreshTree} className="btn-primary text-sm">
            Retry
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {/* Header with summary stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-accent-teal" />
          <h2 className="text-[11px] font-semibold text-accent-primary uppercase tracking-[0.15em]">
            Life Graph
          </h2>
        </div>
        {summary && (
          <div className="flex items-center gap-4 text-xs text-text-secondary">
            <span className="flex items-center gap-1.5">
              <Activity className="h-3 w-3 text-accent-primary" />
              {summary.total_domains} domains
            </span>
            <span className="flex items-center gap-1.5">
              <ListTodo className="h-3 w-3 text-accent-teal" />
              {summary.active_tasks} active
            </span>
            {summary.overdue_tasks > 0 && (
              <span className="flex items-center gap-1.5 text-accent-red">
                <AlertTriangle className="h-3 w-3" />
                {summary.overdue_tasks} overdue
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Target className="h-3 w-3 text-accent-gold" />
              {summary.active_objectives} objectives
            </span>
          </div>
        )}
      </div>

      {/* Radial mind map */}
      <RadialLifeGraph
        domains={domains}
        selectedSlug={selectedSlug}
        onSelectDomain={setSelectedSlug}
      />

      {/* Detail panel */}
      {selectedSlug && (
        <DomainDetailPanel
          slug={selectedSlug}
          onClose={() => setSelectedSlug(null)}
          onRefresh={refreshTree}
        />
      )}

      {/* Add domain modal */}
      {addModalParentId && addModalParent && (
        <AddDomainModal
          parentId={addModalParentId}
          parentName={addModalParent.name}
          onClose={() => setAddModalParentId(null)}
          onCreated={refreshTree}
        />
      )}
    </section>
  );
}
