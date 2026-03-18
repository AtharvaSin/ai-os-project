'use client';

import { useEffect, useState } from 'react';
import { Inbox, BookOpen, BarChart3, Lightbulb, Zap, Brain, Eye, Clock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import type { JournalEntry, QuickEntry, CaptureStats } from '@/lib/types';

type Tab = 'inbox' | 'journals' | 'stats';

const CAPTURE_TYPE_CONFIG: Record<string, { icon: typeof Lightbulb; label: string; color: string }> = {
  idea: { icon: Lightbulb, label: 'Idea', color: 'text-accent-gold bg-accent-gold/10' },
  epiphany: { icon: Zap, label: 'Epiphany', color: 'text-accent-primary bg-accent-primary/10' },
  memory_recall: { icon: Brain, label: 'Memory', color: 'text-accent-teal bg-accent-teal/10' },
  observation: { icon: Eye, label: 'Observation', color: 'text-text-secondary bg-hover' },
};

const URGENCY_COLOR: Record<string, string> = {
  low: 'text-text-muted',
  medium: 'text-accent-gold',
  high: 'text-accent-red',
};

function StatCard({ label, value, sub, color }: { label: string; value: number; sub?: string; color: string }) {
  return (
    <div className="card p-4">
      <p className="text-[11px] font-semibold text-accent-primary uppercase tracking-[0.15em] mb-1">{label}</p>
      <p className={cn('text-2xl font-mono font-bold', color)}>{value}</p>
      {sub && <p className="text-[10px] text-text-muted mt-0.5">{sub}</p>}
    </div>
  );
}

function InboxEntry({ entry }: { entry: QuickEntry }) {
  const fallback = { icon: Eye, label: 'Observation', color: 'text-text-secondary bg-hover' };
  const config = CAPTURE_TYPE_CONFIG[entry.capture_type] ?? fallback;
  const Icon = config.icon;
  const isProcessed = !!entry.analysed_at;

  return (
    <div className={cn('card p-4 border-l-2', isProcessed ? 'border-l-accent-teal/30' : 'border-l-accent-gold/50')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono', config.color)}>
              <Icon className="h-3 w-3" />
              {config.label}
            </span>
            {entry.urgency !== 'low' && (
              <span className={cn('text-[10px] font-mono', URGENCY_COLOR[entry.urgency])}>
                {entry.urgency}
              </span>
            )}
            {isProcessed && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-accent-teal">
                <Check className="h-3 w-3" /> processed
              </span>
            )}
          </div>
          <p className="text-sm text-text-primary font-medium truncate">{entry.title}</p>
          <p className="text-xs text-text-muted mt-1 line-clamp-2">{entry.content_preview}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] text-text-muted font-mono">{formatDate(entry.created_at)}</p>
          {entry.source_interface && (
            <p className="text-[10px] text-text-muted mt-0.5">{entry.source_interface}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function JournalCard({ journal }: { journal: JournalEntry }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {journal.mood && (
            <span className="text-xs font-mono text-accent-primary bg-accent-primary/10 px-1.5 py-0.5 rounded">
              {journal.mood}
            </span>
          )}
          {journal.energy_level && (
            <span className="text-xs font-mono text-accent-teal">
              energy: {journal.energy_level}/5
            </span>
          )}
          {journal.domain_name && (
            <span className="text-[10px] text-text-muted">{journal.domain_name}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {journal.distilled_at && (
            <span className="text-[10px] text-accent-teal">distilled</span>
          )}
          <span className="text-[10px] text-text-muted font-mono">{formatDate(journal.created_at)}</span>
        </div>
      </div>
      <p className="text-sm text-text-primary leading-relaxed">{journal.content_preview}</p>
      <div className="flex items-center gap-3 mt-2 text-[10px] text-text-muted">
        <span>{journal.word_count ?? 0} words</span>
        {journal.tags.length > 0 && (
          <span>{journal.tags.join(', ')}</span>
        )}
      </div>
    </div>
  );
}

export function CaptureContent() {
  const [tab, setTab] = useState<Tab>('inbox');
  const [stats, setStats] = useState<CaptureStats | null>(null);
  const [inbox, setInbox] = useState<QuickEntry[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fetches = [
      fetch('/api/capture/stats').then(r => r.json()).then(d => setStats(d)),
      fetch('/api/capture/inbox').then(r => r.json()).then(d => setInbox(d.entries ?? [])),
      fetch('/api/capture/journals').then(r => r.json()).then(d => setJournals(d.journals ?? [])),
    ];
    Promise.allSettled(fetches).finally(() => setLoading(false));
  }, []);

  const tabs: { id: Tab; label: string; icon: typeof Inbox; count?: number }[] = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, count: stats?.unprocessed_entries },
    { id: 'journals', label: 'Journals', icon: BookOpen, count: stats?.total_journals },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl text-text-primary">Capture</h1>
        <div className="flex items-center gap-1 text-xs text-text-muted font-mono">
          <Clock className="h-3.5 w-3.5" />
          {stats ? `${stats.entries_this_week + stats.journals_this_week} this week` : '...'}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm transition-colors border-b-2 -mb-px',
              tab === t.id
                ? 'border-accent-primary text-accent-primary'
                : 'border-transparent text-text-muted hover:text-text-primary',
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className={cn(
                'text-[10px] font-mono px-1.5 py-0.5 rounded-full',
                tab === t.id ? 'bg-accent-primary/15 text-accent-primary' : 'bg-hover text-text-muted',
              )}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card p-8 text-center text-text-muted animate-pulse">Loading capture data...</div>
      ) : (
        <>
          {/* Inbox tab */}
          {tab === 'inbox' && (
            <div className="space-y-3">
              {inbox.length === 0 ? (
                <div className="card p-8 text-center text-text-muted">
                  <Inbox className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>No quick entries yet.</p>
                  <p className="text-xs mt-1">Use &ldquo;Entry:&rdquo; in Claude.ai or /e in Telegram to capture.</p>
                </div>
              ) : (
                inbox.map(entry => <InboxEntry key={entry.id} entry={entry} />)
              )}
            </div>
          )}

          {/* Journals tab */}
          {tab === 'journals' && (
            <div className="space-y-3">
              {journals.length === 0 ? (
                <div className="card p-8 text-center text-text-muted">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>No journal entries yet.</p>
                  <p className="text-xs mt-1">Use &ldquo;Journal:&rdquo; in Claude.ai or /j in Telegram to start journaling.</p>
                </div>
              ) : (
                journals.map(journal => <JournalCard key={journal.id} journal={journal} />)
              )}
            </div>
          )}

          {/* Stats tab */}
          {tab === 'stats' && stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Journals" value={stats.total_journals} sub={`${stats.journals_this_week} this week`} color="text-accent-primary" />
              <StatCard label="Quick Entries" value={stats.total_quick_entries} sub={`${stats.entries_this_week} this week`} color="text-accent-teal" />
              <StatCard label="Unprocessed" value={stats.unprocessed_entries} sub="awaiting analysis" color={stats.unprocessed_entries > 10 ? 'text-accent-gold' : 'text-text-primary'} />
              <StatCard label="Undistilled" value={stats.undistilled_journals} sub="awaiting monthly distill" color="text-text-primary" />
              <StatCard label="Distilled Entries" value={stats.distilled_entries} sub="from journal themes" color="text-accent-teal" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
