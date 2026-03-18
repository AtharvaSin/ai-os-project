'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  X, Loader2, Target, Zap, ListTodo, Activity,
  TrendingUp, TrendingDown, Minus, ChevronRight, Check, Plus,
} from 'lucide-react';
import { cn, formatDate, priorityColor } from '@/lib/utils';
import type {
  DomainDetailResponse, DomainContextItem, Task, DomainHealthSnapshot, TaskPriority,
} from '@/lib/types';

interface DomainDetailPanelProps {
  slug: string;
  onClose: () => void;
  onRefresh: () => void;
}

type TabKey = 'objectives' | 'automations' | 'tasks' | 'health';

const TABS: { key: TabKey; label: string; icon: typeof Target }[] = [
  { key: 'objectives', label: 'Objectives', icon: Target },
  { key: 'automations', label: 'Automations', icon: Zap },
  { key: 'tasks', label: 'Tasks', icon: ListTodo },
  { key: 'health', label: 'Health', icon: Activity },
];

function healthScoreColor(score: number | null): string {
  if (score === null) return '#807d75';
  const pct = score * 100;
  if (pct >= 70) return '#4ECDC4';
  if (pct >= 40) return '#E8B931';
  return '#FF6B6B';
}

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'stable' | null }) {
  if (trend === 'up') return <TrendingUp className="h-4 w-4 text-accent-teal" />;
  if (trend === 'down') return <TrendingDown className="h-4 w-4 text-accent-red" />;
  if (trend === 'stable') return <Minus className="h-4 w-4 text-text-muted" />;
  return null;
}

/* ── Inline Add Form ── */

interface AddItemFormProps {
  domainId: string;
  itemType: 'objective' | 'automation';
  onCreated: () => void;
  onCancel: () => void;
}

function AddItemForm({ domainId, itemType, onCreated, onCancel }: AddItemFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [targetDate, setTargetDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/life-graph/context-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain_id: domainId,
          item_type: itemType,
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          target_date: targetDate || undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to create item');
      onCreated();
    } catch {
      setError('Failed to create. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-3 space-y-3 mt-3">
      <div>
        <label className="block text-[10px] font-mono text-text-muted mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-border bg-primary px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary"
          placeholder={`New ${itemType}...`}
          autoFocus
          required
        />
      </div>
      <div>
        <label className="block text-[10px] font-mono text-text-muted mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-border bg-primary px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary resize-none"
          placeholder="Optional details..."
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-mono text-text-muted mb-1">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="w-full rounded-lg border border-border bg-primary px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        {itemType === 'objective' && (
          <div>
            <label className="block text-[10px] font-mono text-text-muted mb-1">Target Date</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-primary px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
            />
          </div>
        )}
      </div>
      {error && <p className="text-xs text-accent-red">{error}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className="btn-ghost text-xs px-3 py-1.5">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="btn-primary text-xs px-3 py-1.5">
          {submitting ? 'Creating...' : 'Create'}
        </button>
      </div>
    </form>
  );
}

/* ── Tab: Objectives / Automations ── */

interface ContextItemsTabProps {
  items: DomainContextItem[];
  domainId: string;
  itemType: 'objective' | 'automation';
  onItemCompleted: () => void;
  onItemCreated: () => void;
}

function ContextItemsTab({ items, domainId, itemType, onItemCompleted, onItemCreated }: ContextItemsTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const filteredItems = items.filter((item) => item.item_type === itemType);

  const handleComplete = async (itemId: string) => {
    setCompletingId(itemId);
    try {
      await fetch(`/api/life-graph/context-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      onItemCompleted();
    } catch {
      /* silently fail - will refresh on next fetch */
    } finally {
      setCompletingId(null);
    }
  };

  const handleCreated = () => {
    setShowAddForm(false);
    onItemCreated();
  };

  const label = itemType === 'objective' ? 'Objective' : 'Automation';

  if (filteredItems.length === 0 && !showAddForm) {
    return (
      <div className="text-center py-6">
        <p className="text-text-muted text-sm mb-3">No {itemType}s yet</p>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary text-xs"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add {label}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {filteredItems.map((item) => {
        const isActive = item.status !== 'completed' && item.status !== 'cancelled';
        const progressPct = Math.round(item.progress_pct);
        const progressColor =
          progressPct >= 70 ? '#4ECDC4' : progressPct >= 40 ? '#E8B931' : '#FF6B6B';

        return (
          <div key={item.id} className="card p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-sm font-medium',
                  isActive ? 'text-text-primary' : 'text-text-muted line-through',
                )}>
                  {item.title}
                </p>
                {item.description && (
                  <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>
              <span className={cn(
                'badge text-[10px] shrink-0',
                item.status === 'completed' ? 'bg-accent-teal/15 text-accent-teal'
                : item.status === 'in_progress' ? 'bg-accent-primary/15 text-accent-primary'
                : 'bg-text-muted/15 text-text-muted',
              )}>
                {item.status.replace('_', ' ')}
              </span>
            </div>

            {/* Progress bar (for objectives) */}
            {itemType === 'objective' && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1.5 rounded-full bg-hover overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${progressPct}%`, backgroundColor: progressColor }}
                  />
                </div>
                <span className="text-[10px] font-mono text-text-muted">{progressPct}%</span>
              </div>
            )}

            {/* Meta + actions row */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-3 text-[10px] text-text-muted">
                {item.target_date && (
                  <span>Due {formatDate(item.target_date)}</span>
                )}
                <span className={cn('badge text-[10px]', priorityColor(item.priority as TaskPriority))}>
                  {item.priority}
                </span>
              </div>
              {isActive && (
                <button
                  onClick={() => handleComplete(item.id)}
                  disabled={completingId === item.id}
                  className="flex items-center gap-1 text-[10px] text-accent-teal hover:text-accent-teal/80 transition-colors"
                >
                  {completingId === item.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                  Complete
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Add form or button */}
      {showAddForm ? (
        <AddItemForm
          domainId={domainId}
          itemType={itemType}
          onCreated={handleCreated}
          onCancel={() => setShowAddForm(false)}
        />
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-accent-primary transition-colors mt-2"
        >
          <Plus className="h-3.5 w-3.5" />
          Add {label}
        </button>
      )}
    </div>
  );
}

/* ── Tab: Tasks ── */

function TasksTab({ tasks }: { tasks: (Task & { domain_name: string; domain_slug: string })[] }) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-text-muted text-sm">No tasks in this domain</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const statusCls =
          task.status === 'done' ? 'bg-accent-teal/15 text-accent-teal'
          : task.status === 'in_progress' ? 'bg-accent-primary/15 text-accent-primary'
          : task.status === 'blocked' ? 'bg-accent-red/15 text-accent-red'
          : 'bg-text-muted/15 text-text-muted';

        return (
          <div key={task.id} className="card p-3">
            <div className="flex items-start justify-between gap-2">
              <p className={cn(
                'text-sm',
                task.status === 'done' ? 'text-text-muted line-through' : 'text-text-primary',
              )}>
                {task.title}
              </p>
              <span className={cn('badge text-[10px] shrink-0', statusCls)}>
                {task.status.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-[10px] text-text-muted">
              <span className={cn('badge text-[10px]', priorityColor(task.priority))}>
                {task.priority}
              </span>
              {task.due_date && <span>Due {formatDate(task.due_date)}</span>}
            </div>
          </div>
        );
      })}
      <a
        href="/tasks"
        className="flex items-center gap-1.5 text-xs text-accent-primary hover:text-accent-primary/80 transition-colors mt-2"
      >
        View all tasks
        <ChevronRight className="h-3 w-3" />
      </a>
    </div>
  );
}

