import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { PrismaClient } from '@prisma/client';

// Type for perception scan result with prompt relation
interface ScanResultItem {
  id: string;
  promptId: string;
  prompt: { renderedPrompt: string; category: string } | null;
  platform: string;
  model: string;
  response: string;
  responseTime: number | null;
  tokensUsed: number | null;
  faithfulnessScore: number | null;
  faithfulnessErrors: unknown;
  shareOfVoice: number | null;
  brandMentioned: boolean | null;
  brandPosition: number | null;
  competitorsMentioned: string[];
  overallSentiment: number | null;
  aspectSentiments: unknown;
  voiceAlignmentScore: number | null;
  voiceDeviations: unknown;
  hallucinationScore: number | null;
  hallucinations: unknown;
  keyThemes: string[];
  missingInformation: string[];
  opportunities: string[];
}

// Type for perception insight
interface InsightItem {
  id: string;
  category: string;
  priority: string;
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  effort: string | null;
  platforms: string[];
  affectedPromptCategories: string[];
  status: string;
}

const prisma = new PrismaClient();

/**
 * GET /api/aeo/perception-scan/:scanId
 * Get a specific scan with full results
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ scanId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { scanId } = await params;

    if (!scanId) {
      return NextResponse.json(
        { error: 'Scan ID is required' },
        { status: 400 }
      );
    }

    // Validate MongoDB ObjectID format (24 character hex string)
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(scanId)) {
      return NextResponse.json(
        { error: 'Invalid scan ID format' },
        { status: 400 }
      );
    }

    const scan = await prisma.perceptionScan.findUnique({
      where: { id: scanId },
      include: {
        results: {
          include: {
            prompt: true,
          },
        },
      },
    });

    if (!scan) {
      return NextResponse.json(
        { error: 'Scan not found' },
        { status: 404 }
      );
    }

    // Get insights for this brand
    const insights = await prisma.perceptionInsight.findMany({
      where: {
        brand360Id: scan.brand360Id,
        status: { in: ['open', 'in_progress'] },
      },
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    // Aggregate scores by category
    const categoryScores: Record<string, { total: number; count: number }> = {};
    const platformScores: Record<string, { total: number; count: number }> = {};

    for (const result of scan.results) {
      const category = result.prompt?.category || 'unknown';
      if (!categoryScores[category]) {
        categoryScores[category] = { total: 0, count: 0 };
      }
      const overallScore =
        (result.faithfulnessScore || 0) * 0.25 +
        (result.shareOfVoice || 0) * 0.25 +
        (((result.overallSentiment || 0) + 1) / 2) * 100 * 0.15 +
        (result.voiceAlignmentScore || 0) * 0.15 +
        (result.hallucinationScore || 0) * 0.2;
      categoryScores[category].total += overallScore;
      categoryScores[category].count += 1;

      const platform = result.platform;
      if (!platformScores[platform]) {
        platformScores[platform] = { total: 0, count: 0 };
      }
      platformScores[platform].total += overallScore;
      platformScores[platform].count += 1;
    }

    // Calculate averages
    const categoryAverages: Record<string, number> = {};
    for (const [cat, data] of Object.entries(categoryScores)) {
      categoryAverages[cat] = Math.round(data.total / data.count);
    }

    const platformAverages: Record<string, number> = {};
    for (const [plat, data] of Object.entries(platformScores)) {
      platformAverages[plat] = Math.round(data.total / data.count);
    }

    // Transform results for response
    const transformedResults = scan.results.map((result: ScanResultItem) => ({
      id: result.id,
      promptId: result.promptId,
      prompt: result.prompt?.renderedPrompt,
      promptCategory: result.prompt?.category,
      platform: result.platform,
      model: result.model,
      response: result.response,
      responseTime: result.responseTime,
      tokensUsed: result.tokensUsed,
      metrics: {
        faithfulnessScore: result.faithfulnessScore,
        faithfulnessErrors: result.faithfulnessErrors,
        shareOfVoice: result.shareOfVoice,
        brandMentioned: result.brandMentioned,
        brandPosition: result.brandPosition,
        competitorsMentioned: result.competitorsMentioned,
        overallSentiment: result.overallSentiment,
        aspectSentiments: result.aspectSentiments,
        voiceAlignmentScore: result.voiceAlignmentScore,
        voiceDeviations: result.voiceDeviations,
        hallucinationScore: result.hallucinationScore,
        hallucinations: result.hallucinations,
        keyThemes: result.keyThemes,
        missingInformation: result.missingInformation,
        opportunities: result.opportunities,
      },
    }));

    return NextResponse.json({
      success: true,
      data: {
        scan: {
          id: scan.id,
          brand360Id: scan.brand360Id,
          status: scan.status,
          platforms: scan.platforms,
          promptCount: scan.promptCount,
          completedCount: scan.completedCount,
          overallScore: scan.overallScore,
          quadrantPosition: scan.quadrantPosition,
          startedAt: scan.startedAt,
          completedAt: scan.completedAt,
          createdAt: scan.createdAt,
        },
        aggregatedScores: {
          overall: scan.overallScore,
          byPlatform: platformAverages,
          byCategory: categoryAverages,
        },
        results: transformedResults,
        insights: insights.map((i: InsightItem) => ({
          id: i.id,
          category: i.category,
          priority: i.priority,
          title: i.title,
          description: i.description,
          impact: i.impact,
          recommendation: i.recommendation,
          effort: i.effort,
          platforms: i.platforms,
          affectedPromptCategories: i.affectedPromptCategories,
          status: i.status,
        })),
        summary: {
          totalResults: scan.results.length,
          platformBreakdown: Object.fromEntries(
            scan.platforms.map((p: string) => [
              p,
              scan.results.filter((r: ScanResultItem) => r.platform === p).length,
            ])
          ),
          categoryBreakdown: categoryAverages,
        },
      },
    });
  } catch (error: unknown) {
    console.error('[Perception Scan API] GET scanId Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch scan',
        message: errorMessage,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
