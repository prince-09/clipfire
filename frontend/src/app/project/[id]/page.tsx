'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';
import {
  ArrowLeft, Loader2, Play, Pause, CheckCircle2, Circle,
  Download, Zap, Copy, Hash, ChevronDown, ChevronUp,
  AlertCircle, RefreshCw, Sparkles, Clock,
  Eye, Flame, MessageSquare, Lightbulb, Timer,
} from 'lucide-react';
import ExportModal from '@/components/ui/export-modal';
import { AuthGuard } from '@/components/ui/auth-guard';
import { useAuth } from '@/hooks/use-auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ScoreBreakdown {
  hookStrength: number;
  emotionalIntensity: number;
  clarity: number;
  curiosityGap: number;
  durationFit: number;
  speechEnergy: number;
}

interface Clip {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  segmentType: string;
  transcriptExcerpt: string;
  confidenceScore: number;
  viralScore: number | null;
  scoreBreakdown: ScoreBreakdown | null;
  hooks: string[] | null;
  caption: string | null;
  hashtags: string[] | null;
  isSelected: boolean;
  exportStatus: string;
}

interface Project {
  id: string;
  title: string;
  status: string;
  videoPath: string | null;
  videoUrl: string | null;
  durationSeconds: number | null;
  errorMessage: string | null;
  clips: Clip[];
}

const segmentConfig: Record<string, { bg: string; text: string; icon: string }> = {
  strong_hook: { bg: 'bg-red-500/15', text: 'text-red-400', icon: '🎣' },
  educational_insight: { bg: 'bg-blue-500/15', text: 'text-blue-400', icon: '💡' },
  debate_opinion: { bg: 'bg-orange-500/15', text: 'text-orange-400', icon: '🗣' },
  funny_moment: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', icon: '😂' },
  storytelling: { bg: 'bg-purple-500/15', text: 'text-purple-400', icon: '📖' },
  emotional_peak: { bg: 'bg-pink-500/15', text: 'text-pink-400', icon: '💫' },
  quotable_moment: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', icon: '💬' },
};

const segmentLabels: Record<string, string> = {
  strong_hook: 'Hook',
  educational_insight: 'Insight',
  debate_opinion: 'Opinion',
  funny_moment: 'Funny',
  storytelling: 'Story',
  emotional_peak: 'Emotion',
  quotable_moment: 'Quote',
};

const scoreIcons: Record<string, typeof Flame> = {
  hookStrength: Flame,
  emotionalIntensity: Sparkles,
  clarity: Eye,
  curiosityGap: Lightbulb,
  durationFit: Timer,
  speechEnergy: MessageSquare,
};

const scoreLabels: Record<string, string> = {
  hookStrength: 'Hook',
  emotionalIntensity: 'Emotion',
  clarity: 'Clarity',
  curiosityGap: 'Curiosity',
  durationFit: 'Duration',
  speechEnergy: 'Energy',
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/* ── Circular Score Ring ── */
function ScoreRing({ score, size = 64 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = score / 10;
  const offset = circumference * (1 - pct);
  const color = score >= 7 ? '#10b981' : score >= 4 ? '#f59e0b' : '#ef4444';
  const bgColor = score >= 7 ? 'rgba(16,185,129,0.1)' : score >= 4 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)';

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill={bgColor} stroke="var(--border)" strokeWidth="3" />
        <circle
          cx={size/2} cy={size/2} r={radius}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-black text-foreground leading-none">{score.toFixed(1)}</span>
      </div>
    </div>
  );
}

