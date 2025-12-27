/**
 * Health Check API Route
 * GET /api/health
 *
 * Returns application health status and configuration
 * Used for monitoring and deployment checks
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAppStatus } from '@/lib/config/startup';

/**
 * GET /api/health
 * Quick health check endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const status = await getAppStatus();

    return NextResponse.json(status, {
      status: status.success ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
