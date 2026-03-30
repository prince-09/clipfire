'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Zap, Upload, Scissors, Download, Play, ArrowRight,
  Clock, Sparkles, Film, CheckCircle2, ChevronRight,
  MousePointer2,
} from 'lucide-react';

/* ── Animated counter ── */
function Counter({ end, suffix = '', duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * end));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

/* ── Pipeline step card ── */
function PipelineStep({ step, icon: Icon, title, desc, delay }: {
  step: number;
  icon: typeof Upload;
  title: string;
  desc: string;
  delay: string;
}) {
  return (
    <div className="group relative animate-fade-in" style={{ animationDelay: delay }}>
      {/* Connector line */}
      {step < 4 && (
        <div className="hidden lg:block absolute top-10 left-full w-full h-px bg-gradient-to-r from-border-bright to-transparent z-0" />
      )}
      <div className="relative rounded-2xl border border-border bg-surface p-6 transition-all duration-300 hover:border-accent/30 hover:shadow-xl hover:shadow-accent/5 hover:-translate-y-1">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-all duration-300">
            <Icon className="h-5 w-5" />
          </div>
          <span className="text-xs font-bold text-muted/40 uppercase tracking-widest">Step {step}</span>
        </div>
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        <p className="mt-2 text-sm text-muted leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

/* ── Feature card ── */
function FeatureCard({ icon: Icon, title, desc, accent }: {
  icon: typeof Zap;
  title: string;
  desc: string;
  accent: string;
}) {
  return (
    <div className="group rounded-2xl border border-border bg-surface p-6 transition-all duration-300 hover:border-border-bright hover:shadow-lg hover:shadow-black/10 hover:-translate-y-0.5">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent} transition-transform duration-300 group-hover:scale-110`}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-base font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted leading-relaxed">{desc}</p>
    </div>
  );
}

/* ── Clip demo card ── */
function DemoClipCard({ title, type, score, time, color }: {
  title: string;
  type: string;
  score: number;
  time: string;
  color: string;
}) {
  const ring = score / 10;
  const circumference = 2 * Math.PI * 22;
  const offset = circumference * (1 - ring);

  return (
    <div className="rounded-xl border border-border bg-surface p-4 transition-all duration-300 hover:border-border-bright group">
      <div className="flex items-center gap-3">
        <svg width="52" height="52" className="-rotate-90 flex-shrink-0">
          <circle cx="26" cy="26" r="22" fill="rgba(249,115,22,0.06)" stroke="var(--border)" strokeWidth="2.5" />
          <circle cx="26" cy="26" r="22" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            className="transition-all duration-700"
          />
          <text x="26" y="30" textAnchor="middle" fill="var(--foreground)" fontSize="13" fontWeight="800"
            className="rotate-90 origin-center"
          >
            {score.toFixed(1)}
          </text>
        </svg>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-foreground truncate">{title}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${color}`}>{type}</span>
            <span className="text-[11px] text-muted">{time}</span>
          </div>
        </div>
        <Play className="h-4 w-4 text-muted/30 group-hover:text-accent transition-colors" />
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    setHeroVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ── Nav ── */}
      <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-border">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            <span className="text-lg font-bold gradient-text">Clipfire</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm font-medium text-muted hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link
              href="/sign-in"
              className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/25 active:scale-[0.97]"
            >
              Sign In <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-20 px-6">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

        <div className={`mx-auto max-w-4xl text-center relative transition-all duration-1000 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 border border-accent/20 px-4 py-1.5 mb-8">
            <Zap className="h-3.5 w-3.5 text-accent" />
            <span className="text-xs font-semibold text-accent">AI-Powered Video Repurposing</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-foreground leading-[1.05] tracking-tight">
            One long video.
            <br />
            <span className="gradient-text">30 viral clips.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-muted max-w-2xl mx-auto leading-relaxed">
            Upload your podcast, lecture, or stream. AI finds the most viral moments,
            crops them to vertical, burns captions, and exports — all in under 10 minutes.
          </p>

          {/* CTA buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="group flex items-center gap-2.5 rounded-xl bg-accent px-8 py-4 text-base font-bold text-white transition-all hover:bg-accent-hover hover:shadow-2xl hover:shadow-accent/30 hover:-translate-y-0.5 active:scale-[0.97]"
            >
              Start Repurposing
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#how-it-works"
              className="flex items-center gap-2 rounded-xl border border-border bg-surface px-6 py-4 text-base font-semibold text-muted transition-all hover:text-foreground hover:border-border-bright hover:bg-surface-hover"
            >
              <Play className="h-4 w-4" /> See how it works
            </a>
          </div>

          {/* Social proof */}
          <div className="mt-12 flex items-center justify-center gap-8 text-muted">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-sm">150 min / $5/mo</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-sm">No watermark</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-sm">YouTube URL support</span>
            </div>
          </div>
        </div>

        {/* Hero demo preview */}
        <div className={`mx-auto max-w-5xl mt-16 relative transition-all duration-1000 delay-300 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-2xl shadow-black/30">
            {/* App UI preview */}
            <div className="flex gap-4">
              {/* Fake video player */}
              <div className="w-64 flex-shrink-0 hidden sm:block">
                <div className="rounded-xl bg-black aspect-video flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-purple-500/20" />
                  <Play className="h-10 w-10 text-white/60 relative z-10" />
                </div>
                <div className="flex items-center justify-around mt-3 py-2 rounded-lg bg-background border border-border">
                  <div className="text-center">
                    <div className="text-xs font-bold text-foreground">10</div>
                    <div className="text-[9px] text-muted uppercase">Clips</div>
                  </div>
                  <div className="h-4 w-px bg-border" />
                  <div className="text-center">
                    <div className="text-xs font-bold text-accent">7</div>
                    <div className="text-[9px] text-muted uppercase">Selected</div>
                  </div>
                  <div className="h-4 w-px bg-border" />
                  <div className="text-center">
                    <div className="text-xs font-bold text-foreground">8.4</div>
                    <div className="text-[9px] text-muted uppercase">Avg</div>
                  </div>
                </div>
              </div>

              {/* Fake clip list */}
              <div className="flex-1 space-y-2.5">
                <DemoClipCard title="The Power of Showing Up" type="Hook" score={9.2} time="0:12 – 0:45" color="bg-red-500/15 text-red-400" />
                <DemoClipCard title="Why Most People Quit Too Early" type="Insight" score={8.8} time="2:30 – 3:15" color="bg-blue-500/15 text-blue-400" />
                <DemoClipCard title="The 5 AM Rule That Changed My Life" type="Quote" score={8.5} time="5:01 – 5:38" color="bg-emerald-500/15 text-emerald-400" />
                <DemoClipCard title="This Happened Backstage..." type="Story" score={7.9} time="8:22 – 9:10" color="bg-purple-500/15 text-purple-400" />
              </div>
            </div>

            {/* Mouse cursor indicator */}
            <div className="absolute bottom-8 right-12 animate-bounce hidden lg:block">
              <MousePointer2 className="h-5 w-5 text-accent rotate-12" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 px-6 border-y border-border bg-surface/50">
        <div className="mx-auto max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: 10, suffix: 'x', label: 'More content from one video' },
            { value: 30, suffix: '+', label: 'Clips per upload' },
            { value: 10, suffix: 'min', label: 'Average processing time' },
            { value: 150, suffix: 'min', label: 'Per $5/month' },
          ].map((stat, i) => (
            <div key={i}>
              <div className="text-3xl sm:text-4xl font-black text-foreground">
                <Counter end={stat.value} suffix={stat.suffix} />
              </div>
              <div className="mt-1 text-sm text-muted">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-accent uppercase tracking-widest">How it works</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black text-foreground">
              From upload to viral clips in 4 steps
            </h2>
            <p className="mt-3 text-muted max-w-xl mx-auto">
              No editing skills needed. The AI handles transcription, clip detection, scoring, and export.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <PipelineStep step={1} icon={Upload} title="Upload" desc="Drop a video file or paste a YouTube URL. We handle the rest." delay="0.1s" />
            <PipelineStep step={2} icon={Sparkles} title="AI Analysis" desc="Whisper transcribes. AI scans the transcript for viral-worthy moments." delay="0.2s" />
            <PipelineStep step={3} icon={Scissors} title="Review & Pick" desc="Browse ranked clips with viral scores. Select the ones you want." delay="0.3s" />
            <PipelineStep step={4} icon={Download} title="Export" desc="Vertical crop, burned captions, background music. Download as ZIP." delay="0.4s" />
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-6 bg-surface/30">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-accent uppercase tracking-widest">Features</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black text-foreground">
              Everything you need to go viral
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard
              icon={Zap}
              title="AI Viral Detection"
              desc="Scores each clip on hook strength, emotion, clarity, curiosity gap, and more. See exactly why a clip will perform."
              accent="bg-amber-500/15 text-amber-400"
            />
            <FeatureCard
              icon={Film}
              title="Auto Vertical Crop"
              desc="Converts 16:9 to 9:16, 1:1, or keeps wide. Center-cropped and ready for TikTok, Reels, and Shorts."
              accent="bg-blue-500/15 text-blue-400"
            />
            <FeatureCard
              icon={Sparkles}
              title="Caption Burn-In"
              desc="11 caption styles from Classic to Neon Glow. Pick font, position, and style — baked into the video."
              accent="bg-purple-500/15 text-purple-400"
            />
            <FeatureCard
              icon={Clock}
              title="Hooks & Captions"
              desc="AI generates multiple hook options, a ready-to-post caption, and relevant hashtags for every clip."
              accent="bg-emerald-500/15 text-emerald-400"
            />
            <FeatureCard
              icon={Download}
              title="Batch Export + ZIP"
              desc="Export all selected clips at once. Download individually or as a single ZIP file."
              accent="bg-pink-500/15 text-pink-400"
            />
            <FeatureCard
              icon={Upload}
              title="YouTube URL Import"
              desc="Paste any YouTube link — yt-dlp downloads the video server-side. No need to download first."
              accent="bg-orange-500/15 text-orange-400"
            />
          </div>
        </div>
      </section>

      {/* ── Use cases ── */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-accent uppercase tracking-widest">Who it&apos;s for</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black text-foreground">
              Built for creators who ship daily
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { emoji: '🎙', title: 'Podcasters', desc: 'Turn a 2-hour episode into 20+ short clips without editing a single frame.' },
              { emoji: '🎓', title: 'Educators', desc: 'Extract the most engaging lecture moments for social media distribution.' },
              { emoji: '🎮', title: 'Streamers', desc: 'Find funny moments, clutch plays, and chat reactions — automatically.' },
              { emoji: '📱', title: 'Social Media Managers', desc: 'Repurpose long-form content into platform-native vertical clips at scale.' },
            ].map((uc, i) => (
              <div key={i} className="flex gap-4 rounded-2xl border border-border bg-surface p-5 transition-all hover:border-border-bright hover:-translate-y-0.5 duration-300">
                <span className="text-3xl flex-shrink-0">{uc.emoji}</span>
                <div>
                  <h3 className="font-bold text-foreground">{uc.title}</h3>
                  <p className="mt-1 text-sm text-muted leading-relaxed">{uc.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Reviews ── */}
      <section className="py-20 px-6 bg-surface/30">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-accent uppercase tracking-widest">Reviews</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black text-foreground">
              Loved by creators worldwide
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Marcus J.', role: 'Podcast Host', stars: 5, text: 'I used to spend 4 hours editing clips from each episode. Now I upload, pick the best ones, and post. Literally saved my workflow.' },
              { name: 'Sarah K.', role: 'YouTube Creator', stars: 5, text: 'The viral scoring is scarily accurate. My top-scored clip from Clipfire got 2.3M views on TikTok. Not even kidding.' },
              { name: 'Dev P.', role: 'Course Creator', stars: 5, text: 'I repurpose my 1-hour lectures into 15+ short clips for Instagram. Students actually find my content now. Game changer.' },
              { name: 'Aisha R.', role: 'Social Media Manager', stars: 5, text: 'Managing 4 clients and their content was killing me. Clipfire cut my repurposing time by 80%. Worth every penny at $5/mo.' },
              { name: 'Jake T.', role: 'Fitness Creator', stars: 4, text: 'Caption burn-in is clean and the vertical crop works great. Only wish I could do face tracking but center crop handles most of my content fine.' },
              { name: 'Priya M.', role: 'Tech Reviewer', stars: 5, text: 'Pasted a YouTube link, came back 5 minutes later to 12 clips with hooks and captions ready to go. This is the future of content.' },
            ].map((review, i) => (
              <div key={i} className="rounded-2xl border border-border bg-surface p-5 transition-all hover:border-border-bright duration-300">
                <div className="flex items-center gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <svg key={s} className={`h-4 w-4 ${s < review.stars ? 'text-amber-400' : 'text-border'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-muted leading-relaxed">&ldquo;{review.text}&rdquo;</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{review.name}</div>
                    <div className="text-xs text-muted">{review.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-2xl">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-accent uppercase tracking-widest">FAQ</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black text-foreground">
              Common questions
            </h2>
          </div>

          <div className="space-y-4">
            {[
              { q: 'How does the pricing work?', a: 'You get 150 minutes of video processing per month for $5. Minutes are based on the duration of the video you upload — a 10-minute video uses 10 minutes of credit regardless of how many clips are generated.' },
              { q: 'What happens if processing fails?', a: 'Your credits are automatically refunded if the pipeline fails at any step. You only pay for successful processing.' },
              { q: 'Can I process YouTube videos?', a: 'Yes! Just paste any YouTube URL and we download it server-side. No need to download the video yourself first.' },
              { q: 'What video formats are supported?', a: 'MP4, MOV, AVI, MKV, and WebM. YouTube URLs work too. Maximum file size is 2GB.' },
              { q: 'How long does processing take?', a: 'Typically 3-8 minutes depending on video length. You can close the tab and come back — we\'ll have your clips ready.' },
              { q: 'Can I regenerate clips without extra cost?', a: 'Yes! Regenerating clips only re-runs the AI clip detection, not the transcription. It\'s free and doesn\'t use any credits.' },
              { q: 'What AI models power Clipfire?', a: 'OpenAI Whisper for transcription (word-level timestamps) and GPT for clip detection, scoring, hook generation, and caption writing.' },
              { q: 'Can I cancel anytime?', a: 'Yes, cancel anytime through Gumroad. Your credits remain active until the end of your billing period.' },
            ].map((faq, i) => (
              <div key={i} className="rounded-xl border border-border bg-surface p-5 transition-all hover:border-border-bright duration-300">
                <h3 className="font-bold text-foreground">{faq.q}</h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 px-6 relative">
        {/* Background glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent/8 rounded-full blur-[100px] pointer-events-none" />

        <div className="mx-auto max-w-2xl text-center relative">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/15 border border-accent/20 mb-6">
            <Zap className="h-8 w-8 text-accent" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-foreground">
            Stop editing. Start shipping.
          </h2>
          <p className="mt-4 text-lg text-muted">
            Your next viral clip is hiding inside a video you already recorded.
            <br className="hidden sm:block" />
            Let AI find it.
          </p>

          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-2.5 mt-8 rounded-xl bg-accent px-10 py-4 text-lg font-bold text-white transition-all hover:bg-accent-hover hover:shadow-2xl hover:shadow-accent/30 hover:-translate-y-0.5 active:scale-[0.97]"
          >
            Start repurposing today
            <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
          </Link>

          <p className="mt-4 text-sm text-muted/60">
            $5/mo for 150 minutes. Cancel anytime.
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-10 px-6">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-sm font-bold text-muted">Clipfire</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="text-xs text-muted/50 hover:text-muted transition-colors">Pricing</Link>
            <Link href="/terms" className="text-xs text-muted/50 hover:text-muted transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="text-xs text-muted/50 hover:text-muted transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
