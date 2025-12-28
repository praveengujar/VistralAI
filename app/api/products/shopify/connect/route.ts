import { NextRequest, NextResponse } from 'next/server';
import { shopifyService } from '@/lib/services/ShopifyService';

/**
 * POST /api/products/shopify/connect
 * Connect a Shopify store
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brand360Id, storeUrl, accessToken } = body;

    if (!brand360Id) {
      return NextResponse.json(
        { error: 'brand360Id is required' },
        { status: 400 }
      );
    }

    if (!storeUrl) {
      return NextResponse.json(
        { error: 'storeUrl is required' },
        { status: 400 }
      );
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: 'accessToken is required' },
        { status: 400 }
      );
    }

    const result = await shopifyService.connect(brand360Id, storeUrl, accessToken);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to connect', message: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        storeUrl: result.storeUrl,
        storeName: result.storeName,
        productCount: result.productCount,
      },
    });
  } catch (error: any) {
    console.error('Shopify connect error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to Shopify', message: error.message },
      { status: 500 }
    );
  }
}
