'use client';

import { useEffect } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/nextjs';
import { setTokenGetter } from '@/lib/api';

export function useAuth() {
  const { getToken, isSignedIn, isLoaded } = useClerkAuth();
  const { user } = useUser();

  useEffect(() => {
    if (isSignedIn) {
      setTokenGetter(() => getToken());
    }
  }, [isSignedIn, getToken]);

  return {
    user: user ? {
      id: user.id,
      name: user.fullName || user.firstName || 'User',
      email: user.primaryEmailAddress?.emailAddress || '',
      imageUrl: user.imageUrl,
    } : null,
    isLoading: !isLoaded,
    isSignedIn: !!isSignedIn,
  };
}
