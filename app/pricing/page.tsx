'use client';

import { useRouter } from 'next/navigation';
import { PricingPage } from '@/components/pricing/PricingPage';

export default function PricingRoute() {
  const router = useRouter();

  const handleSelectTier = (tierId: string, billingCycle: 'monthly' | 'yearly') => {
    router.push(`/onboarding/payment?tier=${tierId}&billing=${billingCycle}`);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'rgb(var(--background))' }}>
      <PricingPage onSelectTier={handleSelectTier} />
    </div>
  );
}
