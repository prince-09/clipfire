'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Download, Loader2, Check, Play, Square } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ExportClip {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  transcriptExcerpt: string;
}

interface ExportModalProps {
  projectId: string;
  clips: ExportClip[];
  videoUrl: string | null;
  initialFormat?: string;
  initialCaptionStyle?: string | null;
  initialCaptionPosition?: string;
  onClose: () => void;
  onExported: () => void;
}

const formats = [
  { value: '9:16', label: 'Vertical', desc: 'TikTok, Reels, Shorts', width: 9, height: 16 },
  { value: '1:1', label: 'Square', desc: 'Instagram Feed', width: 1, height: 1 },
  { value: '16:9', label: 'Wide', desc: 'YouTube, Twitter', width: 16, height: 9 },
] as const;

const captionStyles = [
  { value: null, label: 'No Captions' },
  { value: 'classic', label: 'Classic' },
  { value: 'bold-pop', label: 'Bold Pop' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'karaoke', label: 'Karaoke' },
  { value: 'neon-glow', label: 'Neon Glow' },
  { value: 'boxed', label: 'Boxed' },
  { value: 'typewriter', label: 'Typewriter' },
  { value: 'pastel', label: 'Pastel' },
  { value: 'outline-only', label: 'Outline' },
  { value: 'impact', label: 'Impact' },
] as const;

const captionFonts = [
  { value: 'poppins', label: 'Poppins', css: 'font-[family-name:var(--font-poppins)]' },
  { value: 'montserrat', label: 'Montserrat', css: 'font-[family-name:var(--font-inter)]' },
  { value: 'bangers', label: 'Bangers', css: 'font-[family-name:var(--font-bangers)]' },
  { value: 'bebas-neue', label: 'Bebas Neue', css: 'font-[family-name:var(--font-bebas)]' },
  { value: 'oswald', label: 'Oswald', css: 'font-[family-name:var(--font-oswald)]' },
  { value: 'permanent-marker', label: 'Marker', css: 'font-[family-name:var(--font-marker)]' },
  { value: 'space-mono', label: 'Space Mono', css: 'font-[family-name:var(--font-space-mono)]' },
  { value: 'pacifico', label: 'Pacifico', css: 'font-[family-name:var(--font-pacifico)]' },
  { value: 'impact', label: 'Impact', css: 'font-[family-name:Impact,sans-serif]' },
  { value: 'arial', label: 'Arial', css: 'font-[family-name:Arial,sans-serif]' },
  { value: 'courier-new', label: 'Courier', css: 'font-[family-name:Courier_New,monospace]' },
  { value: 'georgia', label: 'Georgia', css: 'font-[family-name:Georgia,serif]' },
] as const;

const captionPositions = [
  { value: 'top', label: 'Top' },
  { value: 'center', label: 'Center' },
  { value: 'bottom', label: 'Bottom' },
] as const;

const musicTracks = [
  { value: null, label: 'No Music', emoji: '🔇' },
  { value: 'chill', label: 'Chill', emoji: '😌' },
  { value: 'upbeat', label: 'Upbeat', emoji: '🎵' },
  { value: 'cinematic', label: 'Cinematic', emoji: '🎬' },
  { value: 'lofi', label: 'Lo-Fi', emoji: '🎧' },
  { value: 'hype', label: 'Hype', emoji: '🔥' },
  { value: 'motivational', label: 'Motivational', emoji: '💪' },
] as const;

const fallbackText = 'This is how your captions will look';

