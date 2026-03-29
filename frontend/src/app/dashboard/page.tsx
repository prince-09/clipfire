'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Video, Clock, Film, Trash2, Plus, Loader2, Sparkles, Zap } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import toast, { Toaster } from 'react-hot-toast';
import UploadModal from '@/components/ui/upload-modal';
import { AuthGuard } from '@/components/ui/auth-guard';
import { useAuth } from '@/hooks/use-auth';

interface Project {
  id: string;
  title: string;
  status: string;
  durationSeconds: number | null;
  clipCount: number;
  createdAt: string;
}

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  uploading: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  processing: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400 animate-pulse' },
  ready: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  failed: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

interface Credits {
  totalMinutes: number;
  usedMinutes: number;
  remainingMinutes: number;
}

export default function DashboardPage() {
  const { isSignedIn } = useAuth(); // wire up Clerk token for API calls
  const [projects, setProjects] = useState<Project[]>([]);
  const [credits, setCredits] = useState<Credits | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data.projects);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCredits = useCallback(async () => {
    try {
      const { data } = await api.get('/user/me');
      setCredits(data.user.credits);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    if (!isSignedIn) return;
    fetchProjects();
    fetchCredits();
  }, [isSignedIn, fetchProjects, fetchCredits]);

  const deleteProject = async (id: string) => {
    try {
      await api.delete(`/projects/${id}`);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast.success('Project deleted');
    } catch {
      toast.error('Failed to delete project');
    }
  };

  return (
    <AuthGuard>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1c1917',
            color: '#f5f0eb',
            border: '1px solid #44403c',
          },
        }}
      />
      <div className="min-h-screen bg-background">
        {/* Nav */}
        <nav className="border-b border-border glass sticky top-0 z-30 px-6 py-4">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              <span className="text-xl font-bold gradient-text">Clipfire</span>
            </div>
            <div className="flex items-center gap-4">
              {credits && (
                <div className="flex items-center gap-1.5 rounded-lg bg-surface border border-border px-3 py-1.5">
                  <Zap className="h-3.5 w-3.5 text-accent" />
                  <span className="text-sm font-medium text-foreground">
                    {credits.remainingMinutes}
                  </span>
                  <span className="text-xs text-muted">min left</span>
                </div>
              )}
              <UserButton />
            </div>
          </div>
        </nav>

        <main className="mx-auto max-w-6xl px-6 py-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Your Projects</h1>
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/20 active:scale-[0.97]"
            >
              <Plus className="h-4 w-4" /> New Project
            </button>
          </div>

          {loading ? (
            <div className="mt-16 flex flex-col items-center justify-center gap-3 text-muted">
              <div className="relative">
                <Loader2 className="h-8 w-8 animate-spin" />
                <div className="absolute inset-0 h-8 w-8 animate-ping opacity-20 rounded-full bg-accent" />
              </div>
              <span className="text-sm">Loading projects...</span>
            </div>
          ) : projects.length === 0 ? (
            <div className="mt-16 text-center animate-fade-in">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-surface border border-border">
                <Video className="h-10 w-10 text-muted" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">No projects yet</h3>
              <p className="mt-1.5 text-sm text-muted">Upload a video to get started.</p>
              <button
                onClick={() => setShowUpload(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/20"
              >
                <Plus className="h-4 w-4" /> Create your first project
              </button>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
              {projects.map((project) => {
                const status = statusConfig[project.status] || statusConfig.ready;
                return (
                  <Link
                    key={project.id}
                    href={`/project/${project.id}`}
                    className="group relative rounded-xl border border-border bg-surface p-5 transition-all duration-300 hover:border-border-bright hover:bg-surface-hover hover:shadow-xl hover:shadow-black/20 hover:-translate-y-0.5"
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-foreground group-hover:text-accent-hover transition-colors">
                        {project.title}
                      </h3>
                      <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status.bg} ${status.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                        {project.status}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-sm text-muted">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDuration(project.durationSeconds)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Film className="h-3.5 w-3.5" />
                        {project.clipCount} clips
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-muted/60">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={(e) => { e.preventDefault(); deleteProject(project.id); }}
                        className="rounded-lg p-1.5 text-muted opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </main>
      </div>

      <UploadModal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onCreated={() => {
          setShowUpload(false);
          fetchProjects();
        }}
      />
    </AuthGuard>
  );
}
