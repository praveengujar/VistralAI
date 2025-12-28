import { NextRequest, NextResponse } from 'next/server';
import { shopifyService } from '@/lib/services/ShopifyService';

/**
 * GET /api/products/shopify/status?brand360Id=xxx
 * Get Shopify connection status
 */
export async function GET(request: NextRequest) {
  try {
    const brand360Id = request.nextUrl.searchParams.get('brand360Id');

    if (!brand360Id) {
      return NextResponse.json(
        { error: 'brand360Id is required' },
        { status: 400 }
      );
    }

    const status = await shopifyService.getConnectionStatus(brand360Id);

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    console.error('Shopify status error:', error);
    return NextResponse.json(
      { error: 'Failed to get Shopify status', message: error.message },
      { status: 500 }
    );
  }
}
