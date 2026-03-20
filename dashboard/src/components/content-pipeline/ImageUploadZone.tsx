'use client';

import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Upload, Loader2, CheckCircle } from 'lucide-react';

interface ImageUploadZoneProps {
  postId: string;
  onUploadComplete: () => void;
}

type UploadState = 'idle' | 'dragging' | 'uploading' | 'success' | 'error';

export function ImageUploadZone({ postId, onUploadComplete }: ImageUploadZoneProps) {
  const [state, setState] = useState<UploadState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    setState('uploading');
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`/api/content-pipeline/${postId}/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as Record<string, string>).error ?? 'Upload failed');
      }
      setState('success');
      setTimeout(() => {
        onUploadComplete();
      }, 600);
    } catch (err) {
      setState('error');
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed');
    }
  }, [postId, onUploadComplete]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState('dragging');
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState('idle');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      uploadFile(file);
    } else {
      setState('error');
      setErrorMsg('Please drop an image file.');
    }
  }, [uploadFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  }, [uploadFile]);

  const handleClick = useCallback(() => {
    if (state === 'uploading') return;
    inputRef.current?.click();
  }, [state]);

  return (
    <div
      className={cn(
        'rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors',
        state === 'idle' && 'border-border hover:border-text-muted',
        state === 'dragging' && 'border-accent-primary bg-accent-primary/5',
        state === 'uploading' && 'border-accent-primary/50 cursor-wait',
        state === 'success' && 'border-accent-teal bg-accent-teal/5',
        state === 'error' && 'border-accent-red/50',
      )}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label="Upload image"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {state === 'uploading' && (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 text-accent-primary animate-spin" />
          <p className="text-xs text-text-secondary">Uploading...</p>
        </div>
      )}

      {state === 'success' && (
        <div className="flex flex-col items-center gap-2">
          <CheckCircle className="h-6 w-6 text-accent-teal" />
          <p className="text-xs text-accent-teal">Upload complete</p>
        </div>
      )}

      {(state === 'idle' || state === 'dragging') && (
        <div className="flex flex-col items-center gap-2">
          <Upload className={cn(
            'h-6 w-6',
            state === 'dragging' ? 'text-accent-primary' : 'text-text-muted',
          )} />
          <p className="text-xs text-text-secondary">
            Drop image here or click to browse
          </p>
          <p className="text-[10px] text-text-muted">
            PNG, JPG, WebP
          </p>
        </div>
      )}

      {state === 'error' && (
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-6 w-6 text-accent-red" />
          <p className="text-xs text-accent-red">{errorMsg ?? 'Upload failed'}</p>
          <p className="text-[10px] text-text-muted">Click to try again</p>
        </div>
      )}
    </div>
  );
}