/* ── Mini Score Metric ── */
function ScoreMetric({ label, value, iconKey }: { label: string; value: number; iconKey: string }) {
  const Icon = scoreIcons[iconKey] || Flame;
  const pct = (value / 10) * 100;
  const color = pct >= 70 ? 'text-emerald-400' : pct >= 40 ? 'text-yellow-400' : 'text-red-400';
  const barColor = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Icon className={`h-3 w-3 ${color}`} />
          <span className="text-[11px] text-muted font-medium">{label}</span>
        </div>
        <span className={`text-[11px] font-bold ${color}`}>{value}/10</span>
      </div>
      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <div className={`h-full rounded-full ${barColor} animate-score-fill`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function ProjectPage() {
  const { isSignedIn } = useAuth(); // wire up Clerk token for API calls
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [expandedClip, setExpandedClip] = useState<string | null>(null);
  const [playingClip, setPlayingClip] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [previewFormat, setPreviewFormat] = useState<string>('original');
  const [previewCaptionStyle, setPreviewCaptionStyle] = useState<string | null>(null);
  const [previewCaptionPos, setPreviewCaptionPos] = useState<string>('bottom');
  const videoRef = useRef<HTMLVideoElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchProject = useCallback(async () => {
    try {
      const { data } = await api.get(`/projects/${projectId}`);
      setProject(data.project);
      return data.project;
    } catch {
      toast.error('Failed to load project');
      return null;
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!isSignedIn) return;
    fetchProject();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [isSignedIn, fetchProject]);

  useEffect(() => {
    if (project?.status === 'processing' || project?.status === 'downloading') {
      pollRef.current = setInterval(async () => {
        const p = await fetchProject();
        if (p && p.status !== 'processing' && p.status !== 'downloading') {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          setProcessing(false);
        }
      }, 3000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [project?.status, fetchProject]);

  const startProcessing = async () => {
    setProcessing(true);
    try {
      await api.post(`/projects/${projectId}/process`);
      toast.success('Processing started!');
      fetchProject();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to start processing';
      toast.error(msg);
      setProcessing(false);
    }
  };

  const toggleClipSelection = async (clip: Clip) => {
    try {
      await api.patch(`/clips/${clip.id}`, { isSelected: !clip.isSelected });
      setProject(prev => prev ? {
        ...prev,
        clips: prev.clips.map(c => c.id === clip.id ? { ...c, isSelected: !c.isSelected } : c),
      } : null);
    } catch {
      toast.error('Failed to update clip');
    }
  };

  const toggleAllClips = async (select: boolean) => {
    if (!project) return;
    const clipsToToggle = project.clips.filter(c => c.isSelected !== select);
    if (clipsToToggle.length === 0) return;
    try {
      await Promise.all(clipsToToggle.map(c => api.patch(`/clips/${c.id}`, { isSelected: select })));
      setProject(prev => prev ? { ...prev, clips: prev.clips.map(c => ({ ...c, isSelected: select })) } : null);
      toast.success(select ? 'All clips selected' : 'All clips deselected');
    } catch {
      toast.error('Failed to update clips');
    }
  };

  const regenerateClips = async () => {
    setRegenerating(true);
    try {
      await api.post(`/projects/${projectId}/regenerate`);
      toast.success('Regenerating clips...');
      fetchProject();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to regenerate';
      toast.error(msg);
      setRegenerating(false);
    }
  };

  const previewClip = (clip: Clip) => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (playingClip === clip.id) { video.pause(); setPlayingClip(null); return; }
    video.currentTime = clip.startTime;
    video.play();
    setPlayingClip(clip.id);
    const checkEnd = () => {
      if (video.currentTime >= clip.endTime) { video.pause(); setPlayingClip(null); video.removeEventListener('timeupdate', checkEnd); }
    };
    video.addEventListener('timeupdate', checkEnd);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  };

  const selectedClips = project?.clips.filter(c => c.isSelected) || [];

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="relative">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <div className="absolute inset-0 h-8 w-8 animate-ping opacity-20 rounded-full bg-accent" />
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!project) {
    return (
      <AuthGuard>
        <div className="flex min-h-screen items-center justify-center bg-background">
          <p className="text-muted">Project not found</p>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard><>
      <Toaster
        position="top-right"
        toastOptions={{ style: { background: '#1c1917', color: '#f5f0eb', border: '1px solid #44403c' } }}
      />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <nav className="border-b border-border glass sticky top-0 z-30 px-6 py-3">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/dashboard')} className="rounded-lg p-1.5 text-muted transition-colors hover:text-foreground hover:bg-surface">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-base font-bold text-foreground">{project.title}</h1>
                {project.status === 'ready' && project.durationSeconds && (
                  <div className="flex items-center gap-2 text-xs text-muted mt-0.5">
                    <Clock className="h-3 w-3" />
                    <span>{formatTime(project.durationSeconds)}</span>
                    <span className="text-border-bright">|</span>
                    <span>{project.clips.length} clips found</span>
                  </div>
                )}
              </div>
              <StatusBadge status={project.status} />
            </div>
            {project.status === 'ready' && selectedClips.length > 0 && (
              <button
                onClick={() => setShowExport(true)}
                className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/25 active:scale-[0.97]"
              >
                <Download className="h-4 w-4" />
                Export {selectedClips.length} clip{selectedClips.length > 1 ? 's' : ''}
              </button>
            )}
          </div>
        </nav>

        <main className="mx-auto max-w-[1400px] px-6 py-6 animate-fade-in">
          {/* Processing states */}
          {(project.status === 'uploaded' || project.status === 'downloading') && (
            <div className="rounded-2xl border border-border bg-surface p-12 text-center animate-fade-in-scale max-w-xl mx-auto">
              {project.status === 'downloading' ? (
                <>
                  <div className="relative mx-auto w-fit">
                    <Loader2 className="h-12 w-12 animate-spin text-accent" />
                    <div className="absolute inset-0 animate-ping opacity-20 rounded-full bg-accent" />
                  </div>
                  <h3 className="mt-6 text-2xl font-bold text-foreground">Downloading video...</h3>
                  <p className="mt-2 text-sm text-muted">This may take a few minutes depending on video length.</p>
                </>
              ) : (
                <>
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20">
                    <Zap className="h-10 w-10 text-amber-400" />
                  </div>
                  <h3 className="mt-6 text-2xl font-bold text-foreground">Video ready for processing</h3>
                  <p className="mt-2 text-sm text-muted">
                    {project.durationSeconds ? `${formatTime(project.durationSeconds)} duration — ` : ''}
                    Extract audio, transcribe, and detect viral clips.
                  </p>
                  <button
                    onClick={startProcessing}
                    disabled={processing}
                    className="mt-8 inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-3.5 text-sm font-semibold text-white transition-all hover:bg-accent-hover hover:shadow-xl hover:shadow-accent/25 disabled:opacity-50 active:scale-[0.97]"
                  >
                    {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                    Start Processing
                  </button>
                </>
              )}
            </div>
          )}

          {project.status === 'processing' && (
            <div className="rounded-2xl border border-border bg-surface p-12 text-center animate-pulse-glow max-w-xl mx-auto">
              <div className="relative mx-auto w-fit">
                <Loader2 className="h-12 w-12 animate-spin text-accent" />
                <div className="absolute inset-0 animate-ping opacity-20 rounded-full bg-accent" />
              </div>
              <h3 className="mt-6 text-2xl font-bold text-foreground">Processing your video...</h3>
              <p className="mt-2 text-sm text-muted">Extracting audio, transcribing, and detecting viral clips.</p>
            </div>
          )}

          {project.status === 'failed' && (
            <div className="rounded-2xl border border-red-500/20 bg-surface p-12 animate-fade-in-scale max-w-xl mx-auto">
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="h-8 w-8 text-red-400" />
                </div>
                <h3 className="mt-5 text-2xl font-bold text-foreground">Processing failed</h3>
                <p className="mt-2 text-sm text-muted">
                  Something went wrong. Your transcription has been saved — retrying won&apos;t cost extra.
                </p>
                {project.errorMessage && (
                  <div className="mt-4 rounded-lg bg-red-500/5 border border-red-500/10 px-4 py-3 text-left">
                    <p className="text-xs font-medium text-red-400">Error details</p>
                    <p className="mt-1 text-xs text-red-400/70 break-all">{project.errorMessage}</p>
                  </div>
                )}
                <button
                  onClick={startProcessing}
                  disabled={processing}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-accent-hover disabled:opacity-50"
                >
                  {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Retry Processing
                </button>
              </div>
            </div>
          )}

          {/* Ready state */}
          {project.status === 'ready' && (
            <div className="flex gap-6">
              {/* Left sidebar: video + controls */}
              <div className="w-[340px] flex-shrink-0 hidden lg:block">
                <div className="sticky top-20 space-y-4">
                  {/* Video Player */}
                  <div className="rounded-2xl border border-border bg-surface overflow-hidden animate-slide-up">
                    <div className="flex justify-center bg-black/50 p-3">
                      <div
                        className="relative overflow-hidden rounded-xl bg-black"
                        style={{
                          width: previewFormat === '9:16' ? 180 : previewFormat === '1:1' ? 240 : '100%',
                          height: previewFormat === '9:16' ? 320 : previewFormat === '1:1' ? 240 : 'auto',
                          aspectRatio: previewFormat === 'original' ? '16/9' : undefined,
                        }}
                      >
                        {project.videoUrl && (
                          <video
                            ref={videoRef}
                            src={project.videoUrl}
                            controls
                            className={`bg-black ${previewFormat === 'original' ? 'w-full rounded-xl' : 'absolute inset-0 w-full h-full object-cover'}`}
                            onPause={() => setPlayingClip(null)}
                          />
                        )}
                        {previewCaptionStyle && previewFormat !== 'original' && (
                          <PreviewCaption style={previewCaptionStyle} position={previewCaptionPos} />
                        )}
                        {previewFormat !== 'original' && (
                          <div className="absolute top-2 right-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] text-white font-semibold backdrop-blur-sm">
                            {previewFormat}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stats bar */}
                    <div className="flex items-center justify-around py-3 px-4 border-t border-border">
                      <div className="text-center">
                        <div className="text-sm font-bold text-foreground">{project.clips.length}</div>
                        <div className="text-[10px] text-muted uppercase tracking-wider">Clips</div>
                      </div>
                      <div className="h-6 w-px bg-border" />
                      <div className="text-center">
                        <div className="text-sm font-bold text-accent">{selectedClips.length}</div>
                        <div className="text-[10px] text-muted uppercase tracking-wider">Selected</div>
                      </div>
                      <div className="h-6 w-px bg-border" />
                      <div className="text-center">
                        <div className="text-sm font-bold text-foreground">
                          {project.clips.length > 0 ? (project.clips.reduce((a, c) => a + (c.viralScore || 0), 0) / project.clips.length).toFixed(1) : '—'}
                        </div>
                        <div className="text-[10px] text-muted uppercase tracking-wider">Avg Score</div>
                      </div>
                    </div>
                  </div>

                  {/* Preview Controls */}
                  <div className="rounded-2xl border border-border bg-surface p-4 space-y-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <h3 className="text-[11px] font-bold text-muted uppercase tracking-widest">Preview Format</h3>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { value: 'original', label: 'Original', sub: '16:9' },
                        { value: '9:16', label: 'Vertical', sub: '9:16' },
                        { value: '1:1', label: 'Square', sub: '1:1' },
                        { value: '16:9', label: 'Wide', sub: '16:9' },
                      ].map(f => (
                        <button
                          key={f.value}
                          onClick={() => setPreviewFormat(f.value)}
                          className={`rounded-lg px-1 py-2 text-center transition-all ${
                            previewFormat === f.value
                              ? 'bg-accent/15 text-accent ring-1 ring-accent/30'
                              : 'bg-background text-muted hover:text-foreground hover:bg-surface-hover'
                          }`}
                        >
                          <div className="text-[11px] font-semibold">{f.sub}</div>
                        </button>
                      ))}
                    </div>

                    {previewFormat !== 'original' && (
                      <>
                        <h3 className="text-[11px] font-bold text-muted uppercase tracking-widest pt-1">Captions</h3>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { value: null, label: 'None' },
                            { value: 'classic', label: 'Classic' },
                            { value: 'bold-pop', label: 'Bold' },
                            { value: 'minimal', label: 'Minimal' },
                          ].map(s => (
                            <button
                              key={String(s.value)}
                              onClick={() => setPreviewCaptionStyle(s.value)}
                              className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                                previewCaptionStyle === s.value
                                  ? 'border-accent bg-accent/10 text-accent'
                                  : 'border-border text-muted hover:border-border-bright hover:text-foreground'
                              }`}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>

                        {previewCaptionStyle && (
                          <div className="flex gap-1.5">
                            {(['top', 'center', 'bottom'] as const).map(p => (
                              <button
                                key={p}
                                onClick={() => setPreviewCaptionPos(p)}
                                className={`flex-1 rounded-lg border px-2 py-1.5 text-xs capitalize transition-all ${
                                  previewCaptionPos === p
                                    ? 'border-accent bg-accent/10 text-accent'
                                    : 'border-border text-muted hover:border-border-bright hover:text-foreground'
                                }`}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Main content: clips */}
              <div className="flex-1 min-w-0">
                {/* Clips header */}
                <div className="flex items-center justify-between mb-5 animate-slide-up">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-foreground">Clips</h2>
                    <div className="flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1">
                      <Sparkles className="h-3.5 w-3.5 text-accent" />
                      <span className="text-xs font-bold text-accent">{selectedClips.length}/{project.clips.length}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={regenerateClips}
                      disabled={regenerating}
                      className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground hover:border-border-bright transition-all disabled:opacity-50"
                    >
                      {regenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                      Regenerate
                    </button>
                    <div className="flex items-center gap-1 bg-surface rounded-lg border border-border p-1">
                      <button
                        onClick={() => toggleAllClips(true)}
                        className="rounded-md px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-all"
                      >
                        Select all
                      </button>
                      <button
                        onClick={() => toggleAllClips(false)}
                        className="rounded-md px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-all"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>

                {/* Clip cards */}
                <div className="space-y-3 stagger-children">
                  {project.clips
                    .sort((a, b) => (b.viralScore ?? 0) - (a.viralScore ?? 0))
                    .map((clip, index) => (
                      <ClipCard
                        key={clip.id}
                        clip={clip}
                        rank={index + 1}
                        isExpanded={expandedClip === clip.id}
                        isPlaying={playingClip === clip.id}
                        onToggleExpand={() => setExpandedClip(expandedClip === clip.id ? null : clip.id)}
                        onToggleSelect={() => toggleClipSelection(clip)}
                        onPreview={() => previewClip(clip)}
                        onCopy={copyToClipboard}
                      />
                    ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {showExport && project && (
        <ExportModal
          projectId={project.id}
          clips={selectedClips}
          videoPath={project.videoPath}
          initialFormat={previewFormat !== 'original' ? previewFormat : '9:16'}
          initialCaptionStyle={previewCaptionStyle}
          initialCaptionPosition={previewCaptionPos}
          onClose={() => setShowExport(false)}
          onExported={() => { setShowExport(false); fetchProject(); }}
        />
      )}
    </></AuthGuard>
  );
}

function PreviewCaption({ style, position }: { style: string; position: string }) {
  const positionClass =
    position === 'top' ? 'top-4' :
    position === 'center' ? 'top-1/2 -translate-y-1/2' :
    'bottom-8';
  const text = 'This is how your captions will look';

  if (style === 'classic') {
    return (
      <div className={`absolute left-1/2 -translate-x-1/2 ${positionClass} z-10 max-w-[85%]`}>
        <div className="bg-black/70 text-white text-[11px] px-3 py-1.5 rounded text-center">{text}</div>
      </div>
    );
  }
  if (style === 'bold-pop') {
    return (
      <div className={`absolute left-1/2 -translate-x-1/2 ${positionClass} z-10 max-w-[85%] text-center`}>
        {text.split(' ').map((word, i) => (
          <span key={i} className={`inline-block mx-0.5 text-sm font-black uppercase drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)] ${i === 4 ? 'text-yellow-400' : 'text-white'}`}>
            {word}
          </span>
        ))}
      </div>
    );
  }
  return (
    <div className={`absolute left-1/2 -translate-x-1/2 ${positionClass} z-10 max-w-[85%]`}>
      <div className="text-white/90 text-[11px] font-light tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] text-center">{text}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; dot: string }> = {
    uploading: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-400' },
    uploaded: { bg: 'bg-slate-500/10', text: 'text-slate-400', dot: 'bg-slate-400' },
    downloading: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400 animate-pulse' },
    processing: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400 animate-pulse' },
    ready: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    failed: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
  };
  const c = config[status] || config.ready;
  return (
    <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
}

function ClipCard({
  clip, rank, isExpanded, isPlaying, onToggleExpand, onToggleSelect, onPreview, onCopy,
}: {
  clip: Clip;
  rank: number;
  isExpanded: boolean;
  isPlaying: boolean;
  onToggleExpand: () => void;
  onToggleSelect: () => void;
  onPreview: () => void;
  onCopy: (text: string) => void;
}) {
  const segment = segmentConfig[clip.segmentType] || { bg: 'bg-slate-500/15', text: 'text-slate-400', icon: '🎬' };

  return (
    <div className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
      clip.isSelected
        ? 'bg-surface border-border-bright shadow-lg shadow-black/20'
        : 'bg-surface/40 border-border opacity-45 hover:opacity-65'
    }`}>
      {/* Main content row */}
      <div className="flex items-stretch">
        {/* Left: rank + select */}
        <div className="flex flex-col items-center justify-center w-14 flex-shrink-0 border-r border-border bg-background/30 py-4 gap-2">
          <span className="text-[10px] font-bold text-muted/50 uppercase tracking-widest">#{rank}</span>
          <button onClick={onToggleSelect} className="transition-transform active:scale-90">
            {clip.isSelected
              ? <CheckCircle2 className="h-5 w-5 text-accent" />
              : <Circle className="h-5 w-5 text-muted/30 hover:text-muted" />
            }
          </button>
        </div>

        {/* Center: clip details */}
        <div className="flex-1 min-w-0 p-4">
          <div className="flex items-start gap-3">
            {/* Segment icon */}
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-base ${segment.bg} flex-shrink-0`}>
              {segment.icon}
            </span>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-bold text-foreground text-[15px] leading-snug truncate">{clip.title}</h3>
                  <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                    <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${segment.bg} ${segment.text}`}>
                      {segmentLabels[clip.segmentType] || clip.segmentType}
                    </span>
                    <span className="text-xs text-muted flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(clip.startTime)}–{formatTime(clip.endTime)}
                    </span>
                    <span className="text-[11px] text-muted/60 font-mono bg-background rounded px-1.5 py-0.5">
                      {Math.round(clip.durationSeconds)}s
                    </span>
                  </div>
                </div>
              </div>

              {/* Transcript */}
              <p className="mt-3 text-[13px] text-muted leading-relaxed line-clamp-2">
                &ldquo;{clip.transcriptExcerpt}&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* Right: viral score ring */}
        {clip.viralScore != null && (
          <div className="flex items-center px-5 border-l border-border bg-background/20">
            <ScoreRing score={clip.viralScore} size={68} />
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1.5 border-t border-border px-4 py-2 bg-background/20">
        <button
          onClick={onPreview}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
            isPlaying
              ? 'bg-accent text-white shadow-sm'
              : 'text-muted hover:bg-surface-hover hover:text-foreground'
          }`}
        >
          {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {isPlaying ? 'Stop' : 'Preview'}
        </button>

        <div className="h-4 w-px bg-border" />

        <button
          onClick={onToggleExpand}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
            isExpanded ? 'bg-surface-hover text-foreground' : 'text-muted hover:bg-surface-hover hover:text-foreground'
          }`}
        >
          {isExpanded ? 'Hide' : 'Details'}
          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {/* Quick copy actions */}
        {clip.caption && (
          <>
            <div className="h-4 w-px bg-border" />
            <button
              onClick={() => onCopy(clip.caption!)}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-muted hover:text-accent hover:bg-accent/5 transition-all"
            >
              <Copy className="h-3 w-3" /> Caption
            </button>
          </>
        )}
        {clip.hashtags && clip.hashtags.length > 0 && (
          <button
            onClick={() => onCopy((clip.hashtags as string[]).join(' '))}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-muted hover:text-accent hover:bg-accent/5 transition-all"
          >
            <Hash className="h-3 w-3" /> Tags
          </button>
        )}
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="border-t border-border animate-fade-in">
          {/* Score breakdown grid */}
          {clip.scoreBreakdown && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-0 border-b border-border">
              {Object.entries(clip.scoreBreakdown).map(([key, value], i) => (
                <div key={key} className={`p-4 ${i < Object.keys(clip.scoreBreakdown!).length - 1 ? 'border-r border-b lg:border-b-0' : ''} border-border`}>
                  <ScoreMetric label={scoreLabels[key] || key} value={value as number} iconKey={key} />
                </div>
              ))}
            </div>
          )}

          <div className="p-5 space-y-5">
            {/* Hooks */}
            {clip.hooks && clip.hooks.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold text-muted uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Zap className="h-3 w-3 text-amber-400" />
                  Hook Options
                </h4>
                <div className="space-y-1.5">
                  {(clip.hooks as string[]).map((hook, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl bg-background border border-border px-4 py-3 text-sm text-foreground group hover:border-border-bright transition-all">
                      <span className="leading-snug">{hook}</span>
                      <button onClick={() => onCopy(hook)} className="ml-3 flex-shrink-0 rounded-lg p-1.5 text-muted hover:text-accent hover:bg-accent/10 transition-all opacity-0 group-hover:opacity-100">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Caption */}
            {clip.caption && (
              <div>
                <h4 className="text-[11px] font-bold text-muted uppercase tracking-widest mb-3">Caption</h4>
                <div className="flex items-start justify-between rounded-xl bg-background border border-border px-4 py-3 text-sm text-foreground group hover:border-border-bright transition-all">
                  <span className="leading-relaxed">{clip.caption}</span>
                  <button onClick={() => onCopy(clip.caption!)} className="ml-3 flex-shrink-0 rounded-lg p-1.5 text-muted hover:text-accent hover:bg-accent/10 transition-all opacity-0 group-hover:opacity-100">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Hashtags */}
            {clip.hashtags && clip.hashtags.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[11px] font-bold text-muted uppercase tracking-widest flex items-center gap-1.5">
                    <Hash className="h-3 w-3 text-blue-400" />
                    Hashtags
                  </h4>
                  <button
                    onClick={() => onCopy((clip.hashtags as string[]).join(' '))}
                    className="text-[11px] text-accent hover:text-accent-hover font-semibold transition-colors"
                  >
                    Copy all
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(clip.hashtags as string[]).map((tag, i) => (
                    <button
                      key={i}
                      onClick={() => onCopy(tag)}
                      className="inline-flex items-center gap-1 rounded-full bg-accent/8 border border-accent/15 px-3 py-1 text-xs font-medium text-accent-hover hover:bg-accent/15 transition-all"
                    >
                      #{tag.replace('#', '')}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
