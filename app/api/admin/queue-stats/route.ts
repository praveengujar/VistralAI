/**
 * Queue Statistics API Route
 * GET /api/admin/queue-stats
 *
 * Provides queue statistics for monitoring and debugging
 * Uses in-memory queue (Bull/Redis support removed)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getQueueService } from '@/lib/services/queue/QueueFactory';

export async function GET(request: NextRequest) {
  try {
    const queue = await getQueueService();
    const stats = await queue.getQueueStats();

    return NextResponse.json(
      {
        queueType: 'memory',
        timestamp: new Date(),
        stats,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[QueueStats API] Error:', message);

    return NextResponse.json(
      { error: 'Failed to fetch queue statistics' },
      { status: 500 }
    );
  }
}
