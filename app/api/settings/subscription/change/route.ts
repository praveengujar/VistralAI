// POST /api/settings/subscription/change - Change subscription (upgrade/downgrade)

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

    // Check if same plan and billing cycle
    if (subscription.tier.name === newTierId && subscription.billingCycle === newBillingCycle) {
      return NextResponse.json(
        { error: 'You are already on this plan' },
        { status: 400 }
      );
    }

    // Determine if upgrade or downgrade
    const isUpgrade = managementService.isUpgrade(
      subscription.tier.name,
      subscription.billingCycle,
      newTierId,
      newBillingCycle
    );

    let result;
    if (isUpgrade) {
      result = await managementService.upgradeSubscription(
        subscription.id,
        newTierId,
        newBillingCycle
      );
    } else {
      result = await managementService.downgradeSubscription(
        subscription.id,
        newTierId,
        newBillingCycle
      );
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        isUpgrade,
        message: isUpgrade
          ? 'Your plan has been upgraded successfully!'
          : 'Your plan change has been scheduled for the end of your billing period.',
      },
    });
  } catch (error: any) {
    console.error('Change subscription error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
