import { NextRequest, NextResponse } from 'next/server';
import {
  getCompetitorsByBrandId,
  createCompetitorProfile,
  updateCompetitorProfile,
  deleteCompetitorProfile,
} from '@/lib/db';

/**
 * GET /api/brand-360/competitors?brandId=xxx
 * Get all competitors for a brand
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

    const competitors = await getCompetitorsByBrandId(brandId);

    return NextResponse.json({ data: competitors }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching competitors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch competitors', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/brand-360/competitors
 * Create new competitor profile
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandId, ...competitorData } = body;

    if (!brandId) {
      return NextResponse.json(
        { error: 'Brand ID is required' },
        { status: 400 }
      );
    }

    if (!competitorData.name || !competitorData.domain) {
      return NextResponse.json(
        { error: 'Competitor name and domain are required' },
        { status: 400 }
      );
    }

    const newCompetitor = await createCompetitorProfile({
      brandId,
      isPrimary: competitorData.isPrimary || false,
      strengths: competitorData.strengths || [],
      weaknesses: competitorData.weaknesses || [],
      differentiators: competitorData.differentiators || [],
      ...competitorData,
    });

    return NextResponse.json({ data: newCompetitor }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating competitor:', error);
    return NextResponse.json(
      { error: 'Failed to create competitor', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/brand-360/competitors
 * Update existing competitor profile
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Competitor ID is required' },
        { status: 400 }
      );
    }

    const updated = await updateCompetitorProfile(id, updates);

    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating competitor:', error);
    return NextResponse.json(
      { error: 'Failed to update competitor', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/brand-360/competitors?id=xxx
 * Delete a competitor profile
 */
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Competitor ID is required' },
        { status: 400 }
      );
    }

    const deleted = await deleteCompetitorProfile(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Competitor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Competitor deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting competitor:', error);
    return NextResponse.json(
      { error: 'Failed to delete competitor', message: error.message },
      { status: 500 }
    );
  }
}
