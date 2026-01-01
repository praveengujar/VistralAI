import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { reviewWebsiteService } from '@/lib/services/ReviewWebsiteService';

/**
 * GET /api/review-sites/brand-mapping?brand360Id=xxx
 * Get a brand's category mappings
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

    const mappings = await reviewWebsiteService.getBrandCategories(brand360Id);
    const relevantWebsites = await reviewWebsiteService.getRelevantWebsites(brand360Id);

    return NextResponse.json({
      success: true,
      data: {
        mappings,
        relevantWebsites,
        totalMappings: mappings.length,
        totalWebsites: relevantWebsites.length,
      },
    });
  } catch (error: unknown) {
    console.error('[Review Sites API] GET Brand Mapping Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch brand mappings',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/review-sites/brand-mapping
 * Map a brand to a category
 *
 * Request body:
 * - brand360Id: string (required)
 * - categoryId: string (required)
 * - isPrimary?: boolean
 * - confidence?: number
 * - source?: 'manual' | 'auto' | 'ai'
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
    const { brand360Id, categoryId, isPrimary, confidence, source } = body;

    if (!brand360Id) {
      return NextResponse.json(
        { error: 'Brand360 ID is required' },
        { status: 400 }
      );
    }

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const mapping = await reviewWebsiteService.mapBrandToCategory(
      brand360Id,
      categoryId,
      {
        isPrimary,
        confidence,
        source: source || 'manual',
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Brand mapped to category',
      data: mapping,
    });
  } catch (error: unknown) {
    console.error('[Review Sites API] POST Brand Mapping Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create brand mapping',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/review-sites/brand-mapping?brand360Id=xxx&categoryId=xxx
 * Remove a brand's category mapping
 */
export async function DELETE(request: NextRequest) {
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
    const categoryId = searchParams.get('categoryId');

    if (!brand360Id) {
      return NextResponse.json(
        { error: 'Brand360 ID is required' },
        { status: 400 }
      );
    }

    if (categoryId) {
      // Delete specific mapping
      await reviewWebsiteService.removeBrandCategory(brand360Id, categoryId);
      return NextResponse.json({
        success: true,
        message: 'Category mapping removed',
      });
    } else {
      // Delete all mappings for the brand
      await reviewWebsiteService.removeAllBrandCategories(brand360Id);
      return NextResponse.json({
        success: true,
        message: 'All category mappings removed',
      });
    }
  } catch (error: unknown) {
    console.error('[Review Sites API] DELETE Brand Mapping Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete brand mapping',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
