import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { reviewWebsiteService } from '@/lib/services/ReviewWebsiteService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/review-sites/auto-detect
 * Health check for the auto-detect endpoint
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Auto-detect endpoint is available. Use POST to detect categories.',
  });
}

/**
 * POST /api/review-sites/auto-detect
 * Auto-detect relevant categories for a brand
 *
 * Request body:
 * - brand360Id: string (required)
 * - applyMappings?: boolean (optional, defaults to false)
 * - minConfidence?: number (optional, defaults to 0.3)
 * - maxCategories?: number (optional, defaults to 3)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log('[Review Sites API] Auto-Detect: Unauthorized request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { brand360Id, applyMappings, minConfidence, maxCategories } = body;

    console.log('[Review Sites API] Auto-Detect: Processing request', { brand360Id, applyMappings });

    if (!brand360Id) {
      console.log('[Review Sites API] Auto-Detect: Missing brand360Id');
      return NextResponse.json(
        { error: 'Brand360 ID is required' },
        { status: 400 }
      );
    }

    // Fetch brand data for detection
    const brand360 = await prisma.brand360Profile.findUnique({
      where: { id: brand360Id },
      include: {
        products: true,
        organizationSchema: true,
      },
    });

    if (!brand360) {
      console.log(`[Review Sites API] Auto-Detect: Brand360 profile not found for id ${brand360Id}`);
      return NextResponse.json(
        { error: 'Brand360 profile not found' },
        { status: 404 }
      );
    }

    // Prepare brand data for detection
    const brandData = {
      category: brand360.products?.[0]?.category ?? undefined,
      industry: undefined, // Industry can be derived from category detection
      description: brand360.organizationSchema?.description ?? brand360.products?.[0]?.description ?? undefined,
      products: brand360.products?.map((p: { category?: string | null; description?: string | null }) => ({
        category: p.category ?? undefined,
        description: p.description ?? undefined,
      })) ?? [],
    };

    console.log('[Review Sites API] Auto-Detect: Brand data prepared', {
      category: brandData.category,
      productsCount: brandData.products.length
    });

    // Detect categories
    const detected = await reviewWebsiteService.autoDetectCategories(
      brand360Id,
      brandData
    );

    console.log(`[Review Sites API] Auto-Detect: Detected ${detected.length} categories`);

    // If applyMappings is true, create the mappings
    let mappings;
    if (applyMappings) {
      mappings = await reviewWebsiteService.autoMapBrandCategories(
        brand360Id,
        brandData,
        {
          minConfidence: minConfidence ?? 0.3,
          maxCategories: maxCategories ?? 3,
          clearExisting: true,
        }
      );
      console.log(`[Review Sites API] Auto-Detect: Applied ${mappings.length} mappings`);
    }

    return NextResponse.json({
      success: true,
      data: {
        detected,
        mappingsApplied: applyMappings ?? false,
        mappings: mappings ?? null,
        totalDetected: detected.length,
      },
    });
  } catch (error: unknown) {
    console.error('[Review Sites API] Auto-Detect Error:', error);
    console.error('[Review Sites API] Error stack:', error instanceof Error ? error.stack : 'No stack');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to auto-detect categories',
        message: errorMessage,
        debug: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
