'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AIPlatformGalaxy from '@/components/dashboard/AIPlatformGalaxy';
import { ROUTES } from '@/lib/constants';
import { BrandProfile } from '@/types';
import { TrendingUp, PieChart, Smile, ArrowUp } from 'lucide-react';

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(ROUTES.LOGIN);
    }
  }, [status, router]);

  useEffect(() => {
    const fetchBrandProfile = async () => {
      if (session?.user?.id) {
        try {
          const res = await fetch(`/api/brand-profile?userId=${session.user.id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.profile) {
              setBrandProfile(data.profile);
            }
          }
        } catch (e) {
          console.error('Failed to fetch brand profile', e);
        }
      }
    };

    if (status === 'authenticated') {
      fetchBrandProfile();
    }
  }, [status, session?.user?.id]);

  const brandName = brandProfile?.brandName || 'Your Brand';

  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="spinner-lg text-primary-600 mx-auto"></div>
            <p className="mt-4 text-secondary-500">Loading analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const metrics = [
    {
      label: 'Total Reach',
      value: '1.2M',
      change: '+12%',
      trend: 'up',
      description: 'vs last month',
      icon: TrendingUp,
      color: 'primary',
    },
    {
      label: 'Category Share',
      value: '34%',
      change: '+5%',
      trend: 'up',
      description: 'vs last month',
      icon: PieChart,
      color: 'accent',
    },
    {
      label: 'Sentiment Score',
      value: '92/100',
      change: null,
      trend: 'stable',
      description: 'Consistent across platforms',
      icon: Smile,
      color: 'success',
    },
  ];

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Market Landscape</h1>
          <p className="page-subtitle">
            {brandName}&apos;s position in the AI universe
          </p>
        </div>

        <div className="mb-8">
          <AIPlatformGalaxy brandName={brandName} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            const colorClasses = {
              primary: 'bg-primary-50 text-primary-600',
              accent: 'bg-accent-50 text-accent-600',
              success: 'bg-success-50 text-success-600',
            };
            return (
              <div key={metric.label} className="card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2.5 rounded-xl ${colorClasses[metric.color as keyof typeof colorClasses]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {metric.change && (
                    <span className="badge-success flex items-center gap-1">
                      <ArrowUp className="w-3 h-3" />
                      {metric.change}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-secondary-500 uppercase tracking-wide mb-1">
                  {metric.label}
                </p>
                <p className="text-3xl font-bold text-secondary-900 mb-1">{metric.value}</p>
                <p className="text-sm text-secondary-500">{metric.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
