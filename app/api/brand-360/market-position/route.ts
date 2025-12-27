import { NextRequest, NextResponse } from 'next/server';
import {
  getMarketPositionByBrandId,
  createMarketPosition,
  updateMarketPosition,
} from '@/lib/db';

/**
 * GET /api/brand-360/market-position?brandId=xxx
 * Get market position data
 */
export async function GET(request: NextRequest) {
  try {
    const brandId = request.nextUrl.searchParams.get('brandId');

    if (!brandId) {
      return NextResponse.json(
        { error: 'Brand ID is required' },
        { status: 400 }
      );
    }

    const marketPosition = await getMarketPositionByBrandId(brandId);

    if (!marketPosition) {
      return NextResponse.json(
        { error: 'Market position not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: marketPosition }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching market position:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market position', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/brand-360/market-position
 * Create new market position
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandId, ...positionData } = body;

    if (!brandId) {
      return NextResponse.json(
        { error: 'Brand ID is required' },
        { status: 400 }
      );
    }

    // Check if market position already exists
    const existing = await getMarketPositionByBrandId(brandId);
    if (existing) {
      return NextResponse.json(
        { error: 'Market position already exists. Use PUT to update.' },
        { status: 409 }
      );
    }

    const newPosition = await createMarketPosition({
      brandId,
      targetAudiences: positionData.targetAudiences || [],
      ...positionData,
    });

    return NextResponse.json({ data: newPosition }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating market position:', error);
    return NextResponse.json(
      { error: 'Failed to create market position', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/brand-360/market-position
 * Update existing market position
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Market position ID is required' },
        { status: 400 }
      );
    }

    const updated = await updateMarketPosition(id, updates);

    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating market position:', error);
    return NextResponse.json(
      { error: 'Failed to update market position', message: error.message },
      { status: 500 }
    );
  }
}
