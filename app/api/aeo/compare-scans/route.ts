import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MetricComparison {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  improved: boolean;
}

interface PlatformComparison {
  platform: string;
  current: number;
  previous: number;
  change: number;
}

interface CategoryComparison {
  category: string;
  current: number;
  previous: number;
  change: number;
}

/**
 * POST /api/aeo/compare-scans
 * Compare two perception scans
 *
 * Request body:
 * - scanId1: string (required) - The first (earlier) scan ID
 * - scanId2: string (required) - The second (later) scan ID
 *
 * OR
 * - brand360Id: string (required) - Compare latest two scans
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    let { scanId1, scanId2 } = body;
    const { brand360Id } = body;

    // If brand360Id provided, get the latest two scans
    if (brand360Id && (!scanId1 || !scanId2)) {
      const recentScans = await prisma.perceptionScan.findMany({
        where: { brand360Id },
        orderBy: { createdAt: 'desc' },
        take: 2,
        select: { id: true },
      });

      if (recentScans.length < 2) {
        return NextResponse.json(
          { error: 'Need at least 2 scans to compare. Only found ' + recentScans.length },
          { status: 400 }
        );
      }

      scanId1 = recentScans[1].id; // Earlier scan
      scanId2 = recentScans[0].id; // Later scan
    }

    if (!scanId1 || !scanId2) {
      return NextResponse.json(
        { error: 'Either scanId1 and scanId2, or brand360Id is required' },
        { status: 400 }
      );
    }

    // Fetch both scans with their results and related prompts
    const [scan1, scan2] = await Promise.all([
      prisma.perceptionScan.findUnique({
        where: { id: scanId1 },
        include: { results: { include: { prompt: true } } },
      }),
      prisma.perceptionScan.findUnique({
        where: { id: scanId2 },
        include: { results: { include: { prompt: true } } },
      }),
    ]);

    if (!scan1) {
      return NextResponse.json(
        { error: `Scan not found: ${scanId1}` },
        { status: 404 }
      );
    }

    if (!scan2) {
      return NextResponse.json(
        { error: `Scan not found: ${scanId2}` },
        { status: 404 }
      );
    }

    // Ensure scans are from the same brand
    if (scan1.brand360Id !== scan2.brand360Id) {
      return NextResponse.json(
        { error: 'Scans must be from the same brand' },
        { status: 400 }
      );
    }

    // Calculate overall score change
    const overallScoreChange: MetricComparison = {
      current: scan2.overallScore || 0,
      previous: scan1.overallScore || 0,
      change: (scan2.overallScore || 0) - (scan1.overallScore || 0),
      changePercent: scan1.overallScore
        ? (((scan2.overallScore || 0) - scan1.overallScore) / scan1.overallScore) * 100
        : 0,
      improved: (scan2.overallScore || 0) > (scan1.overallScore || 0),
    };

    // Calculate metric aggregates for each scan
    const calculateMetricAverages = (results: typeof scan1.results) => {
      if (!results || results.length === 0) {
        return {
          faithfulness: 0,
          shareOfVoice: 0,
          sentiment: 0,
          voiceAlignment: 0,
          hallucinationScore: 0,
        };
      }

      type MetricTotals = { faithfulness: number; shareOfVoice: number; sentiment: number; voiceAlignment: number; hallucinationScore: number };
      type ResultItem = { faithfulnessScore: number | null; shareOfVoice: number | null; overallSentiment: number | null; voiceAlignmentScore: number | null; hallucinationScore: number | null };
      const totals = results.reduce(
        (acc: MetricTotals, r: ResultItem) => ({
          faithfulness: acc.faithfulness + (r.faithfulnessScore || 0),
          shareOfVoice: acc.shareOfVoice + (r.shareOfVoice || 0),
          sentiment: acc.sentiment + (r.overallSentiment || 0),
          voiceAlignment: acc.voiceAlignment + (r.voiceAlignmentScore || 0),
          hallucinationScore: acc.hallucinationScore + (r.hallucinationScore || 0),
        }),
        { faithfulness: 0, shareOfVoice: 0, sentiment: 0, voiceAlignment: 0, hallucinationScore: 0 }
      );

      const count = results.length;
      return {
        faithfulness: Math.round(totals.faithfulness / count),
        shareOfVoice: Math.round(totals.shareOfVoice / count),
        sentiment: Math.round((totals.sentiment / count) * 100) / 100,
        voiceAlignment: Math.round(totals.voiceAlignment / count),
        hallucinationScore: Math.round(totals.hallucinationScore / count),
      };
    };

    const metrics1 = calculateMetricAverages(scan1.results);
    const metrics2 = calculateMetricAverages(scan2.results);

    const metricChanges: Record<string, MetricComparison> = {};
    for (const metric of Object.keys(metrics1) as Array<keyof typeof metrics1>) {
      const current = metrics2[metric];
      const previous = metrics1[metric];
      metricChanges[metric] = {
        current,
        previous,
        change: current - previous,
        changePercent: previous ? ((current - previous) / Math.abs(previous)) * 100 : 0,
        improved: metric === 'sentiment' ? current > previous : current > previous,
      };
    }

    // Calculate platform changes
    const calculatePlatformScores = (results: typeof scan1.results) => {
      const scores: Record<string, { total: number; count: number }> = {};
      for (const r of results || []) {
        if (!scores[r.platform]) {
          scores[r.platform] = { total: 0, count: 0 };
        }
        const avgScore =
          ((r.faithfulnessScore || 0) +
            (r.shareOfVoice || 0) +
            (((r.overallSentiment || 0) + 1) / 2) * 100 +
            (r.voiceAlignmentScore || 0) +
            (r.hallucinationScore || 0)) /
          5;
        scores[r.platform].total += avgScore;
        scores[r.platform].count++;
      }
      const result: Record<string, number> = {};
      for (const [platform, data] of Object.entries(scores)) {
        result[platform] = Math.round(data.total / data.count);
      }
      return result;
    };

    const platformScores1 = calculatePlatformScores(scan1.results);
    const platformScores2 = calculatePlatformScores(scan2.results);

    const allPlatforms = new Set([
      ...Object.keys(platformScores1),
      ...Object.keys(platformScores2),
    ]);

    const platformChanges: PlatformComparison[] = [];
    for (const platform of allPlatforms) {
      platformChanges.push({
        platform,
        current: platformScores2[platform] || 0,
        previous: platformScores1[platform] || 0,
        change: (platformScores2[platform] || 0) - (platformScores1[platform] || 0),
      });
    }

    // Calculate category changes
    const calculateCategoryScores = (results: typeof scan1.results) => {
      const scores: Record<string, { total: number; count: number }> = {};
      for (const r of results || []) {
        const category = r.prompt?.category || 'unknown';
        if (!scores[category]) {
          scores[category] = { total: 0, count: 0 };
        }
        const avgScore =
          ((r.faithfulnessScore || 0) +
            (r.shareOfVoice || 0) +
            (((r.overallSentiment || 0) + 1) / 2) * 100 +
            (r.voiceAlignmentScore || 0) +
            (r.hallucinationScore || 0)) /
          5;
        scores[category].total += avgScore;
        scores[category].count++;
      }
      const result: Record<string, number> = {};
      for (const [category, data] of Object.entries(scores)) {
        result[category] = Math.round(data.total / data.count);
      }
      return result;
    };

    const categoryScores1 = calculateCategoryScores(scan1.results);
    const categoryScores2 = calculateCategoryScores(scan2.results);

    const allCategories = new Set([
      ...Object.keys(categoryScores1),
      ...Object.keys(categoryScores2),
    ]);

    const categoryChanges: CategoryComparison[] = [];
    for (const category of allCategories) {
      categoryChanges.push({
        category,
        current: categoryScores2[category] || 0,
        previous: categoryScores1[category] || 0,
        change: (categoryScores2[category] || 0) - (categoryScores1[category] || 0),
      });
    }

    // Get new and resolved insights between scans
    const insights1 = await prisma.perceptionInsight.findMany({
      where: {
        brand360Id: scan1.brand360Id,
        createdAt: { lte: scan1.completedAt || scan1.createdAt },
      },
      select: { id: true, title: true, category: true, priority: true, status: true },
    });

    const insights2 = await prisma.perceptionInsight.findMany({
      where: {
        brand360Id: scan2.brand360Id,
        createdAt: { lte: scan2.completedAt || scan2.createdAt },
      },
      select: { id: true, title: true, category: true, priority: true, status: true },
    });

    type InsightItem = { id: string; title: string; category: string; priority: string; status: string };
    const insight1Ids = new Set(insights1.map((i: InsightItem) => i.id));
    const newInsights = insights2.filter((i: InsightItem) => !insight1Ids.has(i.id));

    const openInsight1Ids = new Set(
      insights1.filter((i: InsightItem) => i.status === 'open' || i.status === 'in_progress').map((i: InsightItem) => i.id)
    );
    const resolvedInsights = insights2.filter(
      (i: InsightItem) => openInsight1Ids.has(i.id) && (i.status === 'resolved' || i.status === 'dismissed')
    );

    // Quadrant change
    const quadrantChange = {
      previous: scan1.quadrantPosition,
      current: scan2.quadrantPosition,
      changed: scan1.quadrantPosition !== scan2.quadrantPosition,
    };

    return NextResponse.json({
      success: true,
      data: {
        comparison: {
          scan1: {
            id: scan1.id,
            createdAt: scan1.createdAt,
            completedAt: scan1.completedAt,
            overallScore: scan1.overallScore,
            quadrantPosition: scan1.quadrantPosition,
            resultCount: scan1.results?.length || 0,
          },
          scan2: {
            id: scan2.id,
            createdAt: scan2.createdAt,
            completedAt: scan2.completedAt,
            overallScore: scan2.overallScore,
            quadrantPosition: scan2.quadrantPosition,
            resultCount: scan2.results?.length || 0,
          },
          overallScoreChange,
          quadrantChange,
          metricChanges,
          platformChanges,
          categoryChanges,
          insights: {
            new: newInsights,
            resolved: resolvedInsights,
            newCount: newInsights.length,
            resolvedCount: resolvedInsights.length,
          },
        },
      },
    });
  } catch (error: unknown) {
    console.error('[Compare Scans API] POST Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to compare scans',
        message: errorMessage,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
