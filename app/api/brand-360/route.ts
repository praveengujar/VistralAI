import { NextRequest, NextResponse } from 'next/server';
import { getBrand360Data, logDbStats } from '@/lib/db';
import { getBrand360ProfileByOrganizationId } from '@/lib/db/operations/brand360-ops';

/**
 * GET /api/brand-360?brandId=xxx
 * Get complete Brand 360° profile data for a brand
 *
 * Supports both:
 * - organizationId: Looks up Brand360Profile first, falls back to legacy data
 * - brandId: Legacy lookup in old tables
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

    console.log(`[Brand360 API] Fetching data for brandId: ${brandId}`);
    logDbStats();

    // First, try to get data from the new Brand360Profile system (AEO)
    const brand360Profile = await getBrand360ProfileByOrganizationId(brandId);

    if (brand360Profile) {
      console.log(`[Brand360 API] Found Brand360Profile for organizationId: ${brandId}`);
      return NextResponse.json({ data: brand360Profile }, { status: 200 });
    }

    // Fall back to legacy Brand360Data
    const brand360Data = await getBrand360Data(brandId);

    if (!brand360Data) {
      console.log(`[Brand360 API] No data found for brandId: ${brandId}`);
      return NextResponse.json(
        { error: 'Brand 360° profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: brand360Data }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching Brand 360° data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Brand 360° data', message: error.message },
      { status: 500 }
    );
  }
}