const captionStyleClasses: Record<string, { base: string; highlight: string; container: string }> = {
  'classic': {
    container: 'bg-black/70 px-4 py-2 rounded',
    base: 'text-white text-sm',
    highlight: 'text-yellow-300',
  },
  'bold-pop': {
    container: '',
    base: 'text-white text-lg font-black uppercase tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]',
    highlight: 'text-yellow-400',
  },
  'minimal': {
    container: '',
    base: 'text-white/90 text-sm font-light tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]',
    highlight: 'text-white',
  },
  'karaoke': {
    container: '',
    base: 'text-white text-base font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]',
    highlight: 'text-orange-400',
  },
  'neon-glow': {
    container: '',
    base: 'text-cyan-400 text-base font-bold drop-shadow-[0_0_8px_rgba(0,255,255,0.6)]',
    highlight: 'text-green-400 drop-shadow-[0_0_12px_rgba(0,255,0,0.8)]',
  },
  'boxed': {
    container: 'bg-black/80 px-4 py-2 rounded',
    base: 'text-white text-sm font-bold',
    highlight: 'text-yellow-300',
  },
  'typewriter': {
    container: '',
    base: 'text-gray-300 text-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]',
    highlight: 'text-white',
  },
  'pastel': {
    container: '',
    base: 'text-pink-200 text-sm drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]',
    highlight: 'text-pink-400',
  },
  'outline-only': {
    container: '',
    base: 'text-white text-base font-bold uppercase tracking-wider [-webkit-text-stroke:1px_rgba(0,0,0,0.8)]',
    highlight: 'text-yellow-300',
  },
  'impact': {
    container: '',
    base: 'text-white text-lg font-black uppercase tracking-tight drop-shadow-[0_3px_6px_rgba(0,0,0,0.9)]',
    highlight: 'text-yellow-400',
  },
};

function TypewriterPreview({ text, classes, positionClass, fontClass }: { text: string; classes: typeof captionStyleClasses[string]; positionClass: string; fontClass: string }) {
  const [visibleChars, setVisibleChars] = useState(0);
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += 3) {
    chunks.push(words.slice(i, i + 3).join(' '));
  }
  const [chunkIndex, setChunkIndex] = useState(0);
  const currentText = chunks[chunkIndex % chunks.length] || '';

  useEffect(() => {
    setVisibleChars(0);
    setChunkIndex(0);
  }, [text]);

  useEffect(() => {
    setVisibleChars(0);
  }, [chunkIndex]);

  useEffect(() => {
    if (visibleChars >= currentText.length) {
      const timeout = setTimeout(() => {
        setChunkIndex(ci => (ci + 1) % chunks.length);
      }, 800);
      return () => clearTimeout(timeout);
    }
    const timeout = setTimeout(() => {
      setVisibleChars(v => v + 1);
    }, 60);
    return () => clearTimeout(timeout);
  }, [visibleChars, currentText.length, chunks.length]);

  return (
    <div className={`absolute left-1/2 -translate-x-1/2 ${positionClass} z-10 text-center max-w-[85%] ${fontClass}`}>
      <div className={classes.container}>
        <span className={classes.base}>
          {currentText.slice(0, visibleChars)}
        </span>
        <span className="animate-pulse text-white">|</span>
      </div>
    </div>
  );
}

