import { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles, Check, Zap, ArrowRight, Clock, Film, Download } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pricing — $5/mo for 150 Minutes of AI Video Repurposing',
  description: 'Simple, transparent pricing. $5/month for 150 minutes of AI-powered video repurposing. Auto vertical crop, caption burn-in, viral moment detection for TikTok, Reels, and Shorts.',
  keywords: [
    // Short-tail
    'video clipper pricing',
    'AI clipper cost',
    'repurposing tool price',
    'short form video pricing',
    // Long-tail
    'Clipfire pricing plan',
    'AI video repurposing cost per month',
    'cheap video clipping tool subscription',
    'video to shorts converter pricing',
    'content repurposing tool monthly plan',
    'TikTok clip maker affordable price',
    'auto video clipper cheapest plan',
    '$5 video repurposing tool',
    'best budget AI video editor',
    'how much does video repurposing cost',
    // Competitor pricing
    'Opus Clip pricing vs Clipfire',
    'cheaper than Opus Clip',
    'Vidyo AI pricing alternative',
    'Munch pricing comparison',
    'cheapest AI video clipper 2025',
    'Opus Clip free alternative',
    'affordable Kapwing alternative',
    'Repurpose.io pricing vs Clipfire',
  ],
  alternates: {
    canonical: '/pricing',
  },
  openGraph: {
    title: 'Clipfire Pricing — $5/mo for 150 Minutes',
    description: 'Simple, transparent pricing. $5/month for 150 minutes of AI-powered video repurposing.',
    url: 'https://clipfire.app/pricing',
    type: 'website',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: 'Clipfire Pricing' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Clipfire Pricing — $5/mo for 150 Minutes',
    description: 'Simple, transparent pricing. $5/month for 150 minutes of AI-powered video repurposing.',
    images: ['/twitter-image.png'],
  },
};

const features = [
  '150 minutes of video processing',
  'AI viral moment detection (OpenAI)',
  'Word-level transcription (Whisper)',
  'Vertical crop (9:16) for TikTok/Reels/Shorts',
  'Caption burn-in with 11 styles',
  'Viral score ranking for every clip',
  'YouTube URL import',
  'Batch ZIP export',
  'Hook + caption generation',
];

const faqs = [
  {
    q: 'What counts as a "minute"?',
    a: 'Minutes are based on the duration of the video you upload. A 10-minute video uses 10 minutes of credit, regardless of how many clips are generated.',
  },
  {
    q: 'What happens if processing fails?',
    a: 'Credits are automatically refunded if the pipeline fails. You only pay for successful processing.',
  },
  {
    q: 'Can I process YouTube videos?',
    a: 'Yes — paste any YouTube URL and we download it server-side. The video duration counts toward your minutes.',
  },
  {
    q: 'What AI models do you use?',
    a: 'OpenAI Whisper for transcription and GPT for clip detection and scoring. No compromises on quality.',
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-border">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            <span className="text-lg font-bold gradient-text">Clipfire</span>
          </Link>
          <Link
            href="/sign-in"
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/25 active:scale-[0.97]"
          >
            Sign In <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-16 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="mx-auto max-w-4xl text-center relative animate-fade-in">
          <span className="text-xs font-bold text-accent uppercase tracking-widest">Pricing</span>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black text-foreground">
            Simple pricing.{' '}
            <span className="gradient-text">No surprises.</span>
          </h1>
          <p className="mt-4 text-lg text-muted max-w-xl mx-auto">
            One plan. 150 minutes. Everything included.
          </p>
        </div>
      </section>

      {/* Pricing card */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-md relative animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="rounded-2xl border-2 border-accent/40 bg-surface p-8 shadow-2xl shadow-accent/10">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 border border-accent/20 px-3 py-1 mb-6">
              <Zap className="h-3.5 w-3.5 text-accent" />
              <span className="text-xs font-bold text-accent">Pro Plan</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black text-foreground">$5</span>
              <span className="text-lg text-muted">/month</span>
            </div>

            {/* Minutes highlight */}
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-accent/5 border border-accent/15 px-4 py-3">
              <Clock className="h-5 w-5 text-accent flex-shrink-0" />
              <div>
                <span className="text-sm font-bold text-foreground">150 minutes</span>
                <span className="text-sm text-muted"> of video processing per month</span>
              </div>
            </div>

            {/* Approx videos */}
            <p className="mt-2 text-xs text-muted/60 pl-1">
              ~25 videos at 6 min each, or ~7 videos at 20 min each
            </p>

            {/* Features */}
            <ul className="mt-6 space-y-3">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <Check className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Link
              href="/sign-up"
              className="mt-8 w-full flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-4 text-base font-bold text-white transition-all hover:bg-accent-hover hover:shadow-2xl hover:shadow-accent/30 hover:-translate-y-0.5 active:scale-[0.97]"
            >
              Get Started <ArrowRight className="h-5 w-5" />
            </Link>

            <p className="mt-3 text-center text-xs text-muted/50">
              Powered by Gumroad. Cancel anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Cost breakdown */}
      <section className="py-16 px-6 border-y border-border bg-surface/50">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-black text-foreground text-center mb-8">
            What your $5 gets you
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-surface p-5 text-center">
              <Clock className="h-8 w-8 text-accent mx-auto" />
              <div className="mt-3 text-2xl font-black text-foreground">150 min</div>
              <div className="mt-1 text-sm text-muted">2.5 hours of video</div>
            </div>
            <div className="rounded-xl border border-border bg-surface p-5 text-center">
              <Film className="h-8 w-8 text-accent mx-auto" />
              <div className="mt-3 text-2xl font-black text-foreground">~25</div>
              <div className="mt-1 text-sm text-muted">Videos processed</div>
            </div>
            <div className="rounded-xl border border-border bg-surface p-5 text-center">
              <Download className="h-8 w-8 text-accent mx-auto" />
              <div className="mt-3 text-2xl font-black text-foreground">250+</div>
              <div className="mt-1 text-sm text-muted">Clips generated</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-black text-foreground text-center mb-10">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="rounded-xl border border-border bg-surface p-5">
                <h3 className="font-bold text-foreground">{faq.q}</h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-6 relative">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accent/8 rounded-full blur-[100px] pointer-events-none" />
        <div className="mx-auto max-w-md text-center relative">
          <h2 className="text-2xl font-black text-foreground">Ready to start clipping?</h2>
          <Link
            href="/sign-up"
            className="group inline-flex items-center gap-2 mt-6 rounded-xl bg-accent px-8 py-3.5 text-base font-bold text-white transition-all hover:bg-accent-hover hover:shadow-2xl hover:shadow-accent/30 hover:-translate-y-0.5 active:scale-[0.97]"
          >
            Get Clipfire — $5/mo
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-sm font-bold text-muted">Clipfire</span>
          </div>
          <p className="text-xs text-muted/50">Built for creators who move fast.</p>
        </div>
      </footer>
    </div>
  );
}
