'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  QuadrantChart,
  MetricsRadarChart,
  PlatformComparisonChart,
  PerceptionScoreCard,
  ScoreTrendChart,
  InsightsPriorityMatrix,
  CorrectionFunnel,
} from '@/components/aeo';
import { QuadrantPosition, LLMPlatform, InsightCategory, InsightPriority, CorrectionEffort } from '@/lib/services/agents/types';
import { Loader2 } from 'lucide-react';

interface DashboardData {
  scan: {
    id: string;
    overallScore: number;
    quadrantPosition: QuadrantPosition;
    completedAt: string;
  } | null;
  previousScan: {
    overallScore: number;
    quadrantPosition: QuadrantPosition;
  } | null;
  scanCount: number;
  platformScores: Array<{
    platform: LLMPlatform;
    score: number;
    previousScore?: number;
  }>;
  metrics: {
    faithfulness: number;
    shareOfVoice: number;
    sentiment: number;
    voiceAlignment: number;
    hallucinationRisk: number;
  };
  previousMetrics?: {
    faithfulness: number;
    shareOfVoice: number;
    sentiment: number;
    voiceAlignment: number;
    hallucinationRisk: number;
  };
  trendData: Array<{
    date: Date;
    score: number;
    quadrant?: QuadrantPosition;
    scanId?: string;
  }>;
  insights: Array<{
    id: string;
    title: string;
    category: InsightCategory;
    priority: InsightPriority;
    effort?: CorrectionEffort;
    impact: string;
  }>;
  corrections: {
    suggested: number;
    approved: number;
    implemented: number;
    verified: number;
    dismissed: number;
  };
}

