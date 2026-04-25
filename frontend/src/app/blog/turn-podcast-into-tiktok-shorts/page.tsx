import { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles, ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'How to Turn Your Podcast into TikTok Shorts Automatically',
  description: 'Step-by-step guide to extracting the best moments from your podcast and turning them into vertical TikTok and Reels clips with AI. No editing skills needed.',
  keywords: [
    'podcast to shorts',
    'podcast to TikTok',
    'turn podcast into short clips',
    'podcast clips for social media',
    'YouTube to TikTok converter',
    'podcast repurposing tool',
    'auto clip podcast episodes',
    'podcast to Reels',
    'podcast to YouTube Shorts',
    'podcast content repurposing',
  ],
  alternates: { canonical: '/blog/turn-podcast-into-tiktok-shorts' },
  openGraph: {
    title: 'How to Turn Your Podcast into TikTok Shorts Automatically',
    description: 'Extract the best moments from your podcast and post them as vertical shorts.',
    url: 'https://clipfire.molevia.com/blog/turn-podcast-into-tiktok-shorts',
    type: 'article',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: 'Turn Podcast into TikTok Shorts' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How to Turn Your Podcast into TikTok Shorts Automatically',
    description: 'Extract the best moments from your podcast and post them as vertical shorts.',
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

          <span className="text-xs text-muted">Apr 5, 2025 &middot; 4 min read</span>
          <h1 className="mt-2 text-3xl sm:text-4xl font-black text-foreground leading-tight">
            How to Turn Your Podcast into TikTok Shorts Automatically
          </h1>

          <div className="mt-10 prose-custom space-y-5 text-muted leading-relaxed">
            <p>
              Podcasting is booming, but discovery is still broken. Most podcasts rely on word of mouth or existing subscribers to grow. Meanwhile, short-form video platforms like TikTok, Instagram Reels, and YouTube Shorts are handing out millions of impressions to anyone who posts consistently. The bridge between these two worlds? Repurposing your podcast episodes into short vertical clips.
            </p>

            <h2 className="text-xl font-bold text-foreground pt-4">Why Podcast Clips Go Viral</h2>
            <p>
              Podcast conversations are goldmines for short-form content. Think about it — every episode has moments of raw emotion, surprising takes, funny exchanges, and quotable insights. These are exactly the types of clips that perform on TikTok and Reels. The problem is that finding and editing these moments manually is brutal. A 1-hour episode could take 3-4 hours to comb through, clip, crop, and caption.
            </p>

            <h2 className="text-xl font-bold text-foreground pt-4">The AI Shortcut</h2>
            <p>
              AI video repurposing tools like Clipfire eliminate the editing bottleneck entirely. Here&apos;s how the workflow looks for podcasters:
            </p>
            <p>
              <strong className="text-foreground">1. Upload your episode.</strong> Record your podcast as usual. Whether it&apos;s video-first (which is ideal) or audio-only with a static image, upload the file to Clipfire. If your episode is already on YouTube, just paste the URL — the tool downloads it for you.
            </p>
            <p>
              <strong className="text-foreground">2. AI finds the best moments.</strong> Whisper transcribes every word with precise timestamps. Then GPT analyzes the full transcript and identifies moments that work as standalone clips — strong hooks, emotional peaks, controversial takes, and memorable quotes. Each clip gets a viral score so you know which ones to prioritize.
            </p>
            <p>
              <strong className="text-foreground">3. Pick and post.</strong> Browse the ranked clips, preview each one, and select your favorites. Clipfire crops them to vertical 9:16, burns in captions with your chosen style, and exports them ready to upload. No Premiere Pro, no After Effects, no hiring an editor.
            </p>

            <h2 className="text-xl font-bold text-foreground pt-4">How Many Clips Can You Get?</h2>
            <p>
              A typical 30-minute podcast episode yields 8-15 potential clips. A 1-hour episode can produce 15-25+ clips. Even if only half of those are worth posting, that&apos;s 4-12 pieces of content from a single recording session. Most podcasters record weekly — that&apos;s 16-48 short clips per month from work you&apos;re already doing.
            </p>

            <h2 className="text-xl font-bold text-foreground pt-4">Caption Styles That Work</h2>
            <p>
              Captions are non-negotiable for short-form video. Over 80% of TikTok and Reels users watch with sound off, at least initially. Burned-in captions hook viewers before they even turn on audio. Clipfire offers 11 caption styles — from minimal and clean to bold and animated — so your clips match your brand aesthetic. The captions are baked into the video file, which means they show up everywhere regardless of platform settings.
            </p>

            <h2 className="text-xl font-bold text-foreground pt-4">The Math for Podcasters</h2>
            <p>
              At $5/month for 150 minutes of processing, a weekly podcaster recording 30-minute episodes can process about 5 episodes per month — generating 40-75 short clips total. That&apos;s roughly 7 cents per clip. Compare that to hiring a freelance editor at $10-25 per clip, and the ROI is obvious. You&apos;re not replacing creative judgment — you&apos;re removing the tedious grunt work so you can focus on picking the best moments and posting consistently.
            </p>
          </div>

          <div className="mt-12 rounded-2xl border border-accent/30 bg-accent/5 p-6 text-center">
            <h3 className="text-lg font-bold text-foreground">Turn your next episode into 15+ clips</h3>
            <p className="mt-2 text-sm text-muted">Upload your podcast and get clips with captions in minutes.</p>
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
