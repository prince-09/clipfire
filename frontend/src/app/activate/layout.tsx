import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Activate License',
  description: 'Activate your Clipfire license key to unlock AI-powered video repurposing.',
  alternates: {
    canonical: '/activate',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function ActivateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
