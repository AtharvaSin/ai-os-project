'use client';

import { useState, useCallback, useEffect } from 'react';
import type { ContentPost } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Save, Check, Loader2, Lightbulb } from 'lucide-react';

interface ImageDirectionPanelProps {
  post: ContentPost;
  onSave: (notes: string) => Promise<void>;
}

export function ImageDirectionPanel({ post, onSave }: ImageDirectionPanelProps) {
  const savedNotes =
    (post.style_overrides?.render_notes as string | undefined) ?? '';

  const [notes, setNotes] = useState(savedNotes);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sync if post refreshes
  useEffect(() => {
    setNotes((post.style_overrides?.render_notes as string | undefined) ?? '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.updated_at]);

  const isDirty = notes !== savedNotes;

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onSave(notes);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }, [notes, onSave]);

  return (
    <div className="card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start gap-2">
        <Lightbulb className="h-4 w-4 text-accent-gold shrink-0 mt-0.5" />
        <div>
          <p className="text-[11px] font-semibold text-accent-primary uppercase tracking-[0.15em]">
            Image Direction Notes
          </p>
          <p className="text-[10px] text-text-muted mt-0.5">
            Specify how to use the uploaded image in the render — crop, positioning, focal point, overlays.
          </p>
        </div>
      </div>

      {/* Textarea */}
      <textarea
        className="w-full bg-[var(--bg-hover)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-accent-primary/50 resize-none"
        rows={4}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="e.g. Position hero on left third, show only upper body. Quote overlay on right. Dark vignette at edges. Keep Jim Lee line art contrast high…"
      />

      {/* Save row */}
      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="flex items-center gap-1 text-[10px] text-accent-teal">
            <Check className="h-3 w-3" />
            Saved
          </span>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !isDirty}
          className={cn(
            'btn-ghost gap-1.5 text-xs px-3 py-1.5',
            (!isDirty || saving) && 'opacity-40 cursor-not-allowed',
          )}
        >
          {saving ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Save className="h-3 w-3" />
          )}
          Save Notes
        </button>
      </div>
    </div>
  );
}
