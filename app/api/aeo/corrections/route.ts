import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { PrismaClient } from '@prisma/client';
import { CorrectionGeneratorAgent } from '@/lib/services/agents/CorrectionGeneratorAgent';
import { Brand360GroundTruth } from '@/lib/services/agents/types';

// Type for workflow with included insight relation
interface WorkflowWithInsight {
  id: string;
  brand360Id: string;
  insightId: string | null;
  problemType: string;
  problemDescription: string;
  status: string;
  affectedPlatforms: string[];
  preFixScore: number | null;
  postFixScore: number | null;
  schemaOrgFix: unknown;
  faqPageSuggestion: unknown;
  contentRecommendation: unknown;
  wikipediaEditSuggestion: unknown;
  approvedAt: Date | null;
  implementedAt: Date | null;
  verifiedAt: Date | null;
  createdAt: Date;
  insight: {
    id: string;
    title: string;
    priority: string;
    category: string;
  } | null;
}

// Types for Brand360 relations
interface ProductItem {
  name: string;
  features: string[] | null;
  benefits: string[] | null;
}

interface ClaimItem {
  claimText: string;
  evidenceUrl: string | null;
}

interface CompetitorItem {
  name: string;
}

const prisma = new PrismaClient();

/**
 * GET /api/aeo/corrections
 * List correction workflows with optional filtering
 *
 * Query params:
 * - brand360Id: string (required)
 * - status: 'suggested' | 'approved' | 'implemented' | 'verified' | 'dismissed'
 * - problemType: 'hallucination' | 'missing_info' | 'wrong_sentiment' | 'competitor_confusion'
 * - limit: number (default 20)
 * - offset: number (default 0)
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
    const status = searchParams.get('status');
    const problemType = searchParams.get('problemType');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!brand360Id) {
      return NextResponse.json(
        { error: 'Brand360 ID is required' },
        { status: 400 }
      );
    }

    // Build where clause
    const where: Record<string, unknown> = { brand360Id };
    if (status) {
      where.status = status;
    }
    if (problemType) {
      where.problemType = problemType;
    }

    // Get workflows
    const [workflows, total] = await Promise.all([
      prisma.correctionWorkflow.findMany({
        where,
        orderBy: [
          { createdAt: 'desc' },
        ],
        take: limit,
        skip: offset,
        include: {
          insight: {
            select: {
              id: true,
              title: true,
              priority: true,
              category: true,
            },
          },
        },
      }),
      prisma.correctionWorkflow.count({ where }),
    ]);

    // Calculate status breakdown
    const statusBreakdown = await prisma.correctionWorkflow.groupBy({
      by: ['status'],
      where: { brand360Id },
      _count: { status: true },
    });

    const statusCounts: Record<string, number> = {};
    for (const item of statusBreakdown) {
      statusCounts[item.status] = item._count.status;
    }

    return NextResponse.json({
      success: true,
      data: {
        workflows: workflows.map((w: WorkflowWithInsight) => ({
          id: w.id,
          brand360Id: w.brand360Id,
          insightId: w.insightId,
          problemType: w.problemType,
          problemDescription: w.problemDescription,
          status: w.status,
          affectedPlatforms: w.affectedPlatforms,
          preFixScore: w.preFixScore,
          postFixScore: w.postFixScore,
          hasFixes: {
            schemaOrg: !!w.schemaOrgFix,
            faq: !!w.faqPageSuggestion,
            content: !!w.contentRecommendation,
            wikipedia: !!w.wikipediaEditSuggestion,
          },
          approvedAt: w.approvedAt,
          implementedAt: w.implementedAt,
          verifiedAt: w.verifiedAt,
          createdAt: w.createdAt,
          insight: w.insight,
        })),
        total,
        statusBreakdown: statusCounts,
        pagination: {
          limit,
          offset,
          hasMore: offset + workflows.length < total,
        },
      },
    });
  } catch (error: unknown) {
    console.error('[Corrections API] GET Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch corrections',
        message: errorMessage,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * POST /api/aeo/corrections
 * Create a new correction workflow and generate fix suggestions
 *
 * Request body:
 * - brand360Id: string (required)
 * - insightId: string (optional - link to perception insight)
 * - problemType: 'hallucination' | 'missing_info' | 'wrong_sentiment' | 'competitor_confusion'
 * - problemDescription: string (required)
 * - affectedPlatforms: string[] (optional)
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
    const { brand360Id, insightId, problemType, problemDescription, affectedPlatforms } = body;

    // Validate required fields
    if (!brand360Id) {
      return NextResponse.json(
        { error: 'Brand360 ID is required' },
        { status: 400 }
      );
    }

    if (!problemType) {
      return NextResponse.json(
        { error: 'Problem type is required' },
        { status: 400 }
      );
    }

    if (!problemDescription) {
      return NextResponse.json(
        { error: 'Problem description is required' },
        { status: 400 }
      );
    }

    const validProblemTypes = ['hallucination', 'missing_info', 'wrong_sentiment', 'competitor_confusion'];
    if (!validProblemTypes.includes(problemType)) {
      return NextResponse.json(
        { error: `Invalid problem type. Must be one of: ${validProblemTypes.join(', ')}` },
        { status: 400 }
      );
    }

    console.log('[Corrections API] Creating workflow for:', {
      brand360Id,
      problemType,
      insightId,
    });

    // Load Brand360 profile with relations for ground truth
    const brand360 = await prisma.brand360Profile.findUnique({
      where: { id: brand360Id },
      include: {
        brandVoiceProfile: true,
        products: true,
        claimLocker: {
          include: {
            claims: true,
          },
        },
        competitorGraph: {
          include: {
            competitors: true,
          },
        },
        riskFactors: true,
      },
    });

    if (!brand360) {
      return NextResponse.json(
        { error: 'Brand360 profile not found' },
        { status: 404 }
      );
    }

    // Get insight if provided
    let insight = null;
    if (insightId) {
      insight = await prisma.perceptionInsight.findUnique({
        where: { id: insightId },
      });
    }

    // Build ground truth for correction generation
    const groundTruth: Brand360GroundTruth = {
      brandName: brand360.brandName || 'Unknown Brand',
      products: brand360.products.map((p: ProductItem) => ({
        name: p.name,
        features: p.features || [],
        benefits: p.benefits || [],
      })),
      claims: brand360.claimLocker?.claims.map((c: ClaimItem) => ({
        claimText: c.claimText,
        evidenceUrl: c.evidenceUrl || undefined,
      })) || [],
      competitors: brand360.competitorGraph?.competitors.map((c: CompetitorItem) => ({
        name: c.name,
      })) || [],
      foundingYear: brand360.foundingYear?.toString(),
      founders: brand360.founders || [],
      values: brand360.values || [],
      voiceProfile: {
        primaryTone: brand360.brandVoiceProfile?.primaryTone || 'professional',
        vocabularyLevel: brand360.brandVoiceProfile?.vocabularyLevel || 'moderate',
        approvedPhrases: brand360.brandVoiceProfile?.approvedPhrases || [],
        bannedPhrases: brand360.brandVoiceProfile?.bannedPhrases || [],
      },
      riskFactors: brand360.riskFactors ? {
        misconceptions: brand360.riskFactors.commonMisconceptions || [],
        negativeKeywords: brand360.riskFactors.negativeKeywords || [],
      } : undefined,
    };

    // Generate corrections using the agent
    const generator = new CorrectionGeneratorAgent();
    const insightInput = insight ? {
      id: insight.id,
      category: insight.category,
      priority: insight.priority,
      title: insight.title,
      description: insight.description,
      impact: insight.impact,
      recommendation: insight.recommendation,
      platforms: insight.platforms || [],
      affectedPromptCategories: insight.affectedPromptCategories || [],
    } : {
      id: 'manual',
      category: problemType,
      priority: 'medium',
      title: `${problemType.replace('_', ' ')} issue`,
      description: problemDescription,
      impact: 'Unknown impact',
      recommendation: 'Generate corrections',
      platforms: affectedPlatforms || [],
      affectedPromptCategories: [],
    };

    const result = await generator.generateFromInsight(insightInput, groundTruth);

    if (!result.success || !result.data) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to generate corrections',
          message: result.errors?.join(', '),
        },
        { status: 500 }
      );
    }

    // Get current scan score if available
    const latestScan = await prisma.perceptionScan.findFirst({
      where: { brand360Id, status: 'completed' },
      orderBy: { completedAt: 'desc' },
    });

    // Create the workflow
    const workflow = await prisma.correctionWorkflow.create({
      data: {
        brand360Id,
        insightId: insightId || undefined,
        problemType,
        problemDescription,
        status: 'suggested',
        affectedPlatforms: result.data.affectedPlatforms,
        preFixScore: latestScan?.overallScore,
        schemaOrgFix: result.data.schemaOrgFix,
        faqPageSuggestion: result.data.faqPageSuggestion,
        contentRecommendation: result.data.contentRecommendation,
        wikipediaEditSuggestion: result.data.wikipediaEditSuggestion,
      },
    });

    console.log('[Corrections API] Created workflow:', workflow.id);

    return NextResponse.json({
      success: true,
      message: 'Correction workflow created with generated fixes',
      data: {
        workflow: {
          id: workflow.id,
          brand360Id: workflow.brand360Id,
          insightId: workflow.insightId,
          problemType: workflow.problemType,
          problemDescription: workflow.problemDescription,
          status: workflow.status,
          affectedPlatforms: workflow.affectedPlatforms,
          preFixScore: workflow.preFixScore,
          createdAt: workflow.createdAt,
        },
        suggestions: result.data.suggestions,
        generatedFixes: {
          schemaOrgFix: result.data.schemaOrgFix,
          faqPageSuggestion: result.data.faqPageSuggestion,
          contentRecommendation: result.data.contentRecommendation,
          wikipediaEditSuggestion: result.data.wikipediaEditSuggestion,
        },
      },
    });
  } catch (error: unknown) {
    console.error('[Corrections API] POST Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create correction workflow',
        message: errorMessage,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
