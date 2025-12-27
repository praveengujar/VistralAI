import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/aeo/insights/:insightId/dismiss
 * Dismiss an insight with a reason
 *
 * Request body:
 * - reason: string (required) - The reason for dismissing the insight
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ insightId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { insightId } = await params;
    const body = await request.json();
    const { reason } = body;

    if (!insightId) {
      return NextResponse.json(
        { error: 'Insight ID is required' },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Dismiss reason is required' },
        { status: 400 }
      );
    }

    // Check if insight exists
    const existing = await prisma.perceptionInsight.findUnique({
      where: { id: insightId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Insight not found' },
        { status: 404 }
      );
    }

    // Check if already dismissed
    if (existing.status === 'dismissed') {
      return NextResponse.json(
        { error: 'Insight is already dismissed' },
        { status: 400 }
      );
    }

    // Update the insight to dismissed status
    const insight = await prisma.perceptionInsight.update({
      where: { id: insightId },
      data: {
        status: 'dismissed',
        dismissReason: reason.trim(),
        updatedAt: new Date(),
      },
    });

    console.log('[Insights API] Dismissed insight:', insightId, 'Reason:', reason);

    return NextResponse.json({
      success: true,
      message: 'Insight dismissed successfully',
      data: {
        insight: {
          id: insight.id,
          brand360Id: insight.brand360Id,
          category: insight.category,
          priority: insight.priority,
          title: insight.title,
          status: insight.status,
          dismissReason: insight.dismissReason,
          updatedAt: insight.updatedAt,
        },
      },
    });
  } catch (error: unknown) {
    console.error('[Insights API] POST dismiss Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to dismiss insight',
        message: errorMessage,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