export default function AEODashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brand360Id, setBrand360Id] = useState<string | null>(null);

  // Fetch brand profile to get brand360Id
  useEffect(() => {
    const fetchBrandProfile = async () => {
      if (status !== 'authenticated' || !session?.user?.id) return;

      try {
        const res = await fetch(`/api/brand-profile?userId=${session.user.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.profile?.id) {
            setBrand360Id(data.profile.id);
          }
        }
      } catch (err) {
        console.error('Error fetching brand profile:', err);
      }
    };

    fetchBrandProfile();
  }, [status, session]);

  // Fetch AEO dashboard data
  useEffect(() => {
    const fetchData = async () => {
      if (!brand360Id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch scans for this brand
        const scansRes = await fetch(`/api/aeo/perception-scan?brand360Id=${brand360Id}`);
        if (!scansRes.ok) {
          throw new Error('Failed to fetch scans');
        }
        const scansData = await scansRes.json();
        const scans = scansData.data?.scans || [];

        if (scans.length === 0) {
          setData(null);
          setLoading(false);
          return;
        }

        // Get the latest completed scan
        const completedScans = scans.filter((s: any) => s.status === 'completed');
        if (completedScans.length === 0) {
          setData(null);
          setLoading(false);
          return;
        }

        const latestScan = completedScans[0];
        const previousScan = completedScans.length > 1 ? completedScans[1] : null;

        // Fetch detailed scan data for platform scores
        const scanDetailRes = await fetch(`/api/aeo/perception-scan/${latestScan.id}`);
        let scanDetail = null;
        if (scanDetailRes.ok) {
          const detailData = await scanDetailRes.json();
          scanDetail = detailData.data;
        }

        // Fetch insights
        let insights: any[] = [];
        try {
          const insightsRes = await fetch(`/api/aeo/insights?brand360Id=${brand360Id}&status=open`);
          if (insightsRes.ok) {
            const insightsData = await insightsRes.json();
            insights = insightsData.data?.insights || [];
          }
        } catch (e) {
          console.error('Error fetching insights:', e);
        }

        // Fetch corrections
        let corrections = { suggested: 0, approved: 0, implemented: 0, verified: 0, dismissed: 0 };
        try {
          const correctionsRes = await fetch(`/api/aeo/corrections?brand360Id=${brand360Id}`);
          if (correctionsRes.ok) {
            const correctionsData = await correctionsRes.json();
            const workflows = correctionsData.data?.workflows || [];
            corrections = {
              suggested: workflows.filter((w: any) => w.status === 'suggested').length,
              approved: workflows.filter((w: any) => w.status === 'approved').length,
              implemented: workflows.filter((w: any) => w.status === 'implemented').length,
              verified: workflows.filter((w: any) => w.status === 'verified').length,
              dismissed: workflows.filter((w: any) => w.status === 'dismissed').length,
            };
          }
        } catch (e) {
          console.error('Error fetching corrections:', e);
        }

        // Build platform scores from scan detail
        const platformScores: Array<{ platform: LLMPlatform; score: number; previousScore?: number }> = [];
        if (scanDetail?.aggregatedScores?.byPlatform) {
          const platforms = Object.keys(scanDetail.aggregatedScores.byPlatform) as LLMPlatform[];
          platforms.forEach((platform) => {
            platformScores.push({
              platform,
              score: scanDetail.aggregatedScores.byPlatform[platform] || 0,
            });
          });
        }

        // Build trend data from all completed scans
        const trendData = completedScans
          .slice(0, 10)
          .reverse()
          .map((scan: any) => ({
            date: new Date(scan.completedAt || scan.createdAt),
            score: scan.overallScore || 0,
            quadrant: scan.quadrantPosition as QuadrantPosition,
            scanId: scan.id,
          }));

        // Calculate metrics from latest scan
        const metrics = {
          faithfulness: scanDetail?.aggregatedScores?.overall || latestScan.overallScore || 50,
          shareOfVoice: 50, // Will be calculated from results
          sentiment: 0.5,
          voiceAlignment: 50,
          hallucinationRisk: 80,
        };

        // If we have detailed results, calculate better metrics
        if (scanDetail?.results?.length > 0) {
          const results = scanDetail.results;
          const avgFaithfulness = results.reduce((sum: number, r: any) => sum + (r.metrics?.faithfulnessScore || 0), 0) / results.length;
          const avgShareOfVoice = results.reduce((sum: number, r: any) => sum + (r.metrics?.shareOfVoice || 0), 0) / results.length;
          const avgSentiment = results.reduce((sum: number, r: any) => sum + (r.metrics?.overallSentiment || 0), 0) / results.length;
          const avgVoice = results.reduce((sum: number, r: any) => sum + (r.metrics?.voiceAlignmentScore || 0), 0) / results.length;
          const avgHallucination = results.reduce((sum: number, r: any) => sum + (r.metrics?.hallucinationScore || 0), 0) / results.length;

          metrics.faithfulness = Math.round(avgFaithfulness);
          metrics.shareOfVoice = Math.round(avgShareOfVoice);
          metrics.sentiment = avgSentiment;
          metrics.voiceAlignment = Math.round(avgVoice);
          metrics.hallucinationRisk = Math.round(avgHallucination);
        }

        // Transform insights
        const transformedInsights = insights.slice(0, 5).map((insight: any) => ({
          id: insight.id,
          title: insight.title,
          category: insight.category as InsightCategory,
          priority: insight.priority as InsightPriority,
          effort: insight.effort as CorrectionEffort,
          impact: insight.impact || 'Unknown impact',
        }));

        setData({
          scan: {
            id: latestScan.id,
            overallScore: latestScan.overallScore || 0,
            quadrantPosition: (latestScan.quadrantPosition as QuadrantPosition) || 'invisible',
            completedAt: latestScan.completedAt || latestScan.createdAt,
          },
          previousScan: previousScan
            ? {
                overallScore: previousScan.overallScore || 0,
                quadrantPosition: (previousScan.quadrantPosition as QuadrantPosition) || 'invisible',
              }
            : null,
          scanCount: completedScans.length,
          platformScores,
          metrics,
          previousMetrics: undefined,
          trendData,
          insights: transformedInsights,
          corrections,
        });
      } catch (err) {
        console.error('Failed to fetch AEO data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [brand360Id]);

  const handleStartScan = () => {
    router.push('/dashboard/aeo/scan/new');
  };

  const handleViewDetails = () => {
    if (data?.scan?.id) {
      router.push(`/dashboard/aeo/scan/${data.scan.id}`);
    }
  };

  const handleInsightClick = (insightId: string) => {
    router.push(`/dashboard/aeo/insights/${insightId}`);
  };

  const handleCorrectionStageClick = (status: string) => {
    router.push(`/dashboard/aeo/corrections?status=${status}`);
  };

  const handleScanClick = (scanId: string) => {
    router.push(`/dashboard/aeo/scan/${scanId}`);
  };

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto" />
            <p className="mt-4 text-secondary-500">Loading AEO dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'rgb(var(--foreground))' }}>Error Loading Dashboard</h2>
          <p className="mb-4" style={{ color: 'rgb(var(--foreground-secondary))' }}>{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary">
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (!brand360Id) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'rgb(var(--foreground))' }}>No Brand Profile</h2>
          <p className="mb-4" style={{ color: 'rgb(var(--foreground-secondary))' }}>Please complete onboarding to set up your brand profile first.</p>
          <button onClick={() => router.push('/onboarding')} className="btn-primary">
            Start Onboarding
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'rgb(var(--foreground))' }}>No AEO Data Available</h2>
          <p className="mb-4" style={{ color: 'rgb(var(--foreground-secondary))' }}>Start by running your first perception scan.</p>
          <button onClick={handleStartScan} className="btn-primary">
            Start First Scan
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'rgb(var(--foreground))' }}>AI Perception Dashboard</h1>
            <p className="mt-1" style={{ color: 'rgb(var(--foreground-secondary))' }}>Monitor how AI platforms perceive and represent your brand</p>
          </div>
        </div>

        {/* Hero Score Card */}
        {data.scan && (
          <PerceptionScoreCard
            overallScore={data.scan.overallScore}
            previousScore={data.previousScan?.overallScore}
            quadrant={data.scan.quadrantPosition}
            lastScanAt={new Date(data.scan.completedAt)}
            scanCount={data.scanCount}
            onStartScan={handleStartScan}
            onViewDetails={handleViewDetails}
          />
        )}

        {/* Charts Row 1: Quadrant + Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quadrant Chart */}
          <div className="rounded-xl shadow-sm p-6" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'rgb(var(--foreground))' }}>Position Quadrant</h3>
            <div className="flex justify-center">
              <QuadrantChart
                accuracy={data.metrics.faithfulness}
                visibility={data.metrics.shareOfVoice}
                quadrant={data.scan?.quadrantPosition || 'invisible'}
                previousPosition={
                  data.previousMetrics
                    ? {
                        accuracy: data.previousMetrics.faithfulness,
                        visibility: data.previousMetrics.shareOfVoice,
                      }
                    : undefined
                }
                size="md"
              />
            </div>
          </div>

          {/* Metrics Radar */}
          <div className="rounded-xl shadow-sm p-6" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'rgb(var(--foreground))' }}>Metrics Breakdown</h3>
            <MetricsRadarChart
              currentMetrics={data.metrics}
              previousMetrics={data.previousMetrics}
              showLegend={true}
              height={280}
            />
          </div>
        </div>

        {/* Platform Comparison */}
        {data.platformScores.length > 0 && (
          <div className="rounded-xl shadow-sm p-6" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'rgb(var(--foreground))' }}>Platform Scores</h3>
            <PlatformComparisonChart data={data.platformScores} showComparison={true} benchmark={70} height={220} />
          </div>
        )}

        {/* Charts Row 2: Insights + Corrections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Insights Priority */}
          <div className="rounded-xl shadow-sm p-6" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: 'rgb(var(--foreground))' }}>Top Insights</h3>
              <span className="text-sm" style={{ color: 'rgb(var(--foreground-muted))' }}>{data.insights.length} active</span>
            </div>
            {data.insights.length > 0 ? (
              <InsightsPriorityMatrix insights={data.insights} maxItems={5} onInsightClick={handleInsightClick} />
            ) : (
              <p className="text-center py-8" style={{ color: 'rgb(var(--foreground-muted))' }}>No insights available yet</p>
            )}
          </div>

          {/* Correction Funnel */}
          <div className="rounded-xl shadow-sm p-6" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'rgb(var(--foreground))' }}>Correction Progress</h3>
            <CorrectionFunnel data={data.corrections} onStageClick={handleCorrectionStageClick} />
          </div>
        </div>

        {/* Score Trend */}
        {data.trendData.length > 0 && (
          <div className="rounded-xl shadow-sm p-6" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'rgb(var(--foreground))' }}>Score History</h3>
            <ScoreTrendChart
              data={data.trendData}
              showQuadrantZones={true}
              benchmark={70}
              height={200}
              onPointClick={handleScanClick}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
