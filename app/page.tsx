'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push(ROUTES.LOGIN);
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p style={{ color: 'rgb(var(--foreground-muted))' }}>Redirecting...</p>
      </div>
    </main>
  );
}
