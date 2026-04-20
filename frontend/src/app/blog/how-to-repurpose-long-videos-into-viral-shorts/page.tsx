import { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles, ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'How to Repurpose Long Videos into Viral Shorts with AI',
  description: 'Learn the exact workflow to turn a single long-form video into 20+ viral short clips using AI. Step-by-step guide for podcasters, educators, and creators.',
  keywords: [
    'AI video repurposing',
    'long video to short clips',
    'repurpose video content',
    'video to shorts converter',
    'viral clip detector AI',
    'turn long video into shorts',
    'AI short form video generator',
    'auto cut viral moments from video',
    'content repurposing tool for creators',
    'repurpose video content for social media',
  ],
  alternates: { canonical: '/blog/how-to-repurpose-long-videos-into-viral-shorts' },
  openGraph: {
    title: 'How to Repurpose Long Videos into Viral Shorts with AI',
    description: 'Turn a single long-form video into 20+ short clips that actually go viral.',
    url: 'https://clipfire.app/blog/how-to-repurpose-long-videos-into-viral-shorts',
    type: 'article',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: 'How to Repurpose Long Videos into Viral Shorts' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How to Repurpose Long Videos into Viral Shorts with AI',
    description: 'Turn a single long-form video into 20+ short clips that actually go viral.',
    images: ['/twitter-image.png'],
  },
};

export default function BlogPost() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-border">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            <span className="text-lg font-bold gradient-text">Clipfire</span>
          </Link>
          <Link href="/sign-in" className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-accent-hover">
            Sign In <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </nav>

      <article className="pt-32 pb-24 px-6">
        <div className="mx-auto max-w-2xl">
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline mb-8">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Blog
          </Link>

          <span className="text-xs text-muted">Apr 15, 2025 &middot; 4 min read</span>
          <h1 className="mt-2 text-3xl sm:text-4xl font-black text-foreground leading-tight">
            How to Repurpose Long Videos into Viral Shorts with AI
          </h1>

          <div className="mt-10 prose-custom space-y-5 text-muted leading-relaxed">
            <p>
              You spent hours recording a podcast, lecture, or live stream. It performed okay on YouTube — but the real growth opportunity is sitting inside that video, untouched. The best 30-60 second moments from your long-form content can outperform the original video 10x on platforms like TikTok, Instagram Reels, and YouTube Shorts.
            </p>
            <p>
              The problem? Manually scrubbing through a 45-minute video, finding the highlights, cropping to vertical, adding captions, and exporting takes hours. That&apos;s where AI video repurposing changes everything.
            </p>

            <h2 className="text-xl font-bold text-foreground pt-4">What Is AI Video Repurposing?</h2>
            <p>
              AI video repurposing tools analyze your long-form video — usually by transcribing the audio first — and then use language models to identify the most engaging, shareable, or &ldquo;viral-worthy&rdquo; moments. These moments are scored, ranked, and extracted into standalone short clips ready for social media.
            </p>
            <p>
              Instead of spending 3-4 hours editing clips manually, you upload once and get 10-30 clips back in under 10 minutes. Each clip comes with a viral score, suggested hook, caption, and hashtags.
            </p>

            <h2 className="text-xl font-bold text-foreground pt-4">The 4-Step Workflow</h2>
            <p>
              <strong className="text-foreground">Step 1: Upload your video.</strong> Drop a video file (MP4, MOV, MKV, AVI, WebM) or paste a YouTube URL. The tool downloads and processes the video server-side — no need to download anything yourself.
            </p>
            <p>
              <strong className="text-foreground">Step 2: AI transcription.</strong> The audio is extracted and sent through OpenAI Whisper, which produces a word-level transcript with precise timestamps. This is the foundation the AI uses to find clip boundaries.
            </p>
            <p>
              <strong className="text-foreground">Step 3: Clip detection and scoring.</strong> A language model scans the transcript and identifies moments with strong hooks, emotional peaks, surprising insights, quotable lines, or curiosity gaps. Each clip gets a viral score from 1-10 based on factors like hook strength, clarity, emotional resonance, and shareability.
            </p>
            <p>
              <strong className="text-foreground">Step 4: Review and export.</strong> Browse the ranked clips, preview them, adjust start/end times if needed, and select the ones you want. The tool crops each clip to 9:16 vertical format, burns in captions with your chosen style, and exports everything — individually or as a batch ZIP download.
            </p>

            <h2 className="text-xl font-bold text-foreground pt-4">Why This Works So Well</h2>
            <p>
              The key insight is that your long-form content already contains viral moments — you just don&apos;t have time to find and edit all of them. A 30-minute podcast easily has 10-15 clips worth posting. A 1-hour lecture could have 25+. Most creators only extract 2-3 clips manually because editing is painful.
            </p>
            <p>
              AI removes the bottleneck. It doesn&apos;t get tired, doesn&apos;t skip sections, and scores every potential clip objectively. Creators using this workflow report posting 5-10x more short-form content with less effort than before.
            </p>

            <h2 className="text-xl font-bold text-foreground pt-4">Getting Started</h2>
            <p>
              Tools like Clipfire make this workflow accessible for $5/month — that&apos;s 150 minutes of video processing, enough for roughly 25 videos. Upload your first video, review the AI-detected clips, and export them with captions burned in. You&apos;ll have a week&apos;s worth of short-form content from a single recording session.
            </p>
            <p>
              The creators who grow fastest in 2025 won&apos;t be the ones who create the most content — they&apos;ll be the ones who repurpose the smartest.
            </p>
          </div>

          <div className="mt-12 rounded-2xl border border-accent/30 bg-accent/5 p-6 text-center">
            <h3 className="text-lg font-bold text-foreground">Ready to repurpose your first video?</h3>
            <p className="mt-2 text-sm text-muted">Upload a video and get 30 clips in under 10 minutes.</p>
            <Link href="/dashboard" className="inline-flex items-center gap-2 mt-4 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white transition-all hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/25">
              Try Clipfire Free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </article>

      <footer className="border-t border-border py-8 px-6">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-sm font-bold text-muted">Clipfire</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/blog" className="text-xs text-muted/50 hover:text-muted transition-colors">Blog</Link>
            <Link href="/pricing" className="text-xs text-muted/50 hover:text-muted transition-colors">Pricing</Link>
            <Link href="/terms" className="text-xs text-muted/50 hover:text-muted transition-colors">Terms</Link>
            <Link href="/privacy" className="text-xs text-muted/50 hover:text-muted transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
