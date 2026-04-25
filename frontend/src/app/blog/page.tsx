import { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles, ArrowRight, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Blog — AI Video Repurposing Tips & Guides',
  description: 'Learn how to repurpose long videos into viral short clips. Tips on AI video clipping, auto captions, podcast to shorts, and more.',
  keywords: [
    'video repurposing blog',
    'AI video editing tips',
    'content repurposing guides',
    'short form video strategy',
    'TikTok content tips',
    'YouTube Shorts guide',
  ],
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Clipfire Blog — AI Video Repurposing Tips & Guides',
    description: 'Learn how to repurpose long videos into viral short clips with AI.',
    url: 'https://clipfire.molevia.com/blog',
    type: 'website',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: 'Clipfire Blog' }],
  },
};

const posts = [
  {
    slug: 'how-to-repurpose-long-videos-into-viral-shorts',
    title: 'How to Repurpose Long Videos into Viral Shorts with AI',
    excerpt: 'Turn a single long-form video into 20+ short clips that actually go viral. Here\'s the step-by-step workflow creators are using in 2025.',
    date: 'Apr 15, 2025',
    readTime: '4 min read',
  },
  {
    slug: 'opus-clip-alternative-clipfire-comparison',
    title: 'Opus Clip vs Clipfire: Which AI Video Clipper Should You Use?',
    excerpt: 'A head-to-head comparison of two popular AI video clippers — features, pricing, and which one gives you more value per dollar.',
    date: 'Apr 10, 2025',
    readTime: '5 min read',
  },
  {
    slug: 'turn-podcast-into-tiktok-shorts',
    title: 'How to Turn Your Podcast into TikTok Shorts Automatically',
    excerpt: 'Stop leaving views on the table. Learn how to extract the best moments from your podcast and post them as vertical shorts.',
    date: 'Apr 5, 2025',
    readTime: '4 min read',
  },
  {
    slug: 'best-ai-video-clipping-tools-2025',
    title: '5 Best AI Video Clipping Tools in 2025 (Compared)',
    excerpt: 'We compared Opus Clip, Vidyo AI, Munch, Kapwing, and Clipfire. Here\'s which tool wins for different creator types and budgets.',
    date: 'Mar 28, 2025',
    readTime: '5 min read',
  },
  {
    slug: 'why-auto-captions-matter-short-form-video',
    title: 'Why Auto Captions Are Essential for Short-Form Video in 2025',
    excerpt: 'Videos with captions get 80% more watch time. Here\'s why burned-in captions matter and how to add them without editing.',
    date: 'Mar 20, 2025',
    readTime: '4 min read',
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-border">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            <span className="text-lg font-bold gradient-text">Clipfire</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm font-medium text-muted hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/sign-in" className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/25 active:scale-[0.97]">
              Sign In <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative pt-32 pb-16 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="mx-auto max-w-3xl text-center relative">
          <span className="text-xs font-bold text-accent uppercase tracking-widest">Blog</span>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black text-foreground">
            Tips, guides & <span className="gradient-text">comparisons</span>
          </h1>
          <p className="mt-4 text-lg text-muted max-w-xl mx-auto">
            Everything you need to know about AI video repurposing, short-form content, and growing on social media.
          </p>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-3xl space-y-5">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
              <article className="rounded-2xl border border-border bg-surface p-6 transition-all duration-300 hover:border-accent/30 hover:shadow-xl hover:shadow-accent/5 hover:-translate-y-0.5">
                <div className="flex items-center gap-3 mb-3">
                  <BookOpen className="h-4 w-4 text-accent" />
                  <span className="text-xs text-muted">{post.date}</span>
                  <span className="text-xs text-muted/50">|</span>
                  <span className="text-xs text-muted">{post.readTime}</span>
                </div>
                <h2 className="text-xl font-bold text-foreground group-hover:text-accent transition-colors">{post.title}</h2>
                <p className="mt-2 text-sm text-muted leading-relaxed">{post.excerpt}</p>
                <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-accent">
                  Read more <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 px-6">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-sm font-bold text-muted">Clipfire</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="text-xs text-muted/50 hover:text-muted transition-colors">Pricing</Link>
            <Link href="/blog" className="text-xs text-muted/50 hover:text-muted transition-colors">Blog</Link>
            <Link href="/terms" className="text-xs text-muted/50 hover:text-muted transition-colors">Terms</Link>
            <Link href="/privacy" className="text-xs text-muted/50 hover:text-muted transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