/* ── Tab: Health ── */

function HealthTab({ snapshots, currentScore, currentTrend }: {
  snapshots: DomainHealthSnapshot[];
  currentScore: number | null;
  currentTrend: 'up' | 'down' | 'stable' | null;
}) {
  if (snapshots.length === 0) {
    return (
      <div className="text-center py-6">
        <Activity className="h-8 w-8 text-text-muted mx-auto mb-2" />
        <p className="text-text-muted text-sm">No health data yet</p>
        <p className="text-[10px] text-text-muted mt-1">
          Health scores are calculated by the domain-health-scorer pipeline
        </p>
      </div>
    );
  }

  const latestPct = currentScore !== null ? Math.round(currentScore * 100) : null;
  const latestColor = healthScoreColor(currentScore);

  return (
    <div className="space-y-4">
      {/* Current score prominently */}
      {latestPct !== null && (
        <div className="card p-4 text-center">
          <p className="text-[10px] font-semibold text-accent-primary uppercase tracking-[0.15em] mb-1">
            Current Health
          </p>
          <div className="flex items-center justify-center gap-2">
            <span
              className="text-3xl font-mono font-bold"
              style={{ color: latestColor }}
            >
              {latestPct}%
            </span>
            <TrendIcon trend={currentTrend} />
          </div>
          <div className="w-full h-2 rounded-full bg-hover overflow-hidden mt-3">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${latestPct}%`, backgroundColor: latestColor }}
            />
          </div>
        </div>
      )}

      {/* Snapshot history */}
      <div>
        <h4 className="text-[10px] font-semibold text-accent-primary uppercase tracking-[0.15em] mb-2">
          History
        </h4>
        <div className="space-y-1.5">
          {snapshots
            .sort((a, b) => new Date(b.snapshot_date).getTime() - new Date(a.snapshot_date).getTime())
            .map((snap) => {
              const snapPct = Math.round(snap.health_score * 100);
              const snapColor = healthScoreColor(snap.health_score);
              return (
                <div key={snap.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-hover transition-colors">
                  <span className="text-xs text-text-secondary">
                    {formatDate(snap.snapshot_date)}
                  </span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-text-muted">v7d: {snap.velocity_7d}</span>
                    <span
                      className="font-mono font-semibold"
                      style={{ color: snapColor }}
                    >
                      {snapPct}%
                    </span>
                    <div className="w-16 h-1.5 rounded-full bg-hover overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${snapPct}%`, backgroundColor: snapColor }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

/* ── Main Panel ── */

export function DomainDetailPanel({ slug, onClose, onRefresh }: DomainDetailPanelProps) {
  const [data, setData] = useState<DomainDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('objectives');

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/life-graph/${slug}`);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const json = await res.json();
      setData(json.data ?? json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load domain detail');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleItemMutated = () => {
    fetchDetail();
    onRefresh();
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const domain = data?.domain;

  // Derive health score and trend from snapshots (the detail API returns raw domain + snapshots)
  const sortedSnapshots = data?.health_snapshots
    ?.slice()
    .sort((a, b) => new Date(b.snapshot_date).getTime() - new Date(a.snapshot_date).getTime()) ?? [];
  const latestSnapshot = sortedSnapshots[0] ?? null;
  const prevSnapshot = sortedSnapshots[1] ?? null;
  const healthScore = latestSnapshot ? Number(latestSnapshot.health_score) : null;
  const healthTrend: 'up' | 'down' | 'stable' | null = latestSnapshot && prevSnapshot
    ? (Number(latestSnapshot.health_score) > Number(prevSnapshot.health_score) ? 'up'
       : Number(latestSnapshot.health_score) < Number(prevSnapshot.health_score) ? 'down' : 'stable')
    : latestSnapshot ? 'stable' : null;
  const scorePct = healthScore !== null ? Math.round(healthScore * 100) : null;
  const scoreColor = healthScoreColor(healthScore);

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 z-30 bg-black/50"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-0 sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[420px] z-40 bg-primary border-l border-border overflow-y-auto">
        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 text-accent-primary animate-spin" />
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="p-6 text-center">
            <p className="text-accent-red text-sm mb-3">{error}</p>
            <button onClick={fetchDetail} className="btn-primary text-sm">Retry</button>
          </div>
        )}

        {/* Content */}
        {!loading && !error && data && domain && (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-5 border-b border-border shrink-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Breadcrumb */}
                  {data.breadcrumb && data.breadcrumb.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-text-muted mb-1 overflow-hidden">
                      {data.breadcrumb
                        .sort((a, b) => a.depth - b.depth)
                        .map((crumb, idx) => (
                          <span key={crumb.slug} className="flex items-center gap-1 shrink-0">
                            {idx > 0 && <ChevronRight className="h-2.5 w-2.5" />}
                            <span className={idx === data.breadcrumb.length - 1 ? 'text-text-secondary' : ''}>
                              {crumb.name}
                            </span>
                          </span>
                        ))}
                    </div>
                  )}
                  <h2 className="font-display text-xl text-text-primary font-bold truncate">
                    {domain.name}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-text-muted hover:text-text-primary transition-colors ml-2 shrink-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Health score badge */}
              {scorePct !== null ? (
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className="text-sm font-mono font-semibold"
                    style={{ color: scoreColor }}
                  >
                    Health: {scorePct}%
                  </span>
                  <TrendIcon trend={healthTrend} />
                </div>
              ) : (
                <p className="text-xs text-text-muted mt-2">No health score</p>
              )}
            </div>

            {/* Tab bar */}
            <div className="flex border-b border-border shrink-0">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-mono transition-colors border-b-2',
                      activeTab === tab.key
                        ? 'border-accent-primary text-accent-primary'
                        : 'border-transparent text-text-muted hover:text-text-secondary',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'objectives' && (
                <ContextItemsTab
                  items={data.context_items}
                  domainId={domain.id}
                  itemType="objective"
                  onItemCompleted={handleItemMutated}
                  onItemCreated={handleItemMutated}
                />
              )}
              {activeTab === 'automations' && (
                <ContextItemsTab
                  items={data.context_items}
                  domainId={domain.id}
                  itemType="automation"
                  onItemCompleted={handleItemMutated}
                  onItemCreated={handleItemMutated}
                />
              )}
              {activeTab === 'tasks' && (
                <TasksTab tasks={data.tasks} />
              )}
              {activeTab === 'health' && (
                <HealthTab
                  snapshots={data.health_snapshots}
                  currentScore={healthScore}
                  currentTrend={healthTrend}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
