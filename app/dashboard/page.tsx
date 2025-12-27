'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import BrandPresenceHero from '@/components/dashboard/BrandPresenceHero';
import BrandHealthIndicator from '@/components/dashboard/BrandHealthIndicator';
import EmptyState from '@/components/ui/EmptyState';
import { ROUTES } from '@/lib/constants';
import { Eye, Target, CheckCircle, Activity, ArrowRight, Sparkles } from 'lucide-react';
import { BrandProfile } from '@/types';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [crawlingStatus, setCrawlingStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const [isLoadingBrand, setIsLoadingBrand] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(ROUTES.LOGIN);
    }
  }, [status, router]);

  useEffect(() => {
    const fetchBrandProfile = async () => {
      if (session?.user?.id) {
        try {
          setIsLoadingBrand(true);
          const res = await fetch(`/api/brand-profile?userId=${session.user.id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.profile) {
              setBrandProfile(data.profile);
              setCrawlingStatus(data.profile.crawlingStatus || 'idle');
            }
          }
        } catch (e) {
          console.error('Failed to fetch brand profile', e);
        } finally {
          setIsLoadingBrand(false);
        }
      } else {
        setIsLoadingBrand(false);
      }
    };

    if (status === 'authenticated') {
      fetchBrandProfile();
    }
  }, [status, session?.user?.id]);

  useEffect(() => {
    if (crawlingStatus !== 'processing') return;

    const interval = setInterval(async () => {
      if (session?.user?.id) {
        try {
          const res = await fetch(`/api/brand-profile?userId=${session.user.id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.profile?.crawlingStatus) {
              setCrawlingStatus(data.profile.crawlingStatus);
              if (data.profile.crawlingStatus !== 'processing') {
                setBrandProfile(data.profile);
              }
            }
          }
        } catch (e) {
          console.error('Failed to check crawling status', e);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [crawlingStatus, session?.user?.id]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-lg text-primary-600 mx-auto"></div>
          <p className="mt-4 text-secondary-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const brandName = brandProfile?.brandName || 'Your Brand';
  const brandCategory = brandProfile?.category || 'Your Industry';
  const brandTagline = brandProfile?.descriptor || 'Building your brand presence in AI';

  // Show empty state if no brand profile exists
  if (!isLoadingBrand && !brandProfile) {
    return (
      <DashboardLayout>
        <div className="page-container pt-12">
          <EmptyState
            title="No Brand Profile Found"
            description="Create your brand profile to start tracking AI visibility and brand presence across platforms."
            icon={<Sparkles className="w-8 h-8" style={{ color: 'rgb(var(--primary))' }} />}
            action={{
              label: 'Create Brand Profile',
              onClick: () => router.push(ROUTES.ONBOARDING),
            }}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {crawlingStatus === 'processing' && (
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-3 shadow-soft relative z-10">
          <div className="page-container flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="spinner-sm border-white/30 border-t-white"></div>
              <p className="text-sm font-medium">
                Analyzing {brandName}&apos;s website to build your brand profile...
              </p>
            </div>
            <Link
              href={ROUTES.BRAND_PROFILE}
              className="btn-sm bg-white/10 hover:bg-white/20 text-white rounded-lg px-3 py-1 text-xs font-medium transition-colors flex items-center gap-1"
            >
              View Progress
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      <div className="page-container pt-6">
        {/* Brand Presence Hero */}
        <BrandPresenceHero
          brandName={brandName}
          brandTagline={brandTagline}
          industry={brandCategory}
          brandPulse={0}
          pulseTrend={0}
          platformPresence={[
            { platform: 'chatgpt', score: 0 },
            { platform: 'gemini', score: 0 },
            { platform: 'claude', score: 0 },
            { platform: 'perplexity', score: 0 },
          ]}
        />

        {/* Brand Health Indicators - Show zeros until AEO scan is completed */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <BrandHealthIndicator
            type="recognition"
            label="Brand Recognition"
            value={0}
            trend={0}
            context={`Run a perception scan to measure how ${brandName} appears in AI responses`}
            icon={Eye}
          />
          <BrandHealthIndicator
            type="accuracy"
            label="Story Accuracy"
            value={0}
            trend={0}
            context={`Run a perception scan to measure brand accuracy`}
            icon={CheckCircle}
          />
          <BrandHealthIndicator
            type="voice"
            label="Market Voice"
            value={0}
            trend={0}
            context="Run a perception scan to measure share of voice"
            icon={Target}
          />
          <BrandHealthIndicator
            type="footprint"
            label="Digital Footprint"
            value={0}
            trend={0}
            context="Run a perception scan to track AI crawl activity"
            icon={Activity}
          />
        </div>

        {/* Market Landscape - show empty state since competitor data requires AEO scan */}
        <div className="card p-6 mb-8">
          <EmptyState
            title="No Competitors Analyzed"
            description="Run a perception scan to discover and analyze how your competitors appear in AI responses."
            icon="search"
            action={{
              label: 'Run Perception Scan',
              onClick: () => router.push(ROUTES.INSIGHTS),
            }}
          />
        </div>

        {/* Brand Story Visualizer - show empty state since story data requires AEO scan */}
        <div className="card p-6 mb-8">
          <EmptyState
            title="No Brand Story Data"
            description="Run a perception scan to analyze how AI platforms tell your brand story."
            icon="file"
            action={{
              label: 'Run Perception Scan',
              onClick: () => router.push(ROUTES.INSIGHTS),
            }}
          />
        </div>

        {/* Top Opportunities - show empty state since opportunities require AEO scan */}
        <div className="card p-6">
          <EmptyState
            title="No Opportunities Identified"
            description="Run a perception scan to discover optimization opportunities for your brand."
            icon="search"
            action={{
              label: 'Run Perception Scan',
              onClick: () => router.push(ROUTES.INSIGHTS),
            }}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
