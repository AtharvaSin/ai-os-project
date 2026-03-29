'use client';

import { useState, useCallback } from 'react';
import type { ContentPost } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CheckCircle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface RenderPreviewPanelProps {
  post: ContentPost;
  onApprove: () => void;
  approveLoading: boolean;
  className?: string;
}

type ChannelRender = {
  channel: string;
  file: string;
  size_bytes?: number;
  slide?: number;
  frame?: number;
};

/** Parse the render manifest to extract per-channel info. */
function extractChannels(post: ContentPost): string[] {
  const manifest = post.render_manifest;
  if (!manifest) return [];
  const renders = manifest.renders as ChannelRender[] | undefined;
  if (!Array.isArray(renders)) return [];
  const seen = new Set<string>();
  for (const r of renders) {
    if (r.channel) seen.add(r.channel);
  }
  return Array.from(seen);
}

/** Count slides for a carousel channel from render_manifest. */
function countSlides(post: ContentPost, channel: string): number {
  const manifest = post.render_manifest;
  if (!manifest) return 0;
  const renders = manifest.renders as ChannelRender[] | undefined;
  if (!Array.isArray(renders)) return 0;
  return renders.filter((r) => r.channel === channel && r.slide != null).length;
}

// ─── Platform Mockups ────────────────────────────────────────────────────────

interface MockupImageProps {
  src: string;
  className?: string;
}

function MockupImage({ src, className }: MockupImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Rendered post"
      className={cn('w-full object-cover block', className)}
    />
  );
}

function InstagramMockup({ imageSrc, post }: { imageSrc: string; post: ContentPost }) {
  const hookText = post.hook ? post.hook.substring(0, 80) : '';
  const hashtags = post.hashtags ? post.hashtags.substring(0, 60) : '';

  return (
    <div className="rounded-xl border border-border bg-[#0F0F0F] overflow-hidden text-xs max-w-sm mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-accent-primary/30 flex items-center justify-center text-[8px] font-bold text-accent-primary">
            B
          </div>
          <span className="text-[11px] font-medium text-text-primary">bhv_official</span>
        </div>
        <span className="text-text-muted text-[14px] tracking-widest">···</span>
      </div>

      {/* Image — 1:1 */}
      <div className="aspect-square w-full bg-bg-secondary overflow-hidden">
        <MockupImage src={imageSrc} className="h-full" />
      </div>

      {/* Action bar */}
      <div className="px-3 py-2 space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-[16px]">
            <span>♡</span>
            <span>💬</span>
            <span>✈</span>
          </div>
          <span className="text-[14px]">⊡</span>
        </div>
        {hookText && (
          <p className="text-[10px] text-text-secondary leading-snug">
            <span className="font-semibold text-text-primary">bhv_official </span>
            {hookText}
            {post.hook && post.hook.length > 80 ? '...' : ''}
          </p>
        )}
        {hashtags && (
          <p className="text-[10px] text-accent-primary/70 truncate">{hashtags}</p>
        )}
      </div>
    </div>
  );
}

function TwitterMockup({ imageSrc, post }: { imageSrc: string; post: ContentPost }) {
  const hookText = post.hook ? post.hook.substring(0, 280) : post.topic.substring(0, 280);

  return (
    <div className="rounded-xl border border-border bg-[#0F0F0F] overflow-hidden text-xs max-w-sm mx-auto">
      {/* Header */}
      <div className="flex items-start gap-2 px-3 pt-3 pb-2">
        <div className="h-8 w-8 rounded-full bg-accent-primary/30 flex items-center justify-center text-[10px] font-bold text-accent-primary shrink-0">
          B
        </div>
        <div>
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-semibold text-text-primary">Bharatvarsh</span>
            <span className="text-text-muted text-[10px]">@bhv · now</span>
          </div>
          <p className="text-[11px] text-text-secondary leading-snug mt-0.5">{hookText}</p>
        </div>
      </div>

      {/* Image — 16:9 */}
      <div className="mx-3 mb-2 rounded-lg overflow-hidden aspect-video bg-bg-secondary">
        <MockupImage src={imageSrc} className="h-full" />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-3 pb-3 text-text-muted text-[10px]">
        <span>💬 0</span>
        <span>🔁 0</span>
        <span>❤ 0</span>
        <span>📊 0</span>
      </div>
    </div>
  );
}

