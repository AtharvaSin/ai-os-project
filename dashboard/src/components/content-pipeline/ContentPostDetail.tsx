'use client';

import { useState, useCallback } from 'react';
import type { ContentPost } from '@/lib/types';
import {
  cn,
  contentPostStatusColor,
  contentPostStatusLabel,
  pillarLabel,
  pillarColor,
  formatDate,
} from '@/lib/utils';
import { ImageUploadZone } from './ImageUploadZone';
import {
  X,
  Calendar,
  Hash,
  Copy,
  Check,
  Image,
  Sparkles,
  CheckCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';

interface ContentPostDetailProps {
  post: ContentPost;
  onClose: () => void;
  onRefresh: () => void;
}

export function ContentPostDetail({ post, onClose, onRefresh }: ContentPostDetailProps) {
  const [actionLoading, setActionLoading] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [artPromptOpen, setArtPromptOpen] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false);

  /** Generic action handler for render/approve endpoints */
  const handleAction = useCallback(async (action: 'render' | 'approve') => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/content-pipeline/${post.post_id}/${action}`, {
        method: 'POST',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as Record<string, string>).error ?? `${action} failed`);
      }
      onRefresh();
    } catch (err) {
      /* Silently fail for now; a toast system would be better */
      const message = err instanceof Error ? err.message : 'Action failed';
      alert(message);
    } finally {
      setActionLoading(false);
    }
  }, [post.post_id, onRefresh]);

  /** Copy the positive_prompt from art_prompt JSON */
  const handleCopyPrompt = useCallback(() => {
    const positivePrompt = post.art_prompt?.positive_prompt;
    if (typeof positivePrompt === 'string') {
      navigator.clipboard.writeText(positivePrompt).then(() => {
        setPromptCopied(true);
        setTimeout(() => setPromptCopied(false), 2000);
      });
    }
  }, [post.art_prompt]);

  const positivePrompt = typeof post.art_prompt?.positive_prompt === 'string'
    ? post.art_prompt.positive_prompt
    : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-screen w-full max-w-[500px] bg-card border-l border-border z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="min-w-0">
            <p className="text-[10px] font-mono text-text-muted">{post.post_id}</p>
            <h2 className="text-lg font-medium text-text-primary truncate">{post.topic}</h2>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost p-2 -mr-2"
            aria-label="Close panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Status badge (large) */}
          <div>
            <p className="text-[11px] font-semibold text-accent-primary uppercase tracking-[0.15em] mb-2">
              Status
            </p>
            <span className={cn('badge text-xs px-3 py-1', contentPostStatusColor(post.status))}>
              {contentPostStatusLabel(post.status)}
            </span>
          </div>

          {/* Channels */}
          {post.channels.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-accent-primary uppercase tracking-[0.15em] mb-2">
                Channels
              </p>
              <div className="flex flex-wrap gap-2">
                {post.channels.map(ch => (
                  <span key={ch} className="badge bg-hover text-text-secondary text-[10px]">
                    <Hash className="h-3 w-3 mr-1" />
                    {ch}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Pillar + Campaign */}
          <div className="flex items-center gap-3">
            <span className={cn('badge text-[10px]', pillarColor(post.content_pillar))}>
              {pillarLabel(post.content_pillar)}
            </span>
            {post.campaign && (
              <span className="text-xs text-text-muted">{post.campaign}</span>
            )}
          </div>

          {/* Hook */}
          {post.hook && (
            <div>
              <p className="text-[11px] font-semibold text-accent-primary uppercase tracking-[0.15em] mb-2">
                Hook
              </p>
              <p className="text-sm text-text-secondary leading-relaxed">{post.hook}</p>
            </div>
          )}

          {/* Caption text */}
          {post.caption_text && (
            <div>
              <p className="text-[11px] font-semibold text-accent-primary uppercase tracking-[0.15em] mb-2">
                Caption
              </p>
              <div className="card p-3 max-h-40 overflow-y-auto">
                <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                  {post.caption_text}
                </p>
              </div>
            </div>
          )}

          {/* Art Prompt section */}
          {post.art_prompt && Object.keys(post.art_prompt).length > 0 && (
            <div>
              <button
                onClick={() => setArtPromptOpen(!artPromptOpen)}
                className="flex items-center gap-2 w-full text-left mb-2"
              >
                <p className="text-[11px] font-semibold text-accent-primary uppercase tracking-[0.15em]">
                  Art Prompt
                </p>
                {artPromptOpen ? (
                  <ChevronUp className="h-3.5 w-3.5 text-text-muted" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
                )}
              </button>

              {artPromptOpen && (
                <div className="card p-3 space-y-3">
                  {/* Positive prompt with copy */}
                  {positivePrompt && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono text-text-muted">positive_prompt</span>
                        <button
                          onClick={handleCopyPrompt}
                          className="inline-flex items-center gap-1 text-[10px] text-accent-primary hover:underline"
                        >
                          {promptCopied ? (
                            <><Check className="h-3 w-3" /> Copied</>
                          ) : (
                            <><Copy className="h-3 w-3" /> Copy</>
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed bg-hover rounded p-2">
                        {positivePrompt}
                      </p>
                    </div>
                  )}

                  {/* Other art_prompt fields */}
                  {Object.entries(post.art_prompt)
                    .filter(([key]) => key !== 'positive_prompt')
                    .map(([key, value]) => (
                      <div key={key}>
                        <span className="text-[10px] font-mono text-text-muted">{key}</span>
                        <p className="text-xs text-text-secondary mt-0.5">
                          {typeof value === 'string' ? value : JSON.stringify(value)}
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Image section */}
          <div>
            <p className="text-[11px] font-semibold text-accent-primary uppercase tracking-[0.15em] mb-2">
              Image
            </p>
            {post.source_image_path ? (
              <div className="card p-3">
                <div className="flex items-center gap-2 text-sm text-accent-teal">
                  <Image className="h-4 w-4" />
                  <span className="truncate font-mono text-xs">{post.source_image_path}</span>
                </div>
              </div>
            ) : (
              <ImageUploadZone postId={post.post_id} onUploadComplete={onRefresh} />
            )}
          </div>

          {/* Lore refs */}
          {post.lore_refs && (
            <div>
              <p className="text-[11px] font-semibold text-accent-primary uppercase tracking-[0.15em] mb-2">
                Lore References
              </p>
              <p className="text-xs text-text-secondary">{post.lore_refs}</p>
            </div>
          )}

          {/* Hashtags */}
          {post.hashtags && (
            <div>
              <p className="text-[11px] font-semibold text-accent-primary uppercase tracking-[0.15em] mb-2">
                Hashtags
              </p>
              <p className="text-xs text-text-muted font-mono">{post.hashtags}</p>
            </div>
          )}

          {/* CTA */}
          {post.cta_type && (
            <div className="flex items-center gap-3">
              <span className="badge bg-hover text-text-secondary text-[10px]">
                CTA: {post.cta_type}
              </span>
              {post.cta_link && (
                <a
                  href={post.cta_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-accent-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Link
                </a>
              )}
            </div>
          )}

          {/* Scheduled date */}
          {post.scheduled_date && (
            <div>
              <p className="text-[11px] font-semibold text-accent-primary uppercase tracking-[0.15em] mb-2">
                Scheduled
              </p>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Calendar className="h-4 w-4 text-text-muted" />
                {formatDate(post.scheduled_date)}
                {post.scheduled_time && (
                  <span className="font-mono text-xs">{post.scheduled_time}</span>
                )}
              </div>
            </div>
          )}

          {/* Style overrides */}
          {post.style_overrides && Object.keys(post.style_overrides).length > 0 && (
            <div>
              <button
                onClick={() => setStyleOpen(!styleOpen)}
                className="flex items-center gap-2 w-full text-left mb-2"
              >
                <p className="text-[11px] font-semibold text-accent-primary uppercase tracking-[0.15em]">
                  Style Overrides
                </p>
                {styleOpen ? (
                  <ChevronUp className="h-3.5 w-3.5 text-text-muted" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
                )}
              </button>
              {styleOpen && (
                <pre className="card p-3 text-[10px] font-mono text-text-muted overflow-x-auto max-h-32">
                  {JSON.stringify(post.style_overrides, null, 2)}
                </pre>
              )}
            </div>
          )}

          {/* Social post IDs (if published) */}
          {post.social_post_ids && Object.keys(post.social_post_ids).length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-accent-primary uppercase tracking-[0.15em] mb-2">
                Published IDs
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(post.social_post_ids).map(([platform, id]) => (
                  <span key={platform} className="badge bg-accent-teal/15 text-accent-teal text-[10px]">
                    {platform}: {id}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action footer */}
        <div className="px-5 py-4 border-t border-border shrink-0">
          {(post.status === 'planned' || post.status === 'prompt_ready' || post.status === 'awaiting_image') && !post.source_image_path && (
            <p className="text-xs text-text-muted text-center">Upload an image to continue the pipeline.</p>
          )}

          {post.status === 'image_uploaded' && (
            <button
              onClick={() => handleAction('render')}
              disabled={actionLoading}
              className="btn-primary w-full gap-2"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Render Post
            </button>
          )}

          {post.status === 'rendered' && (
            <button
              onClick={() => handleAction('approve')}
              disabled={actionLoading}
              className="btn-primary w-full gap-2"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Approve Post
            </button>
          )}

          {post.status === 'approved' && (
            <div className="flex items-center justify-center gap-2 text-sm text-accent-teal">
              <CheckCircle className="h-4 w-4" />
              Ready for distribution
            </div>
          )}

          {post.status === 'scheduled' && (
            <div className="flex items-center justify-center gap-2 text-sm text-[#8B5CF6]">
              <Calendar className="h-4 w-4" />
              Scheduled for publishing
            </div>
          )}

          {post.status === 'published' && (
            <div className="flex items-center justify-center gap-2 text-sm text-accent-teal">
              <CheckCircle className="h-4 w-4" />
              Published
              {post.published_at && (
                <span className="text-[10px] text-text-muted font-mono">
                  {formatDate(post.published_at)}
                </span>
              )}
            </div>
          )}

          {post.status === 'failed' && (
            <div className="flex items-center justify-center gap-2 text-sm text-accent-red">
              Failed — check logs and retry
            </div>
          )}
        </div>
      </div>
    </>
  );
}
