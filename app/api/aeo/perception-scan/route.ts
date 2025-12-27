import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { PrismaClient } from '@prisma/client';
import { PerceptionScanOrchestrator } from '@/lib/services/agents/PerceptionScanOrchestrator';
import { LLMPlatform, PromptCategory } from '@/lib/services/agents/types';

// Type for scan from Prisma query with count
interface ScanItem {
  id: string;
  status: string;
  platforms: string[];
  promptCount: number;
  completedCount: number;
  overallScore: number | null;
  platformScores: unknown;
  quadrantPosition: unknown;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  _count: { results: number };
}

const prisma = new PrismaClient();

/**
 * POST /api/aeo/perception-scan
 * Start a new perception scan
 *
 * Request body:
 * - brand360Id: string (required)
 * - options?: {
 *     platforms?: LLMPlatform[] (default: ['chatgpt'])
 *     promptIds?: string[] (specific prompts to test)
 *     categories?: PromptCategory[] (filter by category)
 *     maxPrompts?: number
 *     mockExternalPlatforms?: boolean (default: true)
 *   }
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { brand360Id, options } = body;

    // Validate required fields
    if (!brand360Id) {
      return NextResponse.json(
        { error: 'Brand360 ID is required' },
        { status: 400 }
      );
    }

    // Check if there's already a running scan
    const runningScan = await prisma.perceptionScan.findFirst({
      where: {
        brand360Id,
        status: 'running',
      },
    });

    if (runningScan) {
      return NextResponse.json(
        {
          error: 'A scan is already running for this brand',
          scanId: runningScan.id,
        },
        { status: 409 }
      );
    }

    console.log('[Perception Scan API] Starting scan for:', {
      brand360Id,
      options,
    });

    // Execute the scan
    const orchestrator = new PerceptionScanOrchestrator();
    const scanOptions = {
      platforms: (options?.platforms || ['chatgpt']) as LLMPlatform[],
      promptIds: options?.promptIds,
      categories: options?.categories as PromptCategory[] | undefined,
      maxPrompts: options?.maxPrompts,
      mockExternalPlatforms: options?.mockExternalPlatforms ?? true,
    };

    const result = await orchestrator.execute(brand360Id, scanOptions);

    console.log('[Perception Scan API] Scan completed:', {
      scanId: result.scanId,
      promptCount: result.promptCount,
      completedCount: result.completedCount,
      overallScore: result.aggregatedScores.overall,
      quadrant: result.quadrantPosition,
    });

    return NextResponse.json({
      success: true,
      message: 'Perception scan completed',
      data: {
        scanId: result.scanId,
        status: result.status,
        platforms: result.platforms,
        promptCount: result.promptCount,
        completedCount: result.completedCount,
        aggregatedScores: result.aggregatedScores,
        quadrantPosition: result.quadrantPosition,
        insights: result.insights,
        startedAt: result.startedAt,
        completedAt: result.completedAt,
      },
    });
  } catch (error: unknown) {
    console.error('[Perception Scan API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Perception scan failed',
        message: errorMessage,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * GET /api/aeo/perception-scan?brand360Id=xxx
 * Get all scans for a brand
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

    if (!brand360Id) {
      return NextResponse.json(
        { error: 'Brand360 ID is required' },
        { status: 400 }
      );
    }

    const scans = await prisma.perceptionScan.findMany({
      where: { brand360Id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { results: true },
        },
      },
    });

    // Transform for response
    const transformedScans = scans.map((scan: ScanItem) => ({
      id: scan.id,
      status: scan.status,
      platforms: scan.platforms,
      promptCount: scan.promptCount,
      completedCount: scan.completedCount,
      overallScore: scan.overallScore,
      platformScores: scan.platformScores,
      quadrantPosition: scan.quadrantPosition,
      startedAt: scan.startedAt,
      completedAt: scan.completedAt,
      createdAt: scan.createdAt,
      resultCount: scan._count.results,
    }));

    return NextResponse.json({
      success: true,
      data: {
        scans: transformedScans,
        total: scans.length,
      },
    });
  } catch (error: unknown) {
    console.error('[Perception Scan API] GET Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch scans',
        message: errorMessage,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
