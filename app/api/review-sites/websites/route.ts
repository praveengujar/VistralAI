import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { reviewWebsiteService } from '@/lib/services/ReviewWebsiteService';

/**
 * GET /api/review-sites/websites?categoryId=xxx
 * Get websites, optionally filtered by category
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
    const categoryId = searchParams.get('categoryId');

    let websites;
    if (categoryId) {
      websites = await reviewWebsiteService.getWebsitesByCategory(categoryId);
    } else {
      websites = await reviewWebsiteService.getAllActiveWebsites();
    }

    return NextResponse.json({
      success: true,
      data: {
        websites,
        total: websites.length,
        categoryId: categoryId || null,
      },
    });
  } catch (error: unknown) {
    console.error('[Review Sites API] GET Websites Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch websites',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/review-sites/websites
 * Create a new review website (admin only - future feature)
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

    // For now, return not implemented
    return NextResponse.json(
      {
        success: false,
        error: 'Not implemented',
        message: 'Custom website creation is not yet supported',
      },
      { status: 501 }
    );
  } catch (error: unknown) {
    console.error('[Review Sites API] POST Websites Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create website',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