function FacebookMockup({ imageSrc, post }: { imageSrc: string; post: ContentPost }) {
  const caption = post.caption_text
    ? post.caption_text.substring(0, 120)
    : post.hook?.substring(0, 120) ?? '';

  return (
    <div className="rounded-xl border border-border bg-[#0F0F0F] overflow-hidden text-xs max-w-sm mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <div className="h-8 w-8 rounded-full bg-[#1877F2]/30 flex items-center justify-center text-[10px] font-bold text-[#1877F2] shrink-0">
          B
        </div>
        <div>
          <p className="text-[11px] font-semibold text-text-primary">Bharatvarsh</p>
          <p className="text-[10px] text-text-muted">Now · 🌐</p>
        </div>
      </div>

      {/* Caption */}
      {caption && (
        <p className="px-3 pb-2 text-[11px] text-text-secondary leading-snug">
          {caption}
          {post.caption_text && post.caption_text.length > 120 ? '...' : ''}
        </p>
      )}

      {/* Image — 1.91:1 */}
      <div className="w-full bg-bg-secondary overflow-hidden" style={{ aspectRatio: '1.91' }}>
        <MockupImage src={imageSrc} className="h-full" />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-3 py-2.5 border-t border-border/50 text-[10px] text-text-muted">
        <span>👍 Like</span>
        <span>💬 Comment</span>
        <span>↗ Share</span>
      </div>
    </div>
  );
}

function LinkedInMockup({ imageSrc, post }: { imageSrc: string; post: ContentPost }) {
  const caption = post.caption_text
    ? post.caption_text.substring(0, 120)
    : post.hook?.substring(0, 120) ?? '';

  return (
    <div className="rounded-xl border border-border bg-[#0F0F0F] overflow-hidden text-xs max-w-sm mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <div className="h-8 w-8 rounded-full bg-[#0A66C2]/30 flex items-center justify-center text-[10px] font-bold text-[#0A66C2] shrink-0">
          B
        </div>
        <div>
          <p className="text-[11px] font-semibold text-text-primary">Bharatvarsh</p>
          <p className="text-[10px] text-text-muted">Now · 🌐</p>
        </div>
      </div>

      {/* Caption */}
      {caption && (
        <p className="px-3 pb-2 text-[11px] text-text-secondary leading-snug">
          {caption}
          {post.caption_text && post.caption_text.length > 120 ? '...' : ''}
        </p>
      )}

      {/* Image — 1.91:1 */}
      <div className="w-full bg-bg-secondary overflow-hidden" style={{ aspectRatio: '1.91' }}>
        <MockupImage src={imageSrc} className="h-full" />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-3 py-2.5 border-t border-border/50 text-[10px] text-text-muted">
        <span>👍 Like</span>
        <span>💬 Comment</span>
        <span>🔁 Repost</span>
        <span>✈ Send</span>
      </div>
    </div>
  );
}

// ─── Channel Mockup Selector ─────────────────────────────────────────────────

interface ChannelMockupProps {
  channel: string;
  imageSrc: string;
  post: ContentPost;
}

function ChannelMockup({ channel, imageSrc, post }: ChannelMockupProps) {
  switch (channel) {
    case 'instagram':
      return <InstagramMockup imageSrc={imageSrc} post={post} />;
    case 'twitter':
      return <TwitterMockup imageSrc={imageSrc} post={post} />;
    case 'facebook':
      return <FacebookMockup imageSrc={imageSrc} post={post} />;
    case 'linkedin':
      return <LinkedInMockup imageSrc={imageSrc} post={post} />;
    default:
      return (
        <div className="rounded-lg border border-border bg-bg-secondary p-4 max-w-sm mx-auto">
          <p className="text-xs text-text-muted text-center capitalize">{channel}</p>
          <MockupImage src={imageSrc} className="mt-2 rounded" />
        </div>
      );
  }
}

// ─── Main Panel ──────────────────────────────────────────────────────────────

/**
 * Shows platform-contextual visual previews for rendered posts.
 * Visible when status is 'rendered' or 'approved'.
 * Hosts the Approve button.
 */
export function RenderPreviewPanel({
  post,
  onApprove,
  approveLoading,
  className,
}: RenderPreviewPanelProps) {
  const channels = extractChannels(post);
  const [activeChannel, setActiveChannel] = useState<string>(channels[0] ?? '');
  const [slideIndex, setSlideIndex] = useState(1); // 1-indexed

  const isCarousel = post.render_manifest?.type === 'carousel';
  const isAnimation = post.render_manifest?.type === 'animation';
  const isMultiFrame = isCarousel || isAnimation;

  const currentChannel = channels.includes(activeChannel) ? activeChannel : channels[0] ?? '';

  const slideCount = isMultiFrame ? countSlides(post, currentChannel) : 0;

  const handlePrevSlide = useCallback(() => {
    setSlideIndex((i) => Math.max(1, i - 1));
  }, []);

  const handleNextSlide = useCallback(() => {
    setSlideIndex((i) => Math.min(slideCount, i + 1));
  }, [slideCount]);

  // Reset slide when channel changes
  const handleChannelChange = useCallback((ch: string) => {
    setActiveChannel(ch);
    setSlideIndex(1);
  }, []);

  if (channels.length === 0) {
    return (
      <div className={cn('space-y-3', className)}>
        <p className="text-[11px] font-semibold text-accent-primary uppercase tracking-[0.15em]">
          Visual Review
        </p>
        <p className="text-xs text-text-muted">No renders available yet.</p>
      </div>
    );
  }

  // Build image src
  const imageSrc = isMultiFrame
    ? `/api/content-pipeline/${post.post_id}/renders/${currentChannel}?slide=${slideIndex}`
    : `/api/content-pipeline/${post.post_id}/renders/${currentChannel}`;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Section header */}
      <div>
        <p className="text-[11px] font-semibold text-accent-primary uppercase tracking-[0.15em]">
          Visual Review
        </p>
        <p className="text-[10px] text-text-muted mt-0.5">
          How your post looks on each platform
        </p>
      </div>

      {/* Channel tabs */}
      <div className="flex gap-1 border-b border-border">
        {channels.map((ch) => (
          <button
            key={ch}
            onClick={() => handleChannelChange(ch)}
            className={cn(
              'px-3 py-1.5 text-[11px] font-medium rounded-t transition-colors',
              currentChannel === ch
                ? 'bg-accent-primary/15 text-accent-primary border-b-2 border-accent-primary'
                : 'text-text-muted hover:text-text-secondary',
            )}
          >
            {ch}
          </button>
        ))}
      </div>

      {/* Carousel slide navigation */}
      {isMultiFrame && slideCount > 0 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handlePrevSlide}
            disabled={slideIndex <= 1}
            className="p-1 text-text-muted hover:text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs text-text-secondary font-mono">
            {slideIndex} / {slideCount}
          </span>
          <button
            onClick={handleNextSlide}
            disabled={slideIndex >= slideCount}
            className="p-1 text-text-muted hover:text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next slide"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Platform mockup */}
      <ChannelMockup channel={currentChannel} imageSrc={imageSrc} post={post} />

      {/* Approve / Approved state */}
      {post.status === 'rendered' && (
        <button
          onClick={onApprove}
          disabled={approveLoading}
          className="btn-primary w-full gap-2 mt-2"
        >
          {approveLoading ? (
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
          Approved — ready for distribution
        </div>
      )}
    </div>
  );
}
