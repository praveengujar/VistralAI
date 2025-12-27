import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { MagicImportOrchestrator } from '@/lib/services/agents/MagicImportOrchestrator';
import { MagicImportOptions } from '@/lib/services/agents/types';

/**
 * POST /api/aeo/magic-import
 * Execute the Magic Import flow to discover and populate Brand 360 data
 *
 * Request body:
 * - organizationId: string (required)
 * - websiteUrl: string (required)
 * - brandName: string (required)
 * - options?: MagicImportOptions
 *   - skipCrawler?: boolean
 *   - skipVibeCheck?: boolean
 *   - skipCompetitors?: boolean
 *   - maxPages?: number
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
    const { organizationId, websiteUrl, brandName, options } = body;

    // Validate required fields
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    if (!websiteUrl) {
      return NextResponse.json(
        { error: 'Website URL is required' },
        { status: 400 }
      );
    }

    if (!brandName) {
      return NextResponse.json(
        { error: 'Brand name is required' },
        { status: 400 }
      );
    }

    // Normalize URL - add https:// if no protocol
    let normalizedUrl = websiteUrl;
    if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
      normalizedUrl = `https://${websiteUrl}`;
    }

    // Validate URL format
    try {
      new URL(normalizedUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    console.log('[Magic Import API] Starting import for:', {
      organizationId,
      websiteUrl: normalizedUrl,
      brandName,
      options,
    });

    // Execute Magic Import
    const orchestrator = new MagicImportOrchestrator();
    const importOptions: MagicImportOptions = {
      skipCrawler: options?.skipCrawler,
      skipVibeCheck: options?.skipVibeCheck,
      skipCompetitors: options?.skipCompetitors,
      maxPages: options?.maxPages || 3,
    };

    const result = await orchestrator.execute(
      organizationId,
      normalizedUrl,
      brandName,
      importOptions
    );

    console.log('[Magic Import API] Import completed:', {
      brand360Id: result.brand360Id,
      completionScore: result.completionScore,
      entityHealthScore: result.entityHealthScore,
      discoveries: result.discoveries,
      stagesCompleted: result.stages.filter(s => s.status === 'completed').length,
      errors: result.errors.length,
      totalDuration: result.totalDuration,
    });

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Magic Import completed successfully',
      data: {
        brand360Id: result.brand360Id,
        completionScore: result.completionScore,
        entityHealthScore: result.entityHealthScore,
        discoveries: result.discoveries,
        stages: result.stages,
        totalDuration: result.totalDuration,
      },
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error: unknown) {
    console.error('[Magic Import API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Magic Import failed',
        message: errorMessage
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/aeo/magic-import?brand360Id=xxx
 * Get the current status of a Brand 360 profile
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
    const organizationId = searchParams.get('organizationId');

    if (!brand360Id && !organizationId) {
      return NextResponse.json(
        { error: 'Either brand360Id or organizationId is required' },
        { status: 400 }
      );
    }

    // Import Prisma client inline to avoid issues
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    try {
      const profile = await prisma.brand360Profile.findFirst({
        where: brand360Id
          ? { id: brand360Id }
          : { organizationId: organizationId! },
        include: {
          entityHome: true,
          organizationSchema: true,
          brandIdentityPrism: true,
          brandArchetype: true,
          brandVoiceProfile: true,
          competitorGraph: {
            include: {
              competitors: true,
            },
          },
          customerPersonas: true,
          products: true,
          claimLocker: {
            include: {
              claims: true,
            },
          },
        },
      });

      if (!profile) {
        return NextResponse.json(
          { error: 'Brand 360 profile not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: profile,
      });
    } finally {
      await prisma.$disconnect();
    }
  } catch (error: unknown) {
    console.error('[Magic Import API] GET Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch Brand 360 profile',
        message: errorMessage
      },
      { status: 500 }
    );
  }
}
