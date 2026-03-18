'use client';

import { useState } from 'react';
import { cn, severityColor, riskTypeLabel, formatDate, daysAgo } from '@/lib/utils';
import { CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { RiskAlert } from '@/lib/types';

interface RiskAlertListProps {
  alerts: RiskAlert[];
  onResolve: (id: string, note?: string) => void;
}

export function RiskAlertList({ alerts, onResolve }: RiskAlertListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolveNote, setResolveNote] = useState('');

  if (alerts.length === 0) {
    return (
      <div className="card p-8 text-center text-accent-teal">
        <CheckCircle className="h-8 w-8 mx-auto mb-2" />
        <p className="font-medium">All clear — no active risks</p>
      </div>
    );
  }

  // Group by project
  const grouped = alerts.reduce<Record<string, RiskAlert[]>>((acc, alert) => {
    const key = alert.project_name ?? 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(alert);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([projectName, projectAlerts]) => (
        <div key={projectName}>
          <h3 className="text-sm font-medium text-text-secondary mb-2">{projectName}</h3>
          <div className="space-y-2">
            {projectAlerts.map((alert) => {
              const isExpanded = expandedId === alert.id;
              return (
                <div key={alert.id} className="card p-4">
                  <div
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => {
                      setExpandedId(isExpanded ? null : alert.id);
                      setResolveNote('');
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={cn('badge', severityColor(alert.severity))}>
                          {alert.severity}
                        </span>
                        <span className="badge bg-accent-primary/10 text-accent-primary">
                          {riskTypeLabel(alert.alert_type)}
                        </span>
                        <span className="text-xs text-text-muted">
                          {daysAgo(alert.created_at)}d ago
                        </span>
                      </div>
                      <p className="text-sm text-text-primary font-medium truncate">
                        {alert.title}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-text-muted shrink-0 mt-1" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-text-muted shrink-0 mt-1" />
                    )}
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-border">
                      {alert.description && (
                        <p className="text-sm text-text-secondary mb-3">{alert.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-text-muted mb-3">
                        {alert.affected_tasks.length > 0 && (
                          <span>{alert.affected_tasks.length} tasks affected</span>
                        )}
                        {alert.affected_milestones.length > 0 && (
                          <span>{alert.affected_milestones.length} milestones affected</span>
                        )}
                        {alert.score !== null && (
                          <span>Score: {alert.score}</span>
                        )}
                        <span>Created: {formatDate(alert.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Resolution note (optional)"
                          value={resolveNote}
                          onChange={(e) => setResolveNote(e.target.value)}
                          className="flex-1 rounded-lg border border-border bg-primary px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          className="btn-primary text-xs px-3 py-1.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            onResolve(alert.id, resolveNote || undefined);
                            setExpandedId(null);
                            setResolveNote('');
                          }}
                        >
                          Resolve
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
