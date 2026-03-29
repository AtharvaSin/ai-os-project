'use client';

import { useState, useCallback, useEffect } from 'react';
import type { ContentPost } from '@/lib/types';
import { cn, pillarLabel, pillarColor, filterLabel, filterColor, channelLabel, channelColor, formatDate } from '@/lib/utils';
import {
  ChevronDown,
  ChevronUp,
  Save,
  Loader2,
  ArrowRight,
  Hash,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface ArtPromptFields {
  positive_prompt: string;
  negative_prompt: string;
  composition: string;
  media_type: string;
}

function extractArtPrompt(post: ContentPost): ArtPromptFields {
  const ap = post.art_prompt ?? {};
  return {
    positive_prompt: (ap.positive_prompt as string) ?? '',
    negative_prompt: (ap.negative_prompt as string) ?? '',
    composition: (ap.composition as string) ?? '',
    media_type: (ap.media_type as string) ?? 'single',
  };
}

const INPUT_CLS =
  'w-full bg-[var(--bg-hover)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-accent-primary/50 resize-none';

const LABEL_CLS =
  'text-[10px] font-semibold text-accent-primary uppercase tracking-[0.12em] mb-1 block';

function audienceLabel(raw: string): string {
  const map: Record<string, string> = {
    'A': 'Core Fans',
    'B': 'Sci-Fi Enthusiasts',
    'C': 'General Audience',
  };
  return raw.split(',').map(s => map[s.trim()] ?? s.trim()).join(', ');
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ContentBriefPanelProps {
  post: ContentPost;
  onSave: (updates: Record<string, unknown>) => Promise<void>;
  onFinalise: () => Promise<void>;
  saving: boolean;
  finalising: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ContentBriefPanel({
  post,
  onSave,
  onFinalise,
  saving,
  finalising,
}: ContentBriefPanelProps) {
  const [topic, setTopic] = useState(post.topic ?? '');
  const [hook, setHook] = useState(post.hook ?? '');
  const [caption, setCaption] = useState(post.caption_text ?? '');
  const [visualDirection, setVisualDirection] = useState(post.visual_direction ?? '');
  const [loreRefs, setLoreRefs] = useState(post.lore_refs ?? '');
  const [hashtags, setHashtags] = useState(post.hashtags ?? '');
  const [ctaType, setCtaType] = useState(post.cta_type ?? '');
  const [ctaLink, setCtaLink] = useState(post.cta_link ?? '');
  const [artFields, setArtFields] = useState<ArtPromptFields>(extractArtPrompt(post));
  const [artOpen, setArtOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Reset when post refreshes after save (updated_at changes)
  useEffect(() => {
    setTopic(post.topic ?? '');
    setHook(post.hook ?? '');
    setCaption(post.caption_text ?? '');
    setVisualDirection(post.visual_direction ?? '');
    setLoreRefs(post.lore_refs ?? '');
    setHashtags(post.hashtags ?? '');
    setCtaType(post.cta_type ?? '');
    setCtaLink(post.cta_link ?? '');
    setArtFields(extractArtPrompt(post));
    setHasChanges(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.updated_at]);

  const dirty = useCallback(() => setHasChanges(true), []);

  const handleSave = useCallback(async () => {
    await onSave({
      topic,
      hook: hook || null,
      caption_text: caption || null,
      visual_direction: visualDirection || null,
      lore_refs: loreRefs || null,
      hashtags: hashtags || null,
      cta_type: ctaType || null,
      cta_link: ctaLink || null,
      art_prompt: {
        ...(post.art_prompt ?? {}),
        ...artFields,
      },
    });
    // useEffect resets hasChanges once post.updated_at propagates
  }, [topic, hook, caption, visualDirection, loreRefs, hashtags, ctaType, ctaLink, artFields, post.art_prompt, onSave]);

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div>
        <p className="text-[11px] font-semibold text-accent-primary uppercase tracking-[0.15em] mb-1">
          Content Brief
        </p>
        <p className="text-[10px] text-text-muted">
          Review and refine all content fields. Save changes, then finalise to proceed to image generation.
        </p>
      </div>

      {/* Objective card (read-only) */}
      <div className="card p-3 space-y-2 bg-accent-primary/5 border-accent-primary/20">
        <p className="text-[10px] font-semibold text-accent-primary uppercase tracking-[0.12em]">
          Objective
        </p>
        <div className="flex flex-wrap gap-2">
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
            <span className="badge bg-hover text-text-muted text-[10px]">{post.campaign}</span>
          )}
          {post.channels.map((ch) => (
            <span key={ch} className="inline-flex items-center gap-1 badge bg-hover text-text-muted text-[10px]">
              <Hash className="h-2.5 w-2.5" />
              {ch}
            </span>
          ))}
        </div>
        {post.target_audience && (
          <p className="text-[10px] text-text-muted">
            <span className="text-text-secondary font-medium">Audience:</span>{' '}
            {audienceLabel(post.target_audience)}
          </p>
        )}
        {post.scheduled_date && (
          <p className="text-[10px] text-text-muted">
            <span className="text-text-secondary font-medium">Scheduled:</span>{' '}
            {formatDate(post.scheduled_date)}
            {post.scheduled_time && (
              <>{' '}<span className="font-mono ml-1">{post.scheduled_time}</span></>
            )}
          </p>
        )}
      </div>

      {/* Editable fields */}
      <div className="space-y-4">
        {/* Topic */}
        <div>
          <label className={LABEL_CLS}>Topic</label>
          <textarea
            className={INPUT_CLS}
            rows={2}
            value={topic}
            onChange={(e) => { setTopic(e.target.value); dirty(); }}
          />
        </div>

        {/* Hook */}
        <div>
          <label className={LABEL_CLS}>Hook</label>
          <textarea
            className={INPUT_CLS}
            rows={3}
            value={hook}
            onChange={(e) => { setHook(e.target.value); dirty(); }}
            placeholder="Opening hook to grab attention…"
          />
          <p className="text-[10px] text-text-muted text-right mt-0.5">{hook.length} chars</p>
        </div>

        {/* Caption */}
        <div>
          <label className={LABEL_CLS}>Caption</label>
          <textarea
            className={cn(INPUT_CLS, 'max-h-40')}
            rows={5}
            value={caption}
            onChange={(e) => { setCaption(e.target.value); dirty(); }}
            placeholder="Full caption text for social posts…"
          />
          <div className="flex items-center justify-between mt-0.5">
            <div className="flex gap-2">
              <span className={cn('text-[10px] font-mono', caption.length > 280 ? 'text-accent-red' : 'text-text-muted')}>X: {Math.min(caption.length, 280)}/280</span>
              <span className={cn('text-[10px] font-mono', caption.length > 2200 ? 'text-accent-red' : 'text-text-muted')}>IG: {caption.length}/2200</span>
            </div>
            <span className="text-[10px] text-text-muted">{caption.length} chars</span>
          </div>
        </div>

        {/* Visual Direction */}
        <div>
          <label className={LABEL_CLS}>Visual Direction</label>
          <textarea
            className={INPUT_CLS}
            rows={3}
            value={visualDirection}
            onChange={(e) => { setVisualDirection(e.target.value); dirty(); }}
            placeholder="High-level visual direction for the image…"
          />
        </div>

        {/* Lore Refs */}
        <div>
          <label className={LABEL_CLS}>Lore References</label>
          <textarea
            className={INPUT_CLS}
            rows={2}
            value={loreRefs}
            onChange={(e) => { setLoreRefs(e.target.value); dirty(); }}
            placeholder="Relevant lore or character references…"
          />
        </div>

        {/* Hashtags */}
        <div>
          <label className={LABEL_CLS}>Hashtags</label>
          <textarea
            className={cn(INPUT_CLS, 'font-mono')}
            rows={2}
            value={hashtags}
            onChange={(e) => { setHashtags(e.target.value); dirty(); }}
            placeholder="#BharatVarsh #IndianComics …"
          />
        </div>

        {/* CTA row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL_CLS}>CTA Type</label>
            <input
              type="text"
              className={INPUT_CLS}
              value={ctaType}
              onChange={(e) => { setCtaType(e.target.value); dirty(); }}
              placeholder="follow / visit / read"
            />
          </div>
          <div>
            <label className={LABEL_CLS}>CTA Link</label>
            <input
              type="text"
              className={INPUT_CLS}
              value={ctaLink}
              onChange={(e) => { setCtaLink(e.target.value); dirty(); }}
              placeholder="https://…"
            />
          </div>
        </div>

        {/* Art Prompt (collapsible) */}
        <div>
          <button
            type="button"
            onClick={() => setArtOpen((o) => !o)}
            className="flex items-center gap-2 w-full text-left mb-2"
          >
            <span className={cn(LABEL_CLS, 'mb-0')}>Art Prompt</span>
            {artOpen ? (
              <ChevronUp className="h-3 w-3 text-text-muted" />
            ) : (
              <ChevronDown className="h-3 w-3 text-text-muted" />
            )}
          </button>

          {artOpen && (
            <div className="card p-3 space-y-3">
              <div>
                <label className="text-[10px] font-mono text-text-muted mb-1 block">
                  positive_prompt
                </label>
                <textarea
                  className={cn(INPUT_CLS, 'font-mono text-xs')}
                  rows={3}
                  value={artFields.positive_prompt}
                  onChange={(e) => {
                    setArtFields((p) => ({ ...p, positive_prompt: e.target.value }));
                    dirty();
                  }}
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-text-muted mb-1 block">
                  negative_prompt
                </label>
                <textarea
                  className={cn(INPUT_CLS, 'font-mono text-xs')}
                  rows={2}
                  value={artFields.negative_prompt}
                  onChange={(e) => {
                    setArtFields((p) => ({ ...p, negative_prompt: e.target.value }));
                    dirty();
                  }}
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-text-muted mb-1 block">
                  composition
                </label>
                <input
                  type="text"
                  className={cn(INPUT_CLS, 'font-mono text-xs')}
                  value={artFields.composition}
                  onChange={(e) => {
                    setArtFields((p) => ({ ...p, composition: e.target.value }));
                    dirty();
                  }}
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-text-muted mb-1 block">
                  media_type
                </label>
                <select
                  className={cn(INPUT_CLS, 'text-xs')}
                  value={artFields.media_type}
                  onChange={(e) => {
                    setArtFields((p) => ({ ...p, media_type: e.target.value }));
                    dirty();
                  }}
                >
                  <option value="single">single</option>
                  <option value="carousel">carousel</option>
                  <option value="animation">animation</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between pt-3 border-t border-border gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className={cn(
            'btn-ghost gap-2 text-sm shrink-0',
            (!hasChanges || saving) && 'opacity-40 cursor-not-allowed',
          )}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Changes
        </button>

        <button
          type="button"
          onClick={onFinalise}
          disabled={finalising || hasChanges}
          className={cn(
            'btn-primary gap-2 text-sm shrink-0',
            (hasChanges || finalising) && 'opacity-40 cursor-not-allowed',
          )}
          title={hasChanges ? 'Save your changes before finalising' : undefined}
        >
          {finalising ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          Finalise Content
        </button>
      </div>
    </div>
  );
}
