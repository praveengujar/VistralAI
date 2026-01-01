// API Route: GET /api/features/check
// Check if user can access a specific feature

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { subscriptionService } from '@/lib/services/SubscriptionService';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const featureName = searchParams.get('feature');

    if (!featureName) {
      return NextResponse.json(
        { success: false, error: 'Missing feature parameter' },
        { status: 400 }
      );
    }

    const result = await subscriptionService.canUseFeature(session.user.id, featureName);

    return NextResponse.json({
      success: true,
      data: {
        allowed: result.allowed,
        reason: result.reason,
        upgradeUrl: result.allowed ? null : `/pricing?upgrade=true&feature=${encodeURIComponent(featureName)}`,
      },
    });
  } catch (error) {
    console.error('Error checking feature access:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check feature access' },
      { status: 500 }
    );
  }
}
