'use client';

import { Card } from '@/components/ui/Card';
import { UsageLimitBar } from '@/components/features/UsageLimitBar';

interface UsageOverviewProps {
  usage: {
    brands: { used: number; limit: number; percentage: number };
    teamSeats: { used: number; limit: number | 'Unlimited'; percentage: number };
    customTopicsPerBrand: number;
    competitorsPerBrand: number;
    updateFrequency: string;
  };
  tier: {
    displayName: string;
  };
}

export function UsageOverview({ usage, tier }: UsageOverviewProps) {
  return (
    <Card className="p-6">
      <h3 className="font-semibold text-[rgb(var(--foreground))] mb-4">Current Usage</h3>

      <div className="space-y-6">
        {/* Brands */}
        <UsageLimitBar
          label="Brands Monitored"
          used={usage.brands.used}
          limit={usage.brands.limit}
          warningThreshold={80}
        />

        {/* Team Seats */}
        <UsageLimitBar
          label="Team Seats"
          used={usage.teamSeats.used}
          limit={usage.teamSeats.limit}
          warningThreshold={90}
        />

        {/* Other Limits */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[rgb(var(--border))]">
          <div>
            <p className="text-sm text-[rgb(var(--foreground-secondary))]">Custom Topics/Brand</p>
            <p className="font-semibold text-[rgb(var(--foreground))]">
              {usage.customTopicsPerBrand || 'Not available'}
            </p>
          </div>
          <div>
            <p className="text-sm text-[rgb(var(--foreground-secondary))]">Competitors/Brand</p>
            <p className="font-semibold text-[rgb(var(--foreground))]">
              {usage.competitorsPerBrand || 'Not available'}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
