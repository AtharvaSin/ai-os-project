'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ContentPost, ContentPostStatus, ContentPipelineSummary } from '@/lib/types';
import { PipelineSummary } from './PipelineSummary';
import { ContentPostCard } from './ContentPostCard';
import { ContentPostDetail } from './ContentPostDetail';
import { cn, pillarLabel, contentPostStatusLabel } from '@/lib/utils';
import { Filter, RefreshCw, Radio, ChevronDown } from 'lucide-react';

const ALL_STATUSES: ContentPostStatus[] = [
  'planned', 'prompt_ready', 'awaiting_image', 'image_uploaded',
  'rendered', 'approved', 'scheduled', 'published', 'failed',
];

export function ContentPipelineView() {
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [summary, setSummary] = useState<ContentPipelineSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<ContentPost | null>(null);
  const [statusFilter, setStatusFilter] = useState<ContentPostStatus | 'all'>('all');
  const [pillarFilter, setPillarFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/content-pipeline');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setPosts(data.posts ?? []);
      setSummary(data.summary ?? null);
    } catch {
      setPosts([]);
      setSummary(null);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  /**
   * After data refresh, sync the selected post with its latest version.
   * Uses a ref-based check to avoid infinite loops: only update if the
   * post_id matches but the object reference differs.
   */
  useEffect(() => {
    if (!selectedPost) return;
    const updated = posts.find(p => p.post_id === selectedPost.post_id);
    if (updated && updated !== selectedPost && updated.updated_at !== selectedPost.updated_at) {
      setSelectedPost(updated);
    }
  }, [posts, selectedPost]);

  /* Derive unique pillars from data */
  const pillars = Array.from(new Set(posts.map(p => p.content_pillar))).sort();

  /* Apply filters */
  const filteredPosts = posts.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (pillarFilter !== 'all' && p.content_pillar !== pillarFilter) return false;
    return true;
  });

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Radio className="h-6 w-6 text-accent-primary" />
          <h1 className="font-display text-3xl text-text-primary">Content Pipeline</h1>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-ghost gap-2 text-xs"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-text-muted animate-pulse">Loading content pipeline...</div>
      ) : (
        <>
          {/* Summary bar */}
          {summary && <PipelineSummary summary={summary} />}

          {/* Filter bar */}
          <div className="flex items-center gap-3 mt-6 mb-4">
            <Filter className="h-4 w-4 text-text-muted" />

            {/* Status filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ContentPostStatus | 'all')}
                className="appearance-none bg-card border border-border rounded-lg px-3 py-1.5 pr-8 text-xs text-text-secondary focus:border-accent-primary/50 focus:outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                {ALL_STATUSES.map(s => (
                  <option key={s} value={s}>{contentPostStatusLabel(s)}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-text-muted pointer-events-none" />
            </div>

            {/* Pillar filter */}
            <div className="relative">
              <select
                value={pillarFilter}
                onChange={(e) => setPillarFilter(e.target.value)}
                className="appearance-none bg-card border border-border rounded-lg px-3 py-1.5 pr-8 text-xs text-text-secondary focus:border-accent-primary/50 focus:outline-none cursor-pointer"
              >
                <option value="all">All Pillars</option>
                {pillars.map(p => (
                  <option key={p} value={p}>{pillarLabel(p)}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-text-muted pointer-events-none" />
            </div>

            {/* Active filter count */}
            {(statusFilter !== 'all' || pillarFilter !== 'all') && (
              <button
                onClick={() => { setStatusFilter('all'); setPillarFilter('all'); }}
                className="text-[10px] text-accent-primary hover:underline"
              >
                Clear filters
              </button>
            )}

            <span className="text-xs text-text-muted ml-auto font-mono">
              {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Post grid */}
          {filteredPosts.length === 0 ? (
            <div className="card p-8 text-center text-text-muted">
              <Radio className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>No content posts found.</p>
              <p className="text-xs mt-1">Create posts via the MCP Gateway content pipeline tools.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredPosts.map(post => (
                <ContentPostCard
                  key={post.post_id}
                  post={post}
                  onClick={() => setSelectedPost(post)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Slide-over detail panel */}
      {selectedPost && (
        <ContentPostDetail
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
}
