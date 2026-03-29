'use client';

import { useState, useRef, useCallback } from 'react';
import type { ContentPost } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Upload, Loader2, CheckCircle } from 'lucide-react';

interface ImageUploadZoneProps {
  postId: string;
  post: ContentPost;
  onUploadComplete: () => void;
}

type UploadState = 'idle' | 'dragging' | 'uploading' | 'success' | 'error';
type UploadMode = 'single' | 'carousel' | 'animation';

/** Derive upload mode from art_prompt.media_type without any UI selector. */
function getUploadMode(post: ContentPost): UploadMode {
  const mediaType = post.art_prompt?.media_type as string | undefined;
  if (mediaType === 'carousel') return 'carousel';
  if (mediaType === 'animation') return 'animation';
  return 'single';
}

/** Build FormData for single or multi-file upload. */
function buildFormData(files: FileList | File[], mode: UploadMode): FormData {
  const formData = new FormData();
  const fileArray = Array.from(files);
  if (mode === 'single') {
    const first = fileArray[0];
    if (first) formData.append('file', first);
  } else {
    fileArray.forEach((file, i) => {
      formData.append(`file_${i}`, file);
      formData.append(`filename_${i}`, file.name);
    });
  }
  return formData;
}

export function ImageUploadZone({ postId, post, onUploadComplete }: ImageUploadZoneProps) {
  const mode = getUploadMode(post);
  const isMulti = mode !== 'single';

  const [state, setState] = useState<UploadState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      setState('uploading');
      setErrorMsg(null);

      const formData = buildFormData(fileArray, mode);

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
    },
    [postId, mode, onUploadComplete],
  );

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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const files = e.dataTransfer.files;
      if (!files || files.length === 0) return;

      const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
      if (imageFiles.length === 0) {
        setState('error');
        setErrorMsg('Please drop image files.');
        return;
      }

      if (isMulti) {
        const urls = imageFiles.map((f) => URL.createObjectURL(f));
        setPreviews(urls);
        setPendingFiles(imageFiles);
        setState('idle');
      } else {
        void uploadFiles(imageFiles);
      }
    },
    [isMulti, uploadFiles],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      if (isMulti) {
        const fileArray = Array.from(files);
        const urls = fileArray.map((f) => URL.createObjectURL(f));
        setPreviews(urls);
        setPendingFiles(fileArray);
        setState('idle');
      } else {
        void uploadFiles(files);
      }
    },
    [isMulti, uploadFiles],
  );

  const handleClick = useCallback(() => {
    if (state === 'uploading') return;
    inputRef.current?.click();
  }, [state]);

  const handleConfirmUpload = useCallback(() => {
    if (pendingFiles.length > 0) {
      void uploadFiles(pendingFiles);
      setPreviews([]);
      setPendingFiles([]);
    }
  }, [pendingFiles, uploadFiles]);

  /** Instruction text per mode */
  const renderInstruction = () => {
    if (mode === 'carousel') {
      return (
        <div className="mt-2 space-y-0.5">
          <p className="text-[10px] text-text-muted text-center">
            Upload slides in order. Name them:
          </p>
          <p className="text-[10px] font-mono text-text-muted text-center">
            slide_01.jpg, slide_02.jpg, slide_03.jpg ...
          </p>
          <p className="text-[10px] text-text-muted text-center">
            Upload all at once (select multiple files)
          </p>
        </div>
      );
    }
    if (mode === 'animation') {
      return (
        <div className="mt-2 space-y-0.5">
          <p className="text-[10px] text-text-muted text-center">
            Upload frames in sequence. Name them:
          </p>
          <p className="text-[10px] font-mono text-text-muted text-center">
            frame_01.jpg, frame_02.jpg, frame_03.jpg ...
          </p>
          <p className="text-[10px] text-text-muted text-center">
            Each frame becomes a rendered output
          </p>
        </div>
      );
    }
    // single
    return (
      <div className="mt-2 space-y-0.5">
        <p className="text-[10px] text-text-muted text-center">
          Name it anything — saved as final.png
        </p>
        <p className="text-[10px] text-text-muted text-center">
          Generate using the Image Prompt above, then upload the result
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
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
        aria-label={isMulti ? 'Upload images' : 'Upload image'}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={isMulti}
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
            <Upload
              className={cn(
                'h-6 w-6',
                state === 'dragging' ? 'text-accent-primary' : 'text-text-muted',
              )}
            />
            <p className="text-xs text-text-secondary">
              {isMulti ? 'Drop images here or click to browse' : 'Drop image here or click to browse'}
            </p>
            <p className="text-[10px] text-text-muted">PNG, JPG, WebP</p>
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

      {/* Per-mode instruction text */}
      {renderInstruction()}

      {/* Thumbnail previews for multi-file modes */}
      {previews.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {previews.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={url}
                alt={`Preview ${i + 1}`}
                className="h-14 w-14 object-cover rounded border border-border"
              />
            ))}
          </div>
          <p className="text-[10px] text-text-muted">
            {pendingFiles.length} file{pendingFiles.length !== 1 ? 's' : ''} selected
          </p>
          <button
            onClick={handleConfirmUpload}
            disabled={state === 'uploading'}
            className="btn-primary w-full text-xs py-2"
          >
            Upload {pendingFiles.length} file{pendingFiles.length !== 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  );
}
