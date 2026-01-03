// POST /api/settings/subscription/preview - Get proration preview

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import prisma from '@/lib/db/prisma';
import { SubscriptionManagementService } from '@/lib/services/SubscriptionManagementService';

const managementService = new SubscriptionManagementService();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { newTierId, newBillingCycle } = body;

    if (!newTierId || !newBillingCycle) {
      return NextResponse.json(
        { error: 'Missing required fields: newTierId, newBillingCycle' },
        { status: 400 }
      );
    }

    // Get user's subscription
    const subscription = await prisma.userSubscription.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ['active', 'trialing'] },
      },
      include: { tier: true },
    });

    if (!subscription) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 400 });
    }

    const preview = await managementService.getProrationPreview(
      subscription.id,
      newTierId,
      newBillingCycle
    );

    if (!preview) {
      return NextResponse.json({ error: 'Unable to calculate preview' }, { status: 400 });
    }

    // Determine if upgrade or downgrade
    const isUpgrade = managementService.isUpgrade(
      subscription.tier.name,
      subscription.billingCycle,
      newTierId,
      newBillingCycle
    );

    return NextResponse.json({
      success: true,
      data: {
        ...preview,
        isUpgrade,
        changeType: isUpgrade ? 'upgrade' : 'downgrade',
        effectiveDescription: isUpgrade
          ? 'Changes take effect immediately with proration'
          : 'Changes take effect at the end of your current billing period',
      },
    });
  } catch (error: any) {
    console.error('Proration preview error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
