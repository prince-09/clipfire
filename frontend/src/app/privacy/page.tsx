import { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Clipfire - AI Video Repurposing Tool. Learn how we collect, use, and protect your data. We value your privacy.',
  keywords: [
    'Clipfire privacy policy',
    'video repurposing data privacy',
    'Clipfire data protection',
    'AI video tool privacy',
    'video upload data security',
  ],
  alternates: {
    canonical: '/privacy',
  },
  openGraph: {
    title: 'Privacy Policy | Clipfire',
    description: 'Learn how Clipfire collects, uses, and protects your data.',
    url: 'https://clipfire.molevia.com/privacy',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-black text-foreground">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted">Last updated: March 29, 2026</p>

        <div className="mt-10 space-y-8 text-sm text-muted leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">1. Information We Collect</h2>
            <h3 className="font-semibold text-foreground mt-4 mb-2">Account Information</h3>
            <p>When you create an account, we collect your name, email address, and profile picture through Clerk (our authentication provider).</p>

            <h3 className="font-semibold text-foreground mt-4 mb-2">Payment Information</h3>
            <p>Payments are processed by Gumroad. We store your license key and subscription status but do not store credit card numbers, bank details, or other financial information.</p>

            <h3 className="font-semibold text-foreground mt-4 mb-2">Content You Upload</h3>
            <p>We temporarily store videos you upload, transcripts generated from those videos, and clips detected by AI. This content is stored on our servers for processing and is automatically deleted after 7 days.</p>

            <h3 className="font-semibold text-foreground mt-4 mb-2">Usage Data</h3>
            <p>We collect basic usage data including credits consumed, number of projects created, and processing timestamps to provide the Service and prevent abuse.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To provide and maintain the Service (video processing, clip detection, export).</li>
              <li>To manage your account and subscription.</li>
              <li>To track credit usage and enforce plan limits.</li>
              <li>To send important service notifications (e.g., processing failures, subscription changes).</li>
              <li>To improve the Service based on aggregate usage patterns.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">3. Third-Party Services</h2>
            <p>We use the following third-party services that may process your data:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong className="text-foreground">OpenAI</strong> — Your video audio is sent to OpenAI Whisper for transcription, and transcripts are sent to GPT for clip detection. Subject to <span className="text-accent">OpenAI&apos;s privacy policy</span>.</li>
              <li><strong className="text-foreground">Clerk</strong> — Handles authentication and stores account credentials. Subject to <span className="text-accent">Clerk&apos;s privacy policy</span>.</li>
              <li><strong className="text-foreground">Gumroad</strong> — Processes subscription payments. Subject to <span className="text-accent">Gumroad&apos;s privacy policy</span>.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">4. Data Retention</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Uploaded videos and generated clips are automatically deleted after 7 days.</li>
              <li>Transcripts are retained as long as the project exists in your account.</li>
              <li>Account information is retained until you delete your account.</li>
              <li>Usage logs are retained for 90 days for debugging and abuse prevention.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">5. Data Security</h2>
            <p>We implement reasonable security measures to protect your data, including encrypted connections (HTTPS), secure authentication (Clerk), and access controls on our servers. However, no method of transmission over the Internet is 100% secure.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Access the personal data we hold about you.</li>
              <li>Request deletion of your account and associated data.</li>
              <li>Export your generated clips before they are automatically deleted.</li>
              <li>Opt out of non-essential communications.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">7. Cookies</h2>
            <p>We use essential cookies for authentication (Clerk session cookies). We do not use tracking cookies or third-party analytics cookies.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">8. Children&apos;s Privacy</h2>
            <p>The Service is not intended for children under 13. We do not knowingly collect personal information from children under 13.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">9. Changes to This Policy</h2>
            <p>We may update this policy from time to time. We will notify you of material changes via email or a prominent notice on the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">10. Contact</h2>
            <p>For privacy-related questions, contact us at <span className="text-accent">privacy@clipfire.app</span>.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
