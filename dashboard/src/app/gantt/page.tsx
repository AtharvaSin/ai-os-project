'use client';

import { useEffect, useState, useCallback } from 'react';
import { GanttChart } from '@/components/GanttChart';
import type { GanttPhase } from '@/lib/types';

export default function GanttPage() {
  const [phases, setPhases] = useState<GanttPhase[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectFilter, setProjectFilter] = useState('all');

  const fetchGantt = useCallback(async () => {
    const params = projectFilter !== 'all' ? `?project_id=${projectFilter}` : '';
    try {
      const res = await fetch(`/api/gantt${params}`);
      const json = await res.json();
      setPhases(json.data ?? []);
    } catch {
      console.error('Failed to fetch gantt data');
    } finally {
      setLoading(false);
    }
  }, [projectFilter]);

  useEffect(() => { fetchGantt(); }, [fetchGantt]);

  const projects = Array.from(
    new Map(phases.map((p) => [p.project_id, p.project_name])).entries(),
  );

  const handleMilestoneReschedule = async (milestoneId: string, newDate: string) => {
    await fetch(`/api/milestones/${milestoneId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ due_date: newDate }),
    });
    fetchGantt();
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-text-primary">Gantt Timeline</h1>
          <p className="text-text-secondary text-sm mt-1">Phases and milestones across projects</p>
        </div>
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
        >
          <option value="all">All Projects</option>
          {projects.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
      </header>

      {loading ? (
        <div className="card p-8 text-center text-text-muted animate-pulse">Loading timeline...</div>
      ) : phases.length === 0 ? (
        <div className="card p-8 text-center text-text-secondary">No phases found</div>
      ) : (
        <GanttChart phases={phases} onMilestoneReschedule={handleMilestoneReschedule} />
      )}
    </div>
  );
}
