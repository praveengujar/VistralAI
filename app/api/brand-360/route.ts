import { NextRequest, NextResponse } from 'next/server';
import { getBrand360Data, logDbStats } from '@/lib/db';

/**
 * GET /api/brand-360?brandId=xxx
 * Get complete Brand 360° profile data for a brand
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
