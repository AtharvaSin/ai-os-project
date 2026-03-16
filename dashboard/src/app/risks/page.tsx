'use client';

import { useEffect, useState, useCallback } from 'react';
import { RiskSummaryCards } from '@/components/risks/RiskSummaryCards';
import { RiskAlertList } from '@/components/risks/RiskAlertList';
import { VelocityChart } from '@/components/risks/VelocityChart';
import type { RisksApiResponse, RiskAlertType } from '@/lib/types';

export default function RisksPage() {
  const [data, setData] = useState<RisksApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<RiskAlertType | 'all'>('all');

  const fetchRisks = useCallback(async () => {
    try {
      const res = await fetch('/api/risks');
      const json = await res.json();
      setData(json);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRisks(); }, [fetchRisks]);

  const handleResolve = async (id: string, note?: string) => {
    await fetch(`/api/risks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolution_note: note }),
    });
    fetchRisks();
  };

  const filteredAlerts = data?.alerts.filter(
    a => typeFilter === 'all' || a.alert_type === typeFilter
  ) ?? [];

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl lg:text-4xl text-text-primary">
            Risk Dashboard
          </h1>
          <p className="text-text-secondary mt-1">Proactive risk detection across all projects</p>
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as RiskAlertType | 'all')}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-purple"
        >
          <option value="all">All Risk Types</option>
          <option value="overdue_cluster">Overdue Clusters</option>
          <option value="velocity_decline">Velocity Decline</option>
          <option value="milestone_slip">Milestone Slips</option>
          <option value="dependency_chain">Dependency Chains</option>
          <option value="stale_project">Stale Projects</option>
        </select>
      </header>

      {loading ? (
        <div className="card p-8 text-center text-text-muted animate-pulse">Loading risk data...</div>
      ) : !data ? (
        <div className="card p-8 text-center text-text-secondary">Failed to load risk data</div>
      ) : (
        <>
          <RiskSummaryCards summary={data.summary} />
          <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <h2 className="text-sm font-mono text-text-muted uppercase tracking-wider mb-4">
                Active Alerts ({filteredAlerts.length})
              </h2>
              <RiskAlertList alerts={filteredAlerts} onResolve={handleResolve} />
            </div>
            <div>
              <h2 className="text-sm font-mono text-text-muted uppercase tracking-wider mb-4">
                Velocity Trend (14 days)
              </h2>
              <VelocityChart data={data.velocity} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
