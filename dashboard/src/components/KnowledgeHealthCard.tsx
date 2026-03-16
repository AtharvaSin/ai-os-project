'use client';

import { useEffect, useState } from 'react';
import { Brain, Database, GitFork, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { KnowledgeHealth } from '@/lib/types';

export function KnowledgeHealthCard() {
  const [data, setData] = useState<KnowledgeHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/knowledge-health')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="card p-5 animate-pulse">
        <div className="h-4 bg-hover rounded w-32 mb-4" />
        <div className="h-6 bg-hover rounded w-16" />
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    {
      label: 'Entries',
      value: data.total_entries,
      icon: Database,
      color: 'text-accent-purple',
    },
    {
      label: 'Embedded',
      value: `${data.embedding_coverage_pct}%`,
      icon: Brain,
      color: data.embedding_coverage_pct >= 80 ? 'text-accent-teal' : 'text-accent-gold',
    },
    {
      label: 'Domains',
      value: data.domain_count,
      icon: GitFork,
      color: 'text-accent-teal',
    },
    {
      label: 'Connections',
      value: data.connection_count,
      icon: GitFork,
      color: 'text-accent-purple',
    },
  ];

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-mono text-text-muted uppercase tracking-wider">
          Knowledge Health
        </h3>
        <Brain className="h-4 w-4 text-accent-purple" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
            <div>
              <p className={`text-sm font-mono font-semibold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-text-muted">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {data.last_ingestion && (
        <div className="mt-3 pt-3 border-t border-border flex items-center gap-1.5 text-[10px] text-text-muted">
          <Clock className="h-3 w-3" />
          Last ingestion: {formatDate(data.last_ingestion)}
        </div>
      )}
    </div>
  );
}
