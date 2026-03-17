'use client';

import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

interface AddDomainModalProps {
  parentId: string;
  parentName: string;
  onClose: () => void;
  onCreated: () => void;
}

const PRESET_COLORS = ['#7B68EE', '#4ECDC4', '#E8B931', '#FF6B6B'];

/** Convert a name to a URL-safe slug */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function AddDomainModal({ parentId, parentName, onClose, onCreated }: AddDomainModalProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [colorCode, setColorCode] = useState<string>(PRESET_COLORS[0]!);
  const [customColor, setCustomColor] = useState('');
  const [useCustomColor, setUseCustomColor] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug from name
  useEffect(() => {
    setSlug(toSlug(name));
  }, [name]);

  // Close on Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const activeColor = useCustomColor ? customColor : colorCode;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/life-graph/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          parent_id: parentId,
          description: description.trim() || undefined,
          color_code: activeColor || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Failed to create domain (${res.status})`);
      }
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create domain');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="card w-full max-w-md p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-xl text-text-primary">New Domain</h2>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Parent (read-only) */}
        <div>
          <label className="block text-xs font-mono text-text-muted mb-1">Parent</label>
          <div className="w-full rounded-lg border border-border bg-hover px-3 py-2 text-sm text-text-secondary">
            {parentName}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs font-mono text-text-muted mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-border bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-purple"
            placeholder="e.g., Fitness Tracking"
            autoFocus
            required
          />
        </div>

        {/* Slug (auto-generated) */}
        <div>
          <label className="block text-xs font-mono text-text-muted mb-1">Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full rounded-lg border border-border bg-primary px-3 py-2 text-sm text-text-secondary font-mono placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-purple"
            placeholder="auto-generated-from-name"
            required
          />
          <p className="text-[10px] text-text-muted mt-0.5">Auto-generated. Edit if needed.</p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-mono text-text-muted mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-border bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-purple resize-none"
            placeholder="Optional description..."
          />
        </div>

        {/* Color code */}
        <div>
          <label className="block text-xs font-mono text-text-muted mb-1">Color</label>
          <div className="flex items-center gap-3">
            {/* Preset color circles */}
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setColorCode(c);
                    setUseCustomColor(false);
                  }}
                  className="h-7 w-7 rounded-full border-2 transition-all shrink-0"
                  style={{
                    backgroundColor: c,
                    borderColor: !useCustomColor && colorCode === c ? 'white' : 'transparent',
                    transform: !useCustomColor && colorCode === c ? 'scale(1.15)' : 'scale(1)',
                  }}
                  title={c}
                />
              ))}
            </div>

            {/* Separator */}
            <div className="h-6 w-px bg-border" />

            {/* Custom hex input */}
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={customColor}
                onChange={(e) => {
                  setCustomColor(e.target.value);
                  setUseCustomColor(true);
                }}
                onFocus={() => setUseCustomColor(true)}
                className="w-20 rounded-lg border border-border bg-primary px-2 py-1 text-xs text-text-primary font-mono placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-purple"
                placeholder="#hex"
                maxLength={7}
              />
              {useCustomColor && customColor && /^#[0-9a-fA-F]{6}$/.test(customColor) && (
                <div
                  className="h-5 w-5 rounded-full border border-border shrink-0"
                  style={{ backgroundColor: customColor }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p className="text-xs text-accent-red">{error}</p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button type="submit" disabled={submitting || !name.trim()} className="btn-primary">
            {submitting ? 'Creating...' : 'Create Domain'}
          </button>
        </div>
      </form>
    </div>
  );
}
