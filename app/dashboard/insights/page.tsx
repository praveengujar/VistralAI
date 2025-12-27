'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import BrandGrowthOpportunities from '@/components/dashboard/BrandGrowthOpportunities';
import { ROUTES } from '@/lib/constants';

export default function InsightsPage() {
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
            <p className="mt-4 text-secondary-500">Loading insights...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-container">
        <BrandGrowthOpportunities
          opportunities={[
            {
              id: '1',
              title: 'Own the "Sustainability" Conversation',
              description: 'AI platforms are discussing sustainable fashion 340% more than last quarter, but your brand is mentioned in only 23% of these conversations. Update your sustainability page with specific metrics.',
              category: 'story',
              impact: 85,
              effort: 'medium',
              potentialPulseIncrease: 15
            },
            {
              id: '2',
              title: 'Correct Pricing Perception on Gemini',
              description: 'Gemini is hallucinating your pricing tier as "Luxury" instead of "Affordable Premium". This may be deterring price-sensitive customers.',
              category: 'reputation',
              impact: 92,
              effort: 'low',
              potentialPulseIncrease: 12
            },
            {
              id: '3',
              title: 'Expand into "Work-from-Home" Contexts',
              description: 'Competitors are dominating the "comfortable work wear" narrative. Your "Soft-Touch" line is perfect for this but missing from AI knowledge bases.',
              category: 'reach',
              impact: 75,
              effort: 'medium',
              potentialPulseIncrease: 8
            },
            {
              id: '4',
              title: 'Outpace "Everlane" on Durability',
              description: 'Everlane just published a durability report that AI is citing heavily. Publish a comparative case study to reclaim this narrative share.',
              category: 'competition',
              impact: 60,
              effort: 'high',
              potentialPulseIncrease: 5
            }
          ]}
        />
      </div>
    </DashboardLayout>
  );
}
