'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MetricCard from '@/components/ui/MetricCard';
import AlertBanner from '@/components/ui/AlertBanner';
import BrandPresenceHero from '@/components/dashboard/BrandPresenceHero';
import BrandHealthIndicator from '@/components/dashboard/BrandHealthIndicator';
import MarketLandscape from '@/components/dashboard/MarketLandscape';
import BrandStoryVisualizer from '@/components/dashboard/BrandStoryVisualizer';
import OpportunityCard from '@/components/ui/OpportunityCard';
import { ROUTES } from '@/lib/constants';
import {
  generateTimeSeriesData,
  generateAIVisibilityMetrics,
  generateOpportunities,
  generateAlerts,
  generateCompetitorComparison,
  generateCrawlerActivityByType,
} from '@/lib/mockData/generators';
import { Eye, Target, CheckCircle, Activity, ArrowRight, ExternalLink } from 'lucide-react';
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
  const brandId = brandProfile?.id || 'demo-brand';

  const metrics = generateAIVisibilityMetrics(brandId);
  const timeSeriesData = generateTimeSeriesData(30);
  const opportunities = generateOpportunities(5);
  const alerts = generateAlerts(brandId, 3);
  const competitorData = generateCompetitorComparison();
  const crawlerActivity = generateCrawlerActivityByType();

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
          brandPulse={metrics.visibilityScore}
          pulseTrend={12}
          platformPresence={[
            { platform: 'chatgpt', score: 85 },
            { platform: 'gemini', score: 62 },
            { platform: 'claude', score: 74 },
            { platform: 'perplexity', score: 58 },
          ]}
        />

        {/* Alert Banner */}
        <AlertBanner alerts={alerts} />

        {/* Brand Health Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <BrandHealthIndicator
            type="recognition"
            label="Brand Recognition"
            value={metrics.visibilityScore}
            trend={5.2}
            context={`When customers ask about ${brandCategory}, ${brandName} appears in ${metrics.visibilityScore}% of AI responses`}
            icon={Eye}
          />
          <BrandHealthIndicator
            type="accuracy"
            label="Story Accuracy"
            value={metrics.factualAccuracy}
            trend={2.1}
            context={`AI platforms correctly represent your brand values ${metrics.factualAccuracy}% of the time`}
            icon={CheckCircle}
          />
          <BrandHealthIndicator
            type="voice"
            label="Market Voice"
            value={15}
            trend={-3.5}
            context="You own 15% of AI recommendations in your category"
            icon={Target}
          />
          <BrandHealthIndicator
            type="footprint"
            label="Digital Footprint"
            value={346}
            trend={12.3}
            context="AI platforms refreshed your brand knowledge 346 times this month"
            icon={Activity}
          />
        </div>

        {/* Market Landscape */}
        <MarketLandscape
          userBrand={{ name: brandName, presence: metrics.visibilityScore }}
          competitors={[
            {
              id: '1',
              name: 'Competitor A',
              presence: 65,
              threatLevel: 'direct',
              overlap: 80,
              story: "Leading the market with robust enterprise features.",
              strengths: ["Enterprise Security", "Global Support"],
              weaknesses: ["User Interface", "Pricing"],
              recentMoment: "Launched new AI feature last week"
            },
            {
              id: '2',
              name: 'Competitor B',
              presence: 45,
              threatLevel: 'indirect',
              overlap: 40,
              story: "Affordable solution for small businesses.",
              strengths: ["Pricing", "Ease of Use"],
              weaknesses: ["Advanced Features", "Scalability"],
            },
            {
              id: '3',
              name: 'Competitor C',
              presence: 85,
              threatLevel: 'aspirational',
              overlap: 20,
              story: "The gold standard for industry innovation.",
              strengths: ["Brand Recognition", "Innovation"],
              weaknesses: ["Legacy Codebase", "Customer Service"],
              recentMoment: "Mentioned in major tech publication"
            }
          ]}
        />

        {/* Brand Story Visualizer */}
        <div className="mb-8">
          <BrandStoryVisualizer
            storyNodes={[
              {
                id: '1',
                stage: 'Origin',
                title: 'The Founding Vision',
                aiConsistency: 92,
                keyThemes: ['Sustainability', 'Innovation', 'Accessibility'],
                platforms: { openai: true, gemini: true, claude: true, perplexity: true }
              },
              {
                id: '2',
                stage: 'Conflict',
                title: 'Market Challenge',
                aiConsistency: 65,
                keyThemes: ['High Cost', 'Limited Supply', 'Niche Appeal'],
                platforms: { openai: true, gemini: false, claude: true, perplexity: false }
              },
              {
                id: '3',
                stage: 'Resolution',
                title: 'The Solution',
                aiConsistency: 88,
                keyThemes: ['Affordable Eco-Friendly', 'Direct-to-Consumer', 'Transparency'],
                platforms: { openai: true, gemini: true, claude: true, perplexity: true }
              },
              {
                id: '4',
                stage: 'Evolution',
                title: 'Future Vision',
                aiConsistency: 45,
                keyThemes: ['Global Expansion', 'Circular Economy', 'Tech Integration'],
                platforms: { openai: false, gemini: false, claude: true, perplexity: false }
              }
            ]}
          />
        </div>

        {/* AI Crawler Activity */}
        <div className="card p-6 mb-8">
          <div className="section-header">
            <h3 className="section-title">AI Crawler Activity</h3>
            <span className="badge-secondary">Last 30 Days</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {crawlerActivity.map((crawler) => (
              <div
                key={crawler.name}
                className="p-4 rounded-xl"
                style={{
                  backgroundColor: 'rgb(var(--background-secondary))',
                  border: '1px solid rgb(var(--border))',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium" style={{ color: 'rgb(var(--foreground-secondary))' }}>{crawler.name}</span>
                  <span className="badge-primary">{crawler.percentage}%</span>
                </div>
                <p className="text-2xl font-bold mb-3" style={{ color: 'rgb(var(--foreground))' }}>{crawler.count}</p>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgb(var(--border))' }}>
                  <div
                    className="h-full bg-gradient-to-r from-primary-600 to-primary-500 rounded-full transition-all duration-500"
                    style={{ width: `${crawler.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Opportunities */}
        <div className="card p-6">
          <div className="section-header">
            <h3 className="section-title">Top Optimization Opportunities</h3>
            <Link
              href={ROUTES.INSIGHTS}
              className="btn-ghost btn-sm text-primary-600 group"
            >
              View all
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <div className="space-y-4">
            {opportunities.map((opportunity) => (
              <OpportunityCard key={opportunity.id} opportunity={opportunity} />
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
