import { NextRequest, NextResponse } from 'next/server';
import { shopifyService } from '@/lib/services/ShopifyService';

/**
 * POST /api/products/shopify/disconnect
 * Disconnect a Shopify store
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brand360Id } = body;

    if (!brand360Id) {
      return NextResponse.json(
        { error: 'brand360Id is required' },
        { status: 400 }
      );
    }

    const success = await shopifyService.disconnect(brand360Id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to disconnect' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Shopify store disconnected successfully',
    });
  } catch (error: any) {
    console.error('Shopify disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect from Shopify', message: error.message },
      { status: 500 }
    );
  }
}
