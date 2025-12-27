import { NextRequest, NextResponse } from 'next/server';
import {
  getBrandIdentityByBrandId,
  createBrandIdentity,
  updateBrandIdentity,
} from '@/lib/db';
import { BrandIdentity } from '@/types';

/**
 * GET /api/brand-360/identity?brandId=xxx
 * Get brand identity data
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

    const identity = await getBrandIdentityByBrandId(brandId);

    if (!identity) {
      return NextResponse.json(
        { error: 'Brand identity not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: identity }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching brand identity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brand identity', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/brand-360/identity
 * Create new brand identity
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandId, ...identityData } = body;

    if (!brandId) {
      return NextResponse.json(
        { error: 'Brand ID is required' },
        { status: 400 }
      );
    }

    // Check if identity already exists
    const existing = await getBrandIdentityByBrandId(brandId);
    if (existing) {
      return NextResponse.json(
        { error: 'Brand identity already exists. Use PUT to update.' },
        { status: 409 }
      );
    }

    const newIdentity = await createBrandIdentity({
      brandId,
      ...identityData,
    });

    return NextResponse.json({ data: newIdentity }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating brand identity:', error);
    return NextResponse.json(
      { error: 'Failed to create brand identity', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/brand-360/identity
 * Update existing brand identity
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Identity ID is required' },
        { status: 400 }
      );
    }

    const updated = await updateBrandIdentity(id, updates);

    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating brand identity:', error);
    return NextResponse.json(
      { error: 'Failed to update brand identity', message: error.message },
      { status: 500 }
    );
  }
}
