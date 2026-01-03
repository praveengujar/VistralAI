// POST /api/settings/subscription/reactivate - Reactivate a canceled subscription

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

    const subscription = await prisma.userSubscription.findFirst({
      where: {
        userId: session.user.id,
        cancelAtPeriodEnd: true,
      },
    });

    if (!subscription) {
      return NextResponse.json({ error: 'No subscription to reactivate' }, { status: 400 });
    }

    const result = await managementService.reactivateSubscription(subscription.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Your subscription has been reactivated!',
    });
  } catch (error: any) {
    console.error('Reactivate subscription error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
