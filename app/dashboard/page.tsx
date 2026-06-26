// app/dashboard/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardFallback() {
  const router = useRouter();

  useEffect(() => {
    const activeFarmerId = localStorage.getItem('activeFarmerId');
    if (activeFarmerId) {
      router.replace(`/demo/${activeFarmerId}`);
    } else {
      router.replace('/demo');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-bg-page flex items-center justify-center font-sans">
      <div className="text-center space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
        <p className="text-sm text-text-secondary font-medium">Loading your credit profile...</p>
      </div>
    </div>
  );
}
