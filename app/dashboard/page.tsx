'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import BrandPresenceHero from '@/components/dashboard/BrandPresenceHero';
import BrandHealthIndicator from '@/components/dashboard/BrandHealthIndicator';
import MarketLandscape from '@/components/dashboard/MarketLandscape';
import BrandStoryVisualizer from '@/components/dashboard/BrandStoryVisualizer';
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
  const [brand360Id, setBrand360Id] = useState<string | null>(null);
  const [brand360Profile, setBrand360Profile] = useState<any>(null);
  const [perceptionScan, setPerceptionScan] = useState<any>(null);

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

          // First, try to get Brand360Profile via organization (from onboarding)
          const orgId = (session.user as any)?.organizationId;
          if (orgId) {
            try {
              const brand360Res = await fetch(`/api/brand-360?brandId=${orgId}`);
              if (brand360Res.ok) {
                const brand360Data = await brand360Res.json();
                if (brand360Data.data) {
                  setBrand360Profile(brand360Data.data);
                  setBrand360Id(brand360Data.data.id);
                  // Create a minimal brandProfile from Brand360 data
                  setBrandProfile({
                    id: brand360Data.data.id,
                    brandName: brand360Data.data.brandName || brand360Data.data.companyName,
                    domain: brand360Data.data.primaryDomain,
                    category: brand360Data.data.industry,
                    descriptor: brand360Data.data.tagline || brand360Data.data.description?.substring(0, 100),
                    crawlingStatus: 'completed',
                  } as any);
                  setIsLoadingBrand(false);
                  return; // Exit early if we found Brand360 via org
                }
              }
            } catch (e) {
              console.error('Failed to fetch Brand360 profile via organization', e);
            }
          }

          // Fallback: try legacy BrandProfile lookup
          const res = await fetch(`/api/brand-profile?userId=${session.user.id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.profile) {
              setBrandProfile(data.profile);
              setCrawlingStatus(data.profile.crawlingStatus || 'idle');

              // Fetch Brand360 profile to get brand360Id and competitor/identity data
              try {
                const brand360Res = await fetch(`/api/brand-360?brandId=${data.profile.id}`);
                if (brand360Res.ok) {
                  const brand360Data = await brand360Res.json();
                  if (brand360Data.data) {
                    setBrand360Profile(brand360Data.data);
                    setBrand360Id(brand360Data.data.id);
                  }
                }
              } catch (e) {
                console.error('Failed to fetch Brand360 profile', e);
              }
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
  }, [status, session?.user?.id, (session?.user as any)?.organizationId]);

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

  // Fetch latest perception scan when brand360Id is available
  useEffect(() => {
    const fetchPerceptionScan = async () => {
      if (brand360Id) {
        try {
          const res = await fetch(`/api/aeo/perception-scan?brand360Id=${brand360Id}`);
          if (res.ok) {
            const result = await res.json();
            // API returns { success: true, data: { scans: [...], total: N } }
            if (result.data?.scans?.[0]) {
              setPerceptionScan(result.data.scans[0]);
            }
          }
        } catch (e) {
          console.error('Failed to fetch perception scan', e);
        }
      }
    };
    fetchPerceptionScan();
  }, [brand360Id]);

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

  // Transform competitor data for MarketLandscape
  const competitors = brand360Profile?.competitorGraph?.competitors?.map((c: any) => ({
    id: c.id,
    name: c.name,
    presence: c.shareOfVoice || 50,
    threatLevel: c.competitorType === 'indirect' ? 'indirect' : c.competitorType === 'aspirational' ? 'aspirational' : 'direct',
    overlap: 70,
    story: c.description || `Competitor in ${brandCategory}`,
    strengths: c.strengths || [],
    weaknesses: c.weaknesses || [],
  })) || [];

  // Transform brand identity data for BrandStoryVisualizer
  const storyNodes = brand360Profile?.brandIdentityPrism || brand360Profile?.values?.length > 0 ? [
    {
      id: '1',
      stage: 'Origin' as const,
      title: brand360Profile?.foundingYear ? `Founded ${brand360Profile.foundingYear}` : 'Brand Origins',
      aiConsistency: perceptionScan?.overallScore || 75,
      keyThemes: brand360Profile?.brandIdentityPrism?.cultureValues || brand360Profile?.values || ['Innovation', 'Quality'],
      platforms: {
        openai: !!perceptionScan?.platformScores?.chatgpt,
        gemini: !!perceptionScan?.platformScores?.gemini,
        claude: !!perceptionScan?.platformScores?.claude,
        perplexity: !!perceptionScan?.platformScores?.perplexity,
      }
    },
    {
      id: '2',
      stage: 'Conflict' as const,
      title: 'Market Challenge',
      aiConsistency: perceptionScan?.overallScore || 70,
      keyThemes: brand360Profile?.brandIdentityPrism?.physique || ['Competition', 'Differentiation'],
      platforms: {
        openai: !!perceptionScan?.platformScores?.chatgpt,
        gemini: !!perceptionScan?.platformScores?.gemini,
        claude: !!perceptionScan?.platformScores?.claude,
        perplexity: !!perceptionScan?.platformScores?.perplexity,
      }
    },
    {
      id: '3',
      stage: 'Resolution' as const,
      title: 'Brand Promise',
      aiConsistency: perceptionScan?.overallScore || 80,
      keyThemes: brand360Profile?.brandIdentityPrism?.relationshipType ? [brand360Profile.brandIdentityPrism.relationshipType] : ['Customer Success'],
      platforms: {
        openai: !!perceptionScan?.platformScores?.chatgpt,
        gemini: !!perceptionScan?.platformScores?.gemini,
        claude: !!perceptionScan?.platformScores?.claude,
        perplexity: !!perceptionScan?.platformScores?.perplexity,
      }
    },
    {
      id: '4',
      stage: 'Evolution' as const,
      title: 'Future Vision',
      aiConsistency: perceptionScan?.overallScore || 65,
      keyThemes: brand360Profile?.brandIdentityPrism?.selfImage || ['Growth', 'Innovation'],
      platforms: {
        openai: !!perceptionScan?.platformScores?.chatgpt,
        gemini: !!perceptionScan?.platformScores?.gemini,
        claude: !!perceptionScan?.platformScores?.claude,
        perplexity: !!perceptionScan?.platformScores?.perplexity,
      }
    },
  ] : [];

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
          brandPulse={perceptionScan?.overallScore || 0}
          pulseTrend={0}
          platformPresence={[
            { platform: 'chatgpt', score: perceptionScan?.platformScores?.chatgpt || 0 },
            { platform: 'gemini', score: perceptionScan?.platformScores?.gemini || 0 },
            { platform: 'claude', score: perceptionScan?.platformScores?.claude || 0 },
            { platform: 'perplexity', score: perceptionScan?.platformScores?.perplexity || 0 },
          ]}
        />

        {/* Brand Health Indicators - Show real data from perception scans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <BrandHealthIndicator
            type="recognition"
            label="Brand Recognition"
            value={perceptionScan?.overallScore || 0}
            trend={0}
            context={perceptionScan ? `${brandName} visibility score across AI platforms` : `Run a perception scan to measure how ${brandName} appears in AI responses`}
            icon={Eye}
          />
          <BrandHealthIndicator
            type="accuracy"
            label="Story Accuracy"
            value={perceptionScan?.overallScore || 0}
            trend={0}
            context={perceptionScan ? `Brand narrative accuracy in AI responses` : `Run a perception scan to measure brand accuracy`}
            icon={CheckCircle}
          />
          <BrandHealthIndicator
            type="voice"
            label="Market Voice"
            value={perceptionScan?.overallScore || 0}
            trend={0}
            context={perceptionScan ? `Share of voice in AI-powered search` : `Run a perception scan to measure share of voice`}
            icon={Target}
          />
          <BrandHealthIndicator
            type="footprint"
            label="Digital Footprint"
            value={perceptionScan ? Object.keys(perceptionScan.platformScores || {}).length * 25 : 0}
            trend={0}
            context={perceptionScan ? `AI platform coverage (${Object.keys(perceptionScan.platformScores || {}).length}/4 platforms)` : `Run a perception scan to track AI crawl activity`}
            icon={Activity}
          />
        </div>

        {/* Market Landscape */}
        <div className="mb-8">
          {competitors.length > 0 ? (
            <MarketLandscape
              userBrand={{ name: brandName, presence: perceptionScan?.overallScore || 50 }}
              competitors={competitors}
            />
          ) : (
            <div className="card p-6">
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
          )}
        </div>

        {/* Brand Story Visualizer */}
        <div className="mb-8">
          {storyNodes.length > 0 ? (
            <BrandStoryVisualizer storyNodes={storyNodes} />
          ) : (
            <div className="card p-6">
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
          )}
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
