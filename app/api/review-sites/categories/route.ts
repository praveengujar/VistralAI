import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { reviewWebsiteService } from '@/lib/services/ReviewWebsiteService';

/**
 * GET /api/review-sites/categories
 * Get all review categories with their websites
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const categories = await reviewWebsiteService.getAllCategories();

    return NextResponse.json({
      success: true,
      data: {
        categories,
        total: categories.length,
      },
    });
  } catch (error: unknown) {
    console.error('[Review Sites API] GET Categories Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch categories',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/review-sites/categories
 * Create a new review category (admin only - future feature)
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
    // In the future, this could be used by admins to add custom categories
    return NextResponse.json(
      {
        success: false,
        error: 'Not implemented',
        message: 'Custom category creation is not yet supported',
      },
      { status: 501 }
    );
  } catch (error: unknown) {
    console.error('[Review Sites API] POST Categories Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create category',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
