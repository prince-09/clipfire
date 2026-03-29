'use client';

import { useState, useRef, useCallback } from 'react';
import { X, Upload, Link as LinkIcon, Loader2, FileVideo } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => reject(new Error('Cannot read video'));
    video.src = URL.createObjectURL(file);
  });
}

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (project: { id: string }) => void;
}

type Tab = 'file' | 'url';

export default function UploadModal({ open, onClose, onCreated }: UploadModalProps) {
  const [tab, setTab] = useState<Tab>('file');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setTitle('');
    setUrl('');
    setFile(null);
    setUploading(false);
    setProgress(0);
    setTab('file');
  }, []);

  const handleClose = () => {
    if (uploading) return;
    reset();
    onClose();
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type.startsWith('video/')) {
      setFile(dropped);
      if (!title) setTitle(dropped.name.replace(/\.[^.]+$/, ''));
    } else {
      toast.error('Please drop a video file (MP4, MOV, MKV, WebM)');
    }
  }, [title]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      if (!title) setTitle(selected.name.replace(/\.[^.]+$/, ''));
    }
  };

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error('Enter a project title');
      return;
    }

    if (tab === 'file' && !file) {
      toast.error('Select a video file');
      return;
    }

    if (tab === 'url' && !url.trim()) {
      toast.error('Enter a YouTube URL');
      return;
    }

    // Client-side duration check for file uploads
    if (tab === 'file' && file) {
      try {
        const duration = await getVideoDuration(file);
        if (duration > 360) {
          toast.error(`Video is too long (${Math.ceil(duration / 60)} min). Maximum allowed is 6 minutes.`);
          return;
        }
      } catch {
        // If we can't check duration client-side, let the server handle it
      }
    }

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('title', trimmedTitle);

      if (tab === 'file' && file) {
        formData.append('video', file);
      } else if (tab === 'url') {
        formData.append('sourceUrl', url.trim());
      }

      const { data } = await api.post('/projects', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        },
      });

      toast.success(
        tab === 'url' ? 'Project created — downloading video...' : 'Video uploaded!'
      );
      reset();
      onCreated(data.project);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Upload failed';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-surface border border-border p-6 shadow-2xl shadow-black/40 animate-fade-in-scale">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">New Project</h2>
          <button
            onClick={handleClose}
            disabled={uploading}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Beta notice */}
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-500/8 border border-amber-500/15 px-3 py-2">
          <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">Beta</span>
          <p className="text-xs text-muted">Clipfire is in beta. Max video length is 6 minutes. Longer videos coming soon.</p>
        </div>

        {/* Title */}
        <div className="mt-5">
          <label className="block text-sm font-medium text-muted mb-1.5">Project Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="My Podcast Episode 12"
            disabled={uploading}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 disabled:opacity-50 transition-colors"
          />
        </div>

        {/* Tabs */}
        <div className="mt-5 flex gap-1 rounded-lg bg-background p-1">
          <button
            onClick={() => setTab('file')}
            disabled={uploading}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-all ${
              tab === 'file'
                ? 'bg-surface text-foreground shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Upload className="h-4 w-4" /> Upload File
          </button>
          <button
            onClick={() => setTab('url')}
            disabled={uploading}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-all ${
              tab === 'url'
                ? 'bg-surface text-foreground shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <LinkIcon className="h-4 w-4" /> YouTube URL
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-5">
          {tab === 'file' ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => !uploading && inputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed p-8 transition-all ${
                dragActive
                  ? 'border-accent bg-accent/5'
                  : file
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-border hover:border-border-bright hover:bg-surface-hover'
              } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
            >
              <input
                ref={inputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              {file ? (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <FileVideo className="h-6 w-6 text-emerald-400" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-emerald-400">{file.name}</p>
                  <p className="mt-0.5 text-xs text-emerald-400/60">
                    {(file.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </>
              ) : (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface border border-border">
                    <Upload className="h-6 w-6 text-muted" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-foreground">
                    Drop a video file here or click to browse
                  </p>
                  <p className="mt-1 text-xs text-muted">MP4, MOV, MKV, WebM — up to 2GB</p>
                </>
              )}
            </div>
          ) : (
            <div>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                disabled={uploading}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 disabled:opacity-50 transition-colors"
              />
              <p className="mt-2 text-xs text-muted">
                The video will be downloaded on the server using yt-dlp.
              </p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {uploading && tab === 'file' && (
          <div className="mt-5">
            <div className="h-2 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-accent-hover transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1.5 text-center text-xs text-muted">{progress}% uploaded</p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={uploading}
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploading || !title.trim()}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/20 disabled:opacity-50 active:scale-[0.97]"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {tab === 'url' ? 'Creating...' : 'Uploading...'}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                {tab === 'url' ? 'Create Project' : 'Upload & Create'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
