import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { PrismaClient } from '@prisma/client';

// Type for scan result
interface ScanResultItem {
  platform: string;
  faithfulnessScore: number | null;
  shareOfVoice: number | null;
  overallSentiment: number | null;
  voiceAlignmentScore: number | null;
  hallucinationScore: number | null;
}

// Type for platform score accumulator
type PlatformScoreAcc = Record<string, { scores: number[]; count: number }>;

// Type for scan item
interface ScanItem {
  id: string;
  createdAt: Date;
  quadrantPosition: unknown;
  overallScore: number | null;
}

const prisma = new PrismaClient();

/**
 * GET /api/aeo/reports/summary
 * Get aggregated perception summary report
 *
 * Query params:
 * - brand360Id: string (required)
 * - dateRange: '7d' | '30d' | '90d' | 'all' (default '30d')
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const brand360Id = searchParams.get('brand360Id');
    const dateRange = searchParams.get('dateRange') || '30d';

    if (!brand360Id) {
      return NextResponse.json(
        { error: 'Brand360 ID is required' },
        { status: 400 }
      );
    }

    // Calculate date filter based on range
    let dateFilter: Date | undefined;
    const now = new Date();
    switch (dateRange) {
      case '7d':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        dateFilter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        dateFilter = undefined;
        break;
      default:
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Fetch scans for the date range
    const scanWhere: Record<string, unknown> = { brand360Id };
    if (dateFilter) {
      scanWhere.createdAt = { gte: dateFilter };
    }

    const scans = await prisma.perceptionScan.findMany({
      where: scanWhere,
      orderBy: { createdAt: 'desc' },
      include: {
        results: true,
      },
    });

    // Get the latest and previous scan for comparison
    const latestScan = scans[0] || null;
    const previousScan = scans[1] || null;

    // Calculate overall score and change
    const overallScore = latestScan?.overallScore || 0;
    const previousScore = previousScan?.overallScore || 0;
    const scoreChange = latestScan ? overallScore - previousScore : 0;

    // Calculate platform breakdown from latest scan results
    const platformBreakdown: Record<string, { score: number; previousScore?: number }> = {};
    if (latestScan?.results) {
      const resultsByPlatform = latestScan.results.reduce((acc: PlatformScoreAcc, result: ScanResultItem) => {
        const platform = result.platform;
        if (!acc[platform]) {
          acc[platform] = { scores: [], count: 0 };
        }
        acc[platform].scores.push(
          ((result.faithfulnessScore || 0) + (result.shareOfVoice || 0) +
           (((result.overallSentiment || 0) + 1) / 2 * 100) + (result.voiceAlignmentScore || 0) +
           (result.hallucinationScore || 0)) / 5
        );
        acc[platform].count++;
        return acc;
      }, {} as PlatformScoreAcc);

      for (const [platform, data] of Object.entries(resultsByPlatform) as [string, { scores: number[]; count: number }][]) {
        platformBreakdown[platform] = {
          score: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
        };
      }
    }

    // Add previous scores if available
    if (previousScan?.results) {
      const prevResultsByPlatform = previousScan.results.reduce((acc: PlatformScoreAcc, result: ScanResultItem) => {
        const platform = result.platform;
        if (!acc[platform]) {
          acc[platform] = { scores: [], count: 0 };
        }
        acc[platform].scores.push(
          ((result.faithfulnessScore || 0) + (result.shareOfVoice || 0) +
           (((result.overallSentiment || 0) + 1) / 2 * 100) + (result.voiceAlignmentScore || 0) +
           (result.hallucinationScore || 0)) / 5
        );
        acc[platform].count++;
        return acc;
      }, {} as PlatformScoreAcc);

      for (const [platform, data] of Object.entries(prevResultsByPlatform) as [string, { scores: number[]; count: number }][]) {
        if (platformBreakdown[platform]) {
          platformBreakdown[platform].previousScore = Math.round(
            data.scores.reduce((a, b) => a + b, 0) / data.scores.length
          );
        }
      }
    }

    // Get category breakdown from latest scan
    const categoryBreakdown: Record<string, { score: number; count: number }> = {};
    if (latestScan?.results) {
      for (const result of latestScan.results) {
        const category = (result as { prompt?: { category?: string } }).prompt?.category || 'unknown';
        if (!categoryBreakdown[category]) {
          categoryBreakdown[category] = { score: 0, count: 0 };
        }
        const score = ((result.faithfulnessScore || 0) + (result.shareOfVoice || 0) +
          (((result.overallSentiment || 0) + 1) / 2 * 100) + (result.voiceAlignmentScore || 0) +
          (result.hallucinationScore || 0)) / 5;
        categoryBreakdown[category].score += score;
        categoryBreakdown[category].count++;
      }
      // Average the scores
      for (const category of Object.keys(categoryBreakdown)) {
        categoryBreakdown[category].score = Math.round(
          categoryBreakdown[category].score / categoryBreakdown[category].count
        );
      }
    }

    // Get top insights (open, high priority)
    const topInsights = await prisma.perceptionInsight.findMany({
      where: {
        brand360Id,
        status: { in: ['open', 'in_progress'] },
      },
      orderBy: [
        { priority: 'asc' }, // critical first
        { createdAt: 'desc' },
      ],
      take: 5,
      select: {
        id: true,
        title: true,
        category: true,
        priority: true,
        impact: true,
      },
    });

    // Get recent corrections
    const recentCorrections = await prisma.correctionWorkflow.findMany({
      where: { brand360Id },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        problemType: true,
        status: true,
        preFixScore: true,
        postFixScore: true,
        updatedAt: true,
      },
    });

    // Get quadrant history from scans
    const quadrantHistory = scans.slice(0, 10).map((scan: ScanItem) => ({
      scanId: scan.id,
      date: scan.createdAt,
      quadrantPosition: scan.quadrantPosition,
      overallScore: scan.overallScore,
    }));

    // Calculate summary statistics
    const insightCounts = await prisma.perceptionInsight.groupBy({
      by: ['status'],
      where: { brand360Id },
      _count: { status: true },
    });

    const correctionCounts = await prisma.correctionWorkflow.groupBy({
      by: ['status'],
      where: { brand360Id },
      _count: { status: true },
    });

    const insightsByStatus: Record<string, number> = {};
    for (const item of insightCounts) {
      insightsByStatus[item.status] = item._count.status;
    }

    const correctionsByStatus: Record<string, number> = {};
    for (const item of correctionCounts) {
      correctionsByStatus[item.status] = item._count.status;
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          overallScore,
          scoreChange,
          quadrantPosition: latestScan?.quadrantPosition || 'invisible',
          totalScans: scans.length,
          dateRange,
          lastScanAt: latestScan?.completedAt || latestScan?.createdAt,
        },
        platformBreakdown,
        categoryBreakdown,
        topInsights,
        recentCorrections,
        quadrantHistory,
        counts: {
          insights: insightsByStatus,
          corrections: correctionsByStatus,
        },
      },
    });
  } catch (error: unknown) {
    console.error('[Reports API] GET summary Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate summary report',
        message: errorMessage,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
