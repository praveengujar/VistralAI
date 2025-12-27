/**
 * Admin Review Queue API
 * GET /api/admin/review-queue - Get all pending reviews for admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { getReviewQueueService } from '@/lib/services/queue/ReviewQueueService';

export async function GET(request: NextRequest) {
  try {
    const reviewService = getReviewQueueService();

    // Get all pending reviews (admin view)
    const reviews = await reviewService.getPendingReviews();

    // Get stats
    const stats = await reviewService.getStats();

    return NextResponse.json(
      {
        reviews,
        stats,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[AdminReviewQueue API] Error:', message);

    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
