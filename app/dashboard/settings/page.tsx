'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect to profile settings by default
export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/settings/profile');
  }, [router]);

  return (
    <div className="p-6 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>
  );
}
