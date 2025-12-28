import { NextRequest, NextResponse } from 'next/server';
import { shopifyService } from '@/lib/services/ShopifyService';

/**
 * POST /api/products/shopify/sync
 * Sync products from connected Shopify store
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

    // Start sync in background
    const syncPromise = shopifyService.syncProducts(brand360Id);

    // Return immediately with status
    // Client can poll /api/products/shopify/status for updates
    return NextResponse.json({
      success: true,
      message: 'Sync started',
      data: {
        status: 'syncing',
      },
    });

    // Note: In a production system, you'd want to:
    // 1. Use a job queue (like Bull)
    // 2. Store sync status in Redis
    // 3. Provide WebSocket updates for real-time progress
  } catch (error: any) {
    console.error('Shopify sync error:', error);
    return NextResponse.json(
      { error: 'Failed to start sync', message: error.message },
      { status: 500 }
    );
  }
}
