'use client';

import { useState, useCallback, useEffect } from 'react';
import type { ContentPost, ContentPostStatus } from '@/lib/types';
import {
  cn,
  contentPostStatusColor,
  contentPostStatusLabel,
  pillarLabel,
  pillarColor,
  filterLabel,
  filterColor,
  channelLabel,
  channelColor,
  formatDate,
} from '@/lib/utils';
import { ContentBriefPanel } from './ContentBriefPanel';
import { ChannelPromptPanel } from './ChannelPromptPanel';
import { ImageUploadZone } from './ImageUploadZone';
import { RenderPreviewPanel } from './RenderPreviewPanel';
import { PostingKitPanel } from './PostingKitPanel';
import {
  X,
  CheckCircle,
  Loader2,
  Sparkles,
  Send,
  FileText,
  ImagePlus,
  Megaphone,
  Image as ImageIcon,
} from 'lucide-react';

// ─── Step config ──────────────────────────────────────────────────────────────

const STEPS = [
  { number: 1, label: 'Content Brief', icon: FileText },
  { number: 2, label: 'Image & Render', icon: ImagePlus },
  { number: 3, label: 'Review & Post', icon: Megaphone },
] as const;

function stepFromStatus(status: ContentPostStatus): number {
  switch (status) {
    case 'planned':
      return 1;
    case 'prompt_ready':
    case 'awaiting_image':
    case 'image_uploaded':
      return 2;
    default:
      return 3;
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ContentPostDetailProps {
  post: ContentPost;
  onClose: () => void;
  onRefresh: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ContentPostDetail({ post, onClose, onRefresh }: ContentPostDetailProps) {
  const currentStep = stepFromStatus(post.status);
  const [viewStep, setViewStep] = useState(currentStep);
  const [actionLoading, setActionLoading] = useState(false);
  const [briefSaving, setBriefSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const [showReupload, setShowReupload] = useState(false);
  const [imgCacheBust, setImgCacheBust] = useState(Date.now());

  // Auto-advance when status transitions
  useEffect(() => {
    setViewStep(stepFromStatus(post.status));
  }, [post.status]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleAction = useCallback(
    async (action: 'render' | 'approve' | 'mark-posted' | 'finalize-content') => {
      if (action === 'finalize-content') {
        const confirmed = window.confirm(
          'Finalise this content brief? This will lock the brief and move to image generation. This cannot be undone.'
        );
        if (!confirmed) return;
      }
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
        const message = err instanceof Error ? err.message : 'Action failed';
        setToast({ message, type: 'error' });
      } finally {
        setActionLoading(false);
      }
    },
    [post.post_id, onRefresh],
  );

  const handlePatch = useCallback(
    async (updates: Record<string, unknown>) => {
      setBriefSaving(true);
      try {
        const res = await fetch(`/api/content-pipeline/${post.post_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as Record<string, string>).error ?? 'Save failed');
        }
        onRefresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Save failed';
        setToast({ message, type: 'error' });
      } finally {
        setBriefSaving(false);
      }
    },
    [post.post_id, onRefresh],
  );

  // ─── Step renderers ───────────────────────────────────────────────────────

  const renderStep1 = () => {
    // Read-only when step is already completed
    if (currentStep > 1) {
      return (
        <div className="space-y-5 max-w-2xl">
          <p className="text-xs text-text-muted italic">
            Content brief finalised. Viewing read-only.
          </p>

          {/* Topic */}
          <div>
            <p className="text-[11px] font-semibold text-accent-primary uppercase tracking-[0.15em] mb-2">
              Topic
            </p>
            <p className="text-sm text-text-primary font-medium">{post.topic}</p>
          </div>

          {post.hook && (
            <div>
              <p className="text-[11px] font-semibold text-accent-primary uppercase tracking-[0.15em] mb-2">
                Hook
              </p>
              <p className="text-sm text-text-secondary leading-relaxed">{post.hook}</p>
            </div>
          )}

          {post.caption_text && (
            <div>
              <p className="text-[11px] font-semibold text-accent-primary uppercase tracking-[0.15em] mb-2">
                Caption
              </p>
              <div className="card p-3 max-h-48 overflow-y-auto">
                <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                  {post.caption_text}
                </p>
              </div>
            </div>
          )}

          {post.visual_direction && (
            <div>
              <p className="text-[11px] font-semibold text-accent-primary uppercase tracking-[0.15em] mb-2">
                Visual Direction
              </p>
              <p className="text-sm text-text-secondary leading-relaxed">{post.visual_direction}</p>
            </div>
          )}

          {post.lore_refs && (
            <div>
              <p className="text-[11px] font-semibold text-accent-primary uppercase tracking-[0.15em] mb-2">
                Lore References
              </p>
              <p className="text-xs text-text-muted font-mono">{post.lore_refs}</p>
            </div>
          )}

          {post.hashtags && (
            <div>
              <p className="text-[11px] font-semibold text-accent-primary uppercase tracking-[0.15em] mb-2">
                Hashtags
              </p>
              <p className="text-xs text-text-muted font-mono">{post.hashtags}</p>
            </div>
          )}

          {(post.cta_type || post.cta_link) && (
            <div>
              <p className="text-[11px] font-semibold text-accent-primary uppercase tracking-[0.15em] mb-2">
                Call to Action
              </p>
              <div className="flex gap-3 text-xs text-text-secondary">
                {post.cta_type && <span>Type: <span className="text-text-primary">{post.cta_type}</span></span>}
                {post.cta_link && <span>Link: <a href={post.cta_link} target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">{post.cta_link}</a></span>}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Editable brief (planned status)
    return (
      <ContentBriefPanel
        post={post}
        onSave={handlePatch}
        onFinalise={() => handleAction('finalize-content')}
        saving={briefSaving}
        finalising={actionLoading}
      />
    );
  };

  const renderStep2 = () => {
    // Read-only when step completed
    if (currentStep > 2) {
      return (
        <div className="space-y-5 max-w-2xl">
          <p className="text-xs text-text-muted">
            Image uploaded and rendered. Viewing read-only.
          </p>
          {post.source_image_path && (
            <div className="card p-3">
              <div className="flex items-center gap-2 text-sm text-accent-teal">
                <ImageIcon className="h-4 w-4" />
                <span className="truncate font-mono text-xs">{post.source_image_path}</span>
              </div>
            </div>
          )}
          <ChannelPromptPanel post={post} />
        </div>
      );
    }

    // Active step
    return (
      <div className="space-y-6">
        <ChannelPromptPanel post={post} />

        <div>
          <p className="text-[11px] font-semibold text-accent-primary uppercase tracking-[0.15em] mb-2">
            Image
          </p>
          {post.source_image_path ? (
            <div className="space-y-3">
              {/* Image preview */}
              <div className="card p-2 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/content-pipeline/${post.post_id}/asset?v=${imgCacheBust}`}
                  alt="Source image"
                  className="w-full max-h-64 object-contain rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-text-muted font-mono truncate max-w-[60%]">
                  {post.source_image_path.split(/[/\\]/).pop()}
                </span>
                <button
                  type="button"
                  onClick={() => setShowReupload(prev => !prev)}
                  className="text-[10px] text-accent-primary hover:underline"
                >
                  {showReupload ? 'Cancel' : 'Replace image'}
                </button>
              </div>
              {showReupload && (
                <ImageUploadZone
                  postId={post.post_id}
                  post={post}
                  onUploadComplete={() => { setShowReupload(false); setImgCacheBust(Date.now()); onRefresh(); }}
                />
              )}
            </div>
          ) : (
            <ImageUploadZone
              postId={post.post_id}
              post={post}
              onUploadComplete={onRefresh}
            />
          )}
        </div>
      </div>
    );
  };

  const renderStep3 = () => {
    const isRendered = post.status === 'rendered';
    const isApprovedOrPosted =
      post.status === 'approved' || post.status === 'scheduled' || post.status === 'published';

    return (
      <div className="space-y-6">
        {isRendered && (
          <RenderPreviewPanel
            post={post}
            onApprove={() => handleAction('approve')}
            approveLoading={actionLoading}
          />
        )}

        {isApprovedOrPosted && <PostingKitPanel post={post} />}

        {post.status === 'published' && (
          <div className="flex items-center justify-center gap-2 text-sm text-accent-teal py-6">
            <CheckCircle className="h-5 w-5" />
            Published
            {post.published_at && (
              <span className="text-[10px] text-text-muted font-mono">
                {formatDate(post.published_at)}
              </span>
            )}
          </div>
        )}

        {post.status === 'failed' && (
          <div className="flex items-center justify-center gap-2 text-sm text-accent-red py-6">
            Failed — check logs and retry
          </div>
        )}
      </div>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40"
        onClick={() => {
          if (post.status === 'planned') {
            const confirmed = window.confirm('Close without saving? Unsaved changes will be lost.');
            if (!confirmed) return;
          }
          onClose();
        }}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <div
          className="bg-card border border-border rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ──────────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <div className="min-w-0 mr-4">
              <p className="text-[10px] font-mono text-text-muted">{post.post_id}</p>
              <h2 className="text-lg font-medium text-text-primary truncate">
                {post.topic}
              </h2>
              {/* Taxonomy badges */}
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <span className={cn('badge text-[10px]', pillarColor(post.content_pillar))}>
                  {pillarLabel(post.content_pillar)}
                </span>
                {post.distillation_filter && (
                  <span className={cn('badge text-[10px]', filterColor(post.distillation_filter))}>
                    {filterLabel(post.distillation_filter)}
                  </span>
                )}
                {post.content_channel && (
                  <span className={cn('badge text-[10px]', channelColor(post.content_channel))}>
                    {channelLabel(post.content_channel)}
                  </span>
                )}
                {post.campaign && (
                  <span className="text-[10px] text-text-muted">{post.campaign}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span
                className={cn(
                  'badge text-xs px-3 py-1',
                  contentPostStatusColor(post.status),
                )}
              >
                {contentPostStatusLabel(post.status)}
              </span>
              <button
                onClick={() => {
                  if (post.status === 'planned') {
                    const confirmed = window.confirm('Close without saving? Unsaved changes will be lost.');
                    if (!confirmed) return;
                  }
                  onClose();
                }}
                className="btn-ghost p-2 -mr-2"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* ── Stepper ─────────────────────────────────────────────────────── */}
          <div className="px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center max-w-xl mx-auto">
              {STEPS.map((step, i) => {
                const completed = currentStep > step.number;
                const active = viewStep === step.number;
                const reachable = step.number <= currentStep;
                const Icon = step.icon;

                return (
                  <div key={step.number} className="flex items-center flex-1 last:flex-none">
                    <button
                      type="button"
                      onClick={() => reachable && setViewStep(step.number)}
                      disabled={!reachable}
                      className={cn(
                        'flex items-center gap-2 transition-colors',
                        reachable ? 'cursor-pointer' : 'cursor-not-allowed opacity-35',
                      )}
                    >
                      <div
                        className={cn(
                          'w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors',
                          completed
                            ? 'bg-accent-teal border-accent-teal'
                            : active
                              ? 'border-accent-primary bg-accent-primary/15'
                              : 'border-border bg-hover',
                        )}
                      >
                        {completed ? (
                          <CheckCircle className="h-4 w-4 text-white" />
                        ) : (
                          <Icon
                            className={cn(
                              'h-4 w-4',
                              active ? 'text-accent-primary' : 'text-text-muted',
                            )}
                          />
                        )}
                      </div>
                      <span
                        className={cn(
                          'text-xs font-medium whitespace-nowrap hidden sm:block',
                          active ? 'text-text-primary' : 'text-text-muted',
                        )}
                      >
                        {step.label}
                      </span>
                    </button>

                    {/* Connector line */}
                    {i < STEPS.length - 1 && (
                      <div
                        className={cn(
                          'flex-1 h-0.5 mx-4',
                          completed ? 'bg-accent-teal' : 'bg-border',
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Content ─────────────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {viewStep === 1 && renderStep1()}
            {viewStep === 2 && renderStep2()}
            {viewStep === 3 && renderStep3()}
          </div>

          {/* ── Footer ──────────────────────────────────────────────────────── */}
          <div className="px-6 py-4 border-t border-border shrink-0">
            {/* Step 1: read-only, allow jumping forward */}
            {viewStep === 1 && currentStep > 1 && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewStep(Math.min(currentStep, 2))}
                  className="btn-ghost text-sm gap-2"
                >
                  Next: Image &amp; Render →
                </button>
              </div>
            )}

            {/* Step 2: upload hint */}
            {viewStep === 2 &&
              (post.status === 'prompt_ready' || post.status === 'awaiting_image') &&
              !post.source_image_path && (
                <p className="text-xs text-text-muted text-center">
                  Generate your image using the prompts above, then upload it.
                </p>
              )}

            {/* Step 2: image uploaded but status not yet image_uploaded — prompt user to render */}
            {viewStep === 2 &&
              (post.status === 'prompt_ready' || post.status === 'awaiting_image') &&
              post.source_image_path && (
                <p className="text-xs text-text-muted text-center">
                  Image uploaded. Click{' '}
                  <span className="text-text-secondary font-medium">Render Post</span> when ready.
                </p>
              )}

            {/* Step 2: render button */}
            {viewStep === 2 && (post.status === 'image_uploaded' || ((post.status === 'prompt_ready' || post.status === 'awaiting_image') && post.source_image_path)) && (
              <button
                type="button"
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

            {/* Step 2: read-only, allow jumping forward */}
            {viewStep === 2 && currentStep > 2 && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewStep(3)}
                  className="btn-ghost text-sm gap-2"
                >
                  Next: Review &amp; Post →
                </button>
              </div>
            )}

            {/* Step 3: mark as posted */}
            {viewStep === 3 &&
              (post.status === 'approved' || post.status === 'scheduled') && (
                <button
                  type="button"
                  onClick={() => handleAction('mark-posted')}
                  disabled={actionLoading}
                  className="btn-primary w-full gap-2"
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Mark as Posted
                </button>
              )}

            {/* Step 3: published */}
            {viewStep === 3 && post.status === 'published' && (
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

            {/* Failed */}
            {post.status === 'failed' && (
              <div className="flex items-center justify-center gap-2 text-sm text-accent-red">
                Failed — check logs and retry
              </div>
            )}
          </div>

          {/* Toast notification */}
          {toast && (
            <div className={cn(
              'absolute bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-xs font-medium shadow-lg z-10 animate-in fade-in slide-in-from-bottom-2 duration-200',
              toast.type === 'error' ? 'bg-accent-red/90 text-white' : 'bg-accent-teal/90 text-white',
            )}>
              {toast.message}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
