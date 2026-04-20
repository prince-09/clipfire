import { Metadata } from 'next';
import { SignUp } from '@clerk/nextjs';

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create your Clipfire account and get 150 minutes of AI-powered video repurposing for $5/month.',
  alternates: {
    canonical: '/sign-up',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <SignUp fallbackRedirectUrl="/dashboard" />
    </div>
  );
}
