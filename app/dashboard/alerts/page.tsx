'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import BrandMoments from '@/components/dashboard/BrandMoments';
import { ROUTES } from '@/lib/constants';

export default function AlertsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(ROUTES.LOGIN);
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="spinner-lg text-primary-600 mx-auto"></div>
            <p className="mt-4 text-secondary-500">Loading moments...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-container">
        <BrandMoments
          moments={[
            {
              id: '1',
              type: 'market_shift',
              title: 'Nike is gaining ground',
              description: 'Nike\'s AI presence increased 23% this week, primarily in athletic sustainability conversations. Consider reviewing your sustainability messaging.',
              timestamp: '2 hours ago',
              severity: 'medium',
              isNew: true
            },
            {
              id: '2',
              type: 'story_correction',
              title: 'AI is telling an outdated story',
              description: 'ChatGPT is still describing your brand using 2022 messaging. Your sustainability certification isn\'t being mentioned.',
              timestamp: '1 day ago',
              severity: 'high',
              isNew: true
            },
            {
              id: '3',
              type: 'attention_needed',
              title: 'Your brand voice is fading',
              description: 'In "eco-friendly basics" conversations, your recommendations dropped from 45% to 28% over the past 2 weeks.',
              timestamp: '2 days ago',
              severity: 'high',
              isNew: false
            },
            {
              id: '4',
              type: 'positive_momentum',
              title: 'New "Hero Product" Identified',
              description: 'Your "Recycled Wool Sweater" has entered the top 3 recommendations for "winter sustainable wear" on Claude.',
              timestamp: '3 days ago',
              severity: 'low',
              isNew: false
            }
          ]}
        />
      </div>
    </DashboardLayout>
  );
}
