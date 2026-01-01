// GET /api/settings/subscription - Get current subscription details

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import prisma from '@/lib/db/prisma';
import { SubscriptionService } from '@/lib/services/SubscriptionService';

const subscriptionService = new SubscriptionService();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await prisma.userSubscription.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ['active', 'trialing', 'past_due'] },
      },
      include: {
        tier: true,
        scheduledChange: true,
      },
    });

    if (!subscription) {
      return NextResponse.json({
        success: true,
        data: { subscription: null, usage: null },
      });
    }

    // Get usage stats
    const usage = await subscriptionService.getUsageStats(session.user.id);

    // Get scheduled tier if any
    let scheduledTier = null;
    if (subscription.scheduledTierId) {
      scheduledTier = await prisma.pricingTier.findUnique({
        where: { id: subscription.scheduledTierId },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        subscription: {
          ...subscription,
          scheduledTier,
        },
        usage,
      },
    });
  } catch (error: any) {
    console.error('Get subscription error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
