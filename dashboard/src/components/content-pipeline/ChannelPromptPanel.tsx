'use client';

import { useState, useCallback } from 'react';
import type { ContentPost } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Copy, Check } from 'lucide-react';

interface ChannelConfig {
  aspectRatio: string;
  dimensions: string;
  compositionNote: string;
}

const CHANNEL_CONFIG: Record<string, ChannelConfig> = {
  instagram: {
    aspectRatio: '1:1',
    dimensions: '1080 × 1080 px',
    compositionNote: 'square composition, bold centered framing, strong foreground presence',
  },
  twitter: {
    aspectRatio: '16:9',
    dimensions: '1200 × 675 px',
    compositionNote: 'wide cinematic landscape, horizontal spread, rule of thirds',
  },
  facebook: {
    aspectRatio: '1.91:1',
    dimensions: '1200 × 628 px',
    compositionNote: 'horizontal social banner, wide composition, left-anchored focal point',
  },
  linkedin: {
    aspectRatio: '1.91:1',
    dimensions: '1200 × 628 px',
    compositionNote: 'professional horizontal layout, clean composition, minimal visual clutter',
  },
};

const STYLE_SUFFIX =
  'Jim Lee modern American comic book art style, heavy inking, dense cross-hatching, dramatic shadows';

const DEFAULT_NEGATIVE =
  'blurry, low quality, watermark, text overlay, cartoon, anime';

/** Statuses for which the image prompt panel is visible (parent controls mount) */

/**
 * Builds the full copy-ready image generation prompt for a given channel.
 */
function buildPrompt(post: ContentPost, channel: string): string {
  const config = CHANNEL_CONFIG[channel];
  if (!config) return '';

  // Base content: art_prompt.positive_prompt takes priority over visual_direction
  const positivePrompt =
    typeof post.art_prompt?.positive_prompt === 'string' && post.art_prompt.positive_prompt
      ? post.art_prompt.positive_prompt
      : post.visual_direction ?? '';

  const negative =
    typeof post.art_prompt?.negative_prompt === 'string' && post.art_prompt.negative_prompt
      ? post.art_prompt.negative_prompt
      : DEFAULT_NEGATIVE;

  const promptLine = [positivePrompt, config.compositionNote, STYLE_SUFFIX]
    .filter(Boolean)
    .join(', ');

  return `${promptLine}\n\nAspect ratio: ${config.aspectRatio} (${config.dimensions})\nNegative: ${negative}`;
}

interface ChannelTabProps {
  channel: string;
  promptText: string;
}

/** Renders a single channel tab content with copy button and character count. */
function ChannelTabContent({ channel, promptText }: ChannelTabProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(promptText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [promptText]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-text-muted font-mono">
          {promptText.length} chars
        </span>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1 text-[10px] text-accent-primary hover:underline"
          aria-label={`Copy prompt for ${channel}`}
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="text-[11px] text-text-secondary bg-hover rounded-md p-3 whitespace-pre-wrap leading-relaxed font-mono overflow-x-auto max-h-56 overflow-y-auto">
        {promptText}
      </pre>
    </div>
  );
}

interface ChannelPromptPanelProps {
  post: ContentPost;
  className?: string;
}

/**
 * Shows copy-ready image generation prompts per channel.
 * Only visible when post status is planned, prompt_ready, or awaiting_image.
 */
export function ChannelPromptPanel({ post, className }: ChannelPromptPanelProps) {
  const [activeChannel, setActiveChannel] = useState<string>(post.channels[0] ?? '');

  if (post.channels.length === 0) return null;

  // Only show channels we have config for
  const renderableChannels = post.channels.filter((ch) => CHANNEL_CONFIG[ch]);
  if (renderableChannels.length === 0) return null;

  // Ensure activeChannel is valid; we already checked renderableChannels.length > 0
  const fallbackChannel = renderableChannels[0] as string;
  const currentChannel = renderableChannels.includes(activeChannel)
    ? activeChannel
    : fallbackChannel;

  const promptText = buildPrompt(post, currentChannel);

  return (
    <div className={cn('space-y-3', className)}>
      <p className="text-[11px] font-semibold text-accent-primary uppercase tracking-[0.15em]">
        Image Prompts
      </p>

      {/* Channel tab bar */}
      <div className="flex gap-1 border-b border-border pb-0">
        {renderableChannels.map((ch) => (
          <button
            key={ch}
            onClick={() => setActiveChannel(ch)}
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

      {/* Active channel prompt */}
      {promptText && <ChannelTabContent channel={currentChannel} promptText={promptText} />}

      {/* Guidance note */}
      <p className="text-[10px] text-text-muted leading-relaxed">
        Generate your image in OpenArt, Midjourney, or Google Flow using the prompt above,
        then upload the result below.
      </p>
    </div>
  );
}
