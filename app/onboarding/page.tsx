// app/onboarding/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingRootRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/onboarding/1');
  }, [router]);

  return (
    <div className="min-h-screen bg-bg-page flex items-center justify-center font-sans">
      <div className="text-center space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
        <p className="text-sm text-text-secondary font-medium">Redirecting to onboarding...</p>
      </div>
    </div>
  );
}
