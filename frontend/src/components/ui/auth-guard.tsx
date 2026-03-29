'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';

/**
 * Wraps pages that require both authentication and an active subscription.
 * Clerk middleware handles the sign-in redirect; this checks payment status.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoading } = useAuth();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (isLoading || !isSignedIn) return;

    api.get('/license/status')
      .then(({ data }) => {
        if (!data.subscription?.isPaid) {
          router.replace('/activate');
        } else {
          setChecked(true);
        }
      })
      .catch(() => {
        // If license check fails, let them through — backend will enforce
        setChecked(true);
      });
  }, [isSignedIn, isLoading, router]);

  if (isLoading || !checked) return null;
  return <>{children}</>;
}