function CaptionPreview({ style, position, transcript, fontClass }: { style: string; position: string; transcript?: string; fontClass: string }) {
  const text = transcript || fallbackText;
  const words = text.split(/\s+/).filter(Boolean);

  const chunks: string[][] = [];
  for (let i = 0; i < words.length; i += 3) {
    chunks.push(words.slice(i, i + 3));
  }

  const [chunkIndex, setChunkIndex] = useState(0);
  const [activeWordInChunk, setActiveWordInChunk] = useState(0);

  useEffect(() => {
    setChunkIndex(0);
    setActiveWordInChunk(0);
    const interval = setInterval(() => {
      setActiveWordInChunk(prev => {
        const currentChunk = chunks[chunkIndex] || chunks[0];
        if (prev + 1 >= currentChunk.length) {
          setChunkIndex(ci => (ci + 1) % chunks.length);
          return 0;
        }
        return prev + 1;
      });
    }, 400);
    return () => clearInterval(interval);
  }, [style, chunks.length]);

  useEffect(() => {
    setActiveWordInChunk(0);
  }, [chunkIndex]);

  const currentChunk = chunks[chunkIndex % chunks.length] || [];

  const positionClass =
    position === 'top' ? 'top-6' :
    position === 'center' ? 'top-1/2 -translate-y-1/2' :
    'bottom-6';

  const classes = captionStyleClasses[style] || captionStyleClasses['classic'];

  if (style === 'typewriter') {
    return <TypewriterPreview text={text} classes={classes} positionClass={positionClass} fontClass={fontClass} />;
  }

  return (
    <div className={`absolute left-1/2 -translate-x-1/2 ${positionClass} z-10 text-center max-w-[85%] ${fontClass}`}>
      <div className={classes.container}>
        {currentChunk.map((word, i) => (
          <span
            key={`${chunkIndex}-${i}`}
            className={`inline-block mx-0.5 transition-colors duration-150 ${classes.base} ${i === activeWordInChunk ? classes.highlight : ''}`}
          >
            {word}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ExportModal({ projectId, clips, videoUrl, initialFormat, initialCaptionStyle, initialCaptionPosition, onClose, onExported }: ExportModalProps) {
  const [format, setFormat] = useState<string>(initialFormat || '9:16');
  const [captionStyle, setCaptionStyle] = useState<string | null>(initialCaptionStyle ?? 'classic');
  const [captionPosition, setCaptionPosition] = useState<string>(initialCaptionPosition || 'bottom');
  const [captionFont, setCaptionFont] = useState<string>('poppins');
  const [backgroundMusic, setBackgroundMusic] = useState<string | null>(null);
  const [musicVolume, setMusicVolume] = useState(0.12);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [lastExportId, setLastExportId] = useState<string | null>(null);
  const [previewClipIndex, setPreviewClipIndex] = useState(0);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentClip = clips[previewClipIndex];

  useEffect(() => {
    if (videoRef.current && currentClip) {
      videoRef.current.currentTime = currentClip.startTime;
    }
  }, [currentClip]);

  useEffect(() => {
    return () => {
      if (audioRef.current) { audioRef.current.pause(); }
    };
  }, []);

  const toggleMusicPreview = (track: string) => {
    if (playingTrack === track) {
      audioRef.current?.pause();
      setPlayingTrack(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = `${API_URL}/music/${track}.mp3`;
        audioRef.current.volume = musicVolume;
        audioRef.current.play();
      }
      setPlayingTrack(track);
    }
  };

  useEffect(() => {
    if (audioRef.current && playingTrack) {
      audioRef.current.volume = Math.min(musicVolume * 3, 1);
    }
  }, [musicVolume, playingTrack]);

  const videoSrc = videoUrl || null;

  const previewDimensions: Record<string, { width: number; height: number }> = {
    '9:16': { width: 200, height: 356 },
    '1:1': { width: 280, height: 280 },
    '16:9': { width: 320, height: 180 },
  };

  const { width: previewW, height: previewH } = previewDimensions[format];

  const pollExportStatus = async (clipId: string): Promise<void> => {
    const maxAttempts = 120; // 10 minutes max (5s intervals)
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, 5000));
      try {
        const { data } = await api.get(`/exports/${clipId}/status`);
        const pct = Math.min(10 + Math.round((i / 40) * 90), 95);
        setProgress(pct);
        if (data.exportStatus === 'exported') {
          setLastExportId(data.export?.id || null);
          setProgress(100);
          return;
        }
        if (data.exportStatus === 'failed') {
          throw new Error('Export failed');
        }
      } catch {
        throw new Error('Export failed');
      }
    }
    throw new Error('Export timed out');
  };

  const handleExport = async () => {
    setExporting(true);
    setProgress(5);

    try {
      if (clips.length === 1) {
        await api.post(`/exports/${clips[0].id}/export`, {
          format,
          captionStyle,
          captionPosition,
          captionFont: captionStyle ? captionFont : null,
          backgroundMusic,
          musicVolume: backgroundMusic ? musicVolume : 0.12,
        });
        await pollExportStatus(clips[0].id);
      } else {
        await api.post('/exports/batch-export', {
          clipIds: clips.map(c => c.id),
          format,
          captionStyle,
          captionPosition,
          captionFont: captionStyle ? captionFont : null,
          backgroundMusic,
          musicVolume: backgroundMusic ? musicVolume : 0.12,
        });
        // Poll the last clip for batch completion
        await pollExportStatus(clips[clips.length - 1].id);
        setLastExportId(null);
      }

      setDone(true);
      toast.success(`${clips.length} clip${clips.length > 1 ? 's' : ''} exported!`);
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleDownload = async () => {
    if (clips.length === 1 && lastExportId) {
      // Fetch signed URL, then open it
      try {
        const { data } = await api.get(`/exports/download/${lastExportId}`);
        window.open(data.url, '_blank');
      } catch {
        toast.error('Failed to get download link');
      }
    } else {
      window.open(`${API_URL}/api/exports/download-zip/${projectId}`, '_blank');
    }
    onExported();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-2xl bg-surface border border-border shadow-2xl shadow-black/40 overflow-hidden animate-fade-in-scale">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Export Clips</h2>
            <p className="text-sm text-muted">
              {clips.length} clip{clips.length > 1 ? 's' : ''} selected
            </p>
          </div>
          <button onClick={onClose} disabled={exporting} className="rounded-lg p-1.5 text-muted hover:bg-surface-hover hover:text-foreground transition-colors disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-6 px-6 pb-6">
          {/* Left: Live Preview */}
          <div className="flex flex-col items-center flex-shrink-0">
            <div
              className="relative overflow-hidden rounded-xl bg-black flex items-center justify-center border border-border"
              style={{ width: previewW, height: previewH }}
            >
              {videoSrc ? (
                <video
                  ref={videoRef}
                  src={videoSrc}
                  loop
                  autoPlay
                  playsInline
                  controls
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="text-muted text-xs">No preview</div>
              )}

              {captionStyle && (
                <CaptionPreview
                  style={captionStyle}
                  position={captionPosition}
                  transcript={currentClip?.transcriptExcerpt}
                  fontClass={captionFonts.find(f => f.value === captionFont)?.css || ''}
                />
              )}

              <div className="absolute top-2 right-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] text-white font-medium backdrop-blur-sm">
                {format}
              </div>
            </div>

            {clips.length > 1 && (
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => setPreviewClipIndex(Math.max(0, previewClipIndex - 1))}
                  disabled={previewClipIndex === 0}
                  className="rounded-lg px-2.5 py-1 text-xs text-muted hover:bg-surface-hover hover:text-foreground transition-colors disabled:opacity-30"
                >
                  Prev
                </button>
                <span className="text-xs text-muted font-medium">
                  {previewClipIndex + 1} / {clips.length}
                </span>
                <button
                  onClick={() => setPreviewClipIndex(Math.min(clips.length - 1, previewClipIndex + 1))}
                  disabled={previewClipIndex === clips.length - 1}
                  className="rounded-lg px-2.5 py-1 text-xs text-muted hover:bg-surface-hover hover:text-foreground transition-colors disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            )}

            <p className="mt-1 text-[11px] text-muted/60 text-center max-w-[200px] truncate">
              {currentClip?.title}
            </p>
          </div>

          {/* Right: Settings (scrollable) */}
          <div className="flex-1 min-w-0 space-y-5 max-h-[70vh] overflow-y-auto pr-2">
            {/* Format */}
            <div>
              <label className="block text-sm font-medium text-muted mb-2">Format</label>
              <div className="flex gap-2">
                {formats.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setFormat(f.value)}
                    className={`flex-1 rounded-xl border px-3 py-3 text-center transition-all ${
                      format === f.value
                        ? 'border-accent bg-accent/10 ring-1 ring-accent/30'
                        : 'border-border hover:border-border-bright hover:bg-surface-hover'
                    }`}
                  >
                    <div className={`text-sm font-medium ${format === f.value ? 'text-accent-hover' : 'text-foreground'}`}>{f.label}</div>
                    <div className="text-[11px] text-muted mt-0.5">{f.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Caption Style */}
            <div>
              <label className="block text-sm font-medium text-muted mb-2">Captions</label>
              <div className="grid grid-cols-3 gap-2">
                {captionStyles.map(s => (
                  <button
                    key={String(s.value)}
                    onClick={() => setCaptionStyle(s.value)}
                    className={`rounded-lg border px-3 py-2 text-sm transition-all ${
                      captionStyle === s.value
                        ? 'border-accent bg-accent/10 text-accent-hover font-medium'
                        : 'border-border text-muted hover:border-border-bright hover:text-foreground'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Caption Position */}
            {captionStyle && (
              <div>
                <label className="block text-sm font-medium text-muted mb-2">Caption Position</label>
                <div className="flex gap-2">
                  {captionPositions.map(p => (
                    <button
                      key={p.value}
                      onClick={() => setCaptionPosition(p.value)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-all ${
                        captionPosition === p.value
                          ? 'border-accent bg-accent/10 text-accent-hover font-medium'
                          : 'border-border text-muted hover:border-border-bright hover:text-foreground'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Caption Font */}
            {captionStyle && (
              <div>
                <label className="block text-sm font-medium text-muted mb-2">Font</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {captionFonts.map(f => (
                    <button
                      key={f.value}
                      onClick={() => setCaptionFont(f.value)}
                      className={`rounded-lg border px-2 py-1.5 text-xs transition-all ${f.css} ${
                        captionFont === f.value
                          ? 'border-accent bg-accent/10 text-accent-hover font-medium'
                          : 'border-border text-muted hover:border-border-bright hover:text-foreground'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Background Music */}
            <div>
              <label className="block text-sm font-medium text-muted mb-2">Background Music</label>
              <audio ref={audioRef} loop onEnded={() => setPlayingTrack(null)} />
              <div className="grid grid-cols-4 gap-1.5">
                {musicTracks.map(t => (
                  <div key={String(t.value)} className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => {
                        setBackgroundMusic(t.value);
                        if (!t.value) {
                          audioRef.current?.pause();
                          setPlayingTrack(null);
                        }
                      }}
                      className={`w-full rounded-lg border px-2 py-2 text-xs transition-all ${
                        backgroundMusic === t.value
                          ? 'border-accent bg-accent/10 text-accent-hover font-medium'
                          : 'border-border text-muted hover:border-border-bright hover:text-foreground'
                      }`}
                    >
                      <span className="block text-base leading-none mb-1">{t.emoji}</span>
                      {t.label}
                    </button>
                    {t.value && (
                      <button
                        onClick={() => toggleMusicPreview(t.value!)}
                        className={`flex items-center justify-center gap-1 rounded-full px-2 py-0.5 text-[10px] transition-all ${
                          playingTrack === t.value
                            ? 'bg-accent text-white'
                            : 'bg-background text-muted hover:bg-surface-hover hover:text-foreground'
                        }`}
                      >
                        {playingTrack === t.value
                          ? <><Square className="h-2.5 w-2.5 fill-current" /> Stop</>
                          : <><Play className="h-2.5 w-2.5 fill-current" /> Play</>
                        }
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {backgroundMusic && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-muted w-10">Vol</span>
                  <input
                    type="range"
                    min={0.03}
                    max={0.35}
                    step={0.01}
                    value={musicVolume}
                    onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                    className="flex-1 h-1.5 accent-accent"
                  />
                  <span className="text-xs text-muted w-8 text-right">{Math.round(musicVolume * 100)}%</span>
                </div>
              )}
            </div>

            {/* Progress */}
            {exporting && (
              <div>
                <div className="h-2 rounded-full bg-border overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-accent to-accent-hover transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-1.5 text-center text-xs text-muted">Rendering clips...</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={onClose} disabled={exporting} className="rounded-lg border border-border px-4 py-2.5 text-sm text-muted hover:text-foreground hover:bg-surface-hover transition-colors disabled:opacity-50">
                Cancel
              </button>

              {done ? (
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-600/20 active:scale-[0.97]"
                >
                  <Download className="h-4 w-4" /> Download ZIP
                </button>
              ) : (
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/20 disabled:opacity-50 active:scale-[0.97]"
                >
                  {exporting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Rendering...</>
                  ) : (
                    <><Check className="h-4 w-4" /> Export</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
