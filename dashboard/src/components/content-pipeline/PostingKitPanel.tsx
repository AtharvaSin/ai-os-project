'use client';

import { useState, useCallback } from 'react';
import type { ContentPost } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Copy, Check, Download, Loader2, Package } from 'lucide-react';

// ─── Channel configuration ────────────────────────────────────────────────────

interface ChannelMeta {
  label: string;
  file: string;
  badge: string;
  charLimit?: number;
  includeHashtags: boolean;
  steps: string[];
}

const CHANNEL_META: Record<string, ChannelMeta> = {
  instagram: {
    label: 'Instagram',
    file: 'instagram_1x1.png',
    badge: 'IG',
    includeHashtags: true,
    steps: [
      'Open Instagram → + → Post',
      'Select & upload the image',
      'Paste caption (hashtags included)',
    ],
  },
  facebook: {
    label: 'Facebook',
    file: 'facebook_1.91x1.png',
    badge: 'FB',
    includeHashtags: false,
    steps: [
      'Open Facebook Page → Create post',
      'Upload the image',
      'Paste the text',
    ],
  },
  twitter: {
    label: 'X / Twitter',
    file: 'twitter_16x9.png',
    badge: 'X',
    charLimit: 280,
    includeHashtags: false,
    steps: [
      'Open X.com → Compose',
      'Upload the image',
      'Paste tweet text (≤280 chars)',
    ],
  },
};

// ─── Copy button ─────────────────────────────────────────────────────────────

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — silently ignore
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded transition-colors',
        copied
          ? 'bg-accent-teal/20 text-accent-teal'
          : 'bg-hover text-text-muted hover:text-text-secondary',
      )}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied!' : label}
    </button>
  );
}

// ─── Single channel kit ───────────────────────────────────────────────────────

interface ChannelKitProps {
  channel: string;
  postId: string;
  captionText: string;
  hashtags: string | null;
}

function ChannelKit({ channel, postId, captionText, hashtags }: ChannelKitProps) {
  const meta = CHANNEL_META[channel];
  if (!meta) return null;

  const assetUrl = `/api/content-pipeline/${postId}/asset/${meta.file}`;

  // Build the primary copy text for this channel
  const copyText =
    meta.charLimit != null
      ? captionText.substring(0, meta.charLimit)
      : meta.includeHashtags && hashtags
      ? `${captionText}\n\n${hashtags}`
      : captionText;

  const charCount = copyText.length;
  const overLimit = meta.charLimit != null && charCount > meta.charLimit;

  const textLabel =
    meta.charLimit != null
      ? 'Tweet text'
      : meta.includeHashtags
      ? 'Caption + hashtags'
      : 'Post text';

  return (
    <div className="card p-4 space-y-3">
      {/* Channel header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="badge bg-accent-primary/15 text-accent-primary text-[11px] font-bold px-2 py-0.5">
            {meta.badge}
          </span>
          <span className="text-sm font-medium text-text-primary">{meta.label}</span>
        </div>
        <a
          href={assetUrl}
          download={meta.file}
          className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded bg-hover text-text-muted hover:text-text-secondary transition-colors"
        >
          <Download className="h-3 w-3" />
          Download image
        </a>
      </div>

      {/* Steps */}
      <ol className="space-y-0.5">
        {meta.steps.map((step, i) => (
          <li key={i} className="flex items-start gap-1.5 text-[10px] text-text-muted">
            <span className="font-mono text-accent-primary/60 shrink-0">{i + 1}.</span>
            {step}
          </li>
        ))}
      </ol>

      {/* Image preview */}
      <div className="rounded overflow-hidden border border-border bg-black/20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={assetUrl}
          alt={`${meta.label} rendered post`}
          className="w-full object-contain max-h-52"
        />
      </div>

      {/* Primary text block */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold text-accent-primary uppercase tracking-[0.12em]">
            {textLabel}
          </p>
          <div className="flex items-center gap-2">
            {meta.charLimit != null && (
              <span
                className={cn(
                  'text-[10px] font-mono',
                  overLimit ? 'text-accent-red' : 'text-text-muted',
                )}
              >
                {charCount}/{meta.charLimit}
              </span>
            )}
            <CopyButton text={copyText} label="Copy" />
          </div>
        </div>
        <div className="card bg-black/20 p-2.5 max-h-32 overflow-y-auto">
          <p className="text-[11px] text-text-secondary leading-relaxed whitespace-pre-wrap font-mono">
            {copyText}
          </p>
        </div>
      </div>

      {/* Separate hashtags block for Instagram */}
      {meta.includeHashtags && hashtags && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold text-accent-primary uppercase tracking-[0.12em]">
              Hashtags only
            </p>
            <CopyButton text={hashtags} label="Copy" />
          </div>
          <div className="card bg-black/20 p-2.5">
            <p className="text-[10px] text-text-muted font-mono leading-relaxed">{hashtags}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

interface PostingKitPanelProps {
  post: ContentPost;
}

export function PostingKitPanel({ post }: PostingKitPanelProps) {
  const captionText = post.caption_text ?? '';

  const [downloading, setDownloading] = useState(false);

  const handleDownloadPack = useCallback(async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/content-pipeline/${post.post_id}/download-pack`);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${post.post_id}-post-pack.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download pack failed:', err);
    } finally {
      setDownloading(false);
    }
  }, [post.post_id]);

  const manifest = post.render_manifest as {
    renders?: { channel: string; file: string }[];
  } | null;

  // Prefer manifest order; fall back to post.channels
  const renderedChannels = manifest?.renders?.map((r) => r.channel) ?? post.channels;
  const channels = renderedChannels.filter((ch) => ch in CHANNEL_META);

  if (channels.length === 0) {
    return (
      <div className="card p-4 text-center">
        <p className="text-xs text-text-muted">No rendered assets found. Run render first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-accent-primary uppercase tracking-[0.15em] mb-1">
            Posting Kit
          </p>
          <p className="text-[10px] text-text-muted">
            Download each image · copy the text · post manually per channel.
          </p>
        </div>
        <button
          onClick={handleDownloadPack}
          disabled={downloading}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-accent-primary/15 text-accent-primary hover:bg-accent-primary/25 transition-colors shrink-0 disabled:opacity-50"
        >
          {downloading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Package className="h-3.5 w-3.5" />
          )}
          {downloading ? 'Packing...' : 'Download Pack'}
        </button>
      </div>
      {channels.map((ch) => (
        <ChannelKit
          key={ch}
          channel={ch}
          postId={post.post_id}
          captionText={captionText}
          hashtags={post.hashtags ?? null}
        />
      ))}
    </div>
  );
}
