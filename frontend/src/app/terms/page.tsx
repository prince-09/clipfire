import { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for Clipfire - AI Video Repurposing Tool. Understand our subscription terms, content ownership, and user responsibilities.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-border">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            <span className="text-lg font-bold gradient-text">Clipfire</span>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 pt-32 pb-20">
        <h1 className="text-3xl font-black text-foreground">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted">Last updated: March 29, 2026</p>

        <div className="mt-10 space-y-8 text-sm text-muted leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using Clipfire (&ldquo;the Service&rdquo;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">2. Description of Service</h2>
            <p>Clipfire is an AI-powered video repurposing tool that processes uploaded videos to detect, clip, and export short-form content. The Service uses third-party AI models (OpenAI) for transcription and analysis.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">3. Account and Subscription</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>You must create an account to use the Service.</li>
              <li>Subscriptions are billed monthly at $5/month through Gumroad.</li>
              <li>Each subscription includes 150 minutes of video processing per billing cycle.</li>
              <li>Unused credits do not roll over to the next billing period.</li>
              <li>You may cancel your subscription at any time through Gumroad. Access continues until the end of your current billing period.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">4. Credits and Refunds</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Credits are deducted based on the duration of the video uploaded, not the number of clips generated.</li>
              <li>If processing fails, credits are automatically refunded to your account.</li>
              <li>Regenerating clips (re-running AI detection on an existing transcript) does not consume additional credits.</li>
              <li>We do not offer monetary refunds for unused credits. Contact support for exceptional circumstances.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">5. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Upload content you do not own or have the right to process.</li>
              <li>Use the Service to create illegal, harmful, or infringing content.</li>
              <li>Attempt to reverse-engineer, scrape, or abuse the Service.</li>
              <li>Share your account or license key with others.</li>
              <li>Use automated tools to interact with the Service beyond its intended use.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">6. Content Ownership</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>You retain full ownership of all content you upload and all clips generated.</li>
              <li>We do not claim any rights to your videos, transcripts, or generated clips.</li>
              <li>We may temporarily store your content on our servers for processing. Files are automatically deleted after 7 days.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">7. Third-Party Services</h2>
            <p>The Service relies on third-party providers including OpenAI (for AI processing), Clerk (for authentication), and Gumroad (for payments). Your use of these services is subject to their respective terms and privacy policies.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">8. Limitation of Liability</h2>
            <p>The Service is provided &ldquo;as is&rdquo; without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the Service, including but not limited to lost revenue, data loss, or content quality issues.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">9. Modifications</h2>
            <p>We reserve the right to modify these terms at any time. Continued use of the Service after changes constitutes acceptance of the modified terms. We will notify users of material changes via email.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">10. Contact</h2>
            <p>For questions about these terms, contact us at <span className="text-accent">support@clipfire.app</span>.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
