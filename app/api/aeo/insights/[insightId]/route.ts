import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/aeo/insights/:insightId
 * Get a specific insight with details
 */
export async function GET(
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

    if (!insightId) {
      return NextResponse.json(
        { error: 'Insight ID is required' },
        { status: 400 }
      );
    }

    const insight = await prisma.perceptionInsight.findUnique({
      where: { id: insightId },
      include: {
        correctionWorkflow: {
          select: {
            id: true,
            status: true,
            problemType: true,
            createdAt: true,
          },
        },
      },
    });

    if (!insight) {
      return NextResponse.json(
        { error: 'Insight not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        insight: {
          id: insight.id,
          brand360Id: insight.brand360Id,
          category: insight.category,
          priority: insight.priority,
          title: insight.title,
          description: insight.description,
          impact: insight.impact,
          recommendation: insight.recommendation,
          effort: insight.effort,
          platforms: insight.platforms,
          affectedPromptCategories: insight.affectedPromptCategories,
          status: insight.status,
          dismissReason: insight.dismissReason,
          resolvedAt: insight.resolvedAt,
          createdAt: insight.createdAt,
          updatedAt: insight.updatedAt,
        },
        correctionWorkflow: insight.correctionWorkflow,
      },
    });
  } catch (error: unknown) {
    console.error('[Insights API] GET insightId Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch insight',
        message: errorMessage,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * PUT /api/aeo/insights/:insightId
 * Update an insight
 *
 * Request body:
 * - status: 'open' | 'in_progress' | 'resolved' | 'dismissed'
 * - priority: 'critical' | 'high' | 'medium' | 'low'
 * - notes: string
 * - effort: 'low' | 'medium' | 'high'
 */
export async function PUT(
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

    if (!insightId) {
      return NextResponse.json(
        { error: 'Insight ID is required' },
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

    // Validate status
    if (body.status) {
      const validStatuses = ['open', 'in_progress', 'resolved', 'dismissed'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Validate priority
    if (body.priority) {
      const validPriorities = ['critical', 'high', 'medium', 'low'];
      if (!validPriorities.includes(body.priority)) {
        return NextResponse.json(
          { error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Validate effort
    if (body.effort) {
      const validEfforts = ['low', 'medium', 'high'];
      if (!validEfforts.includes(body.effort)) {
        return NextResponse.json(
          { error: `Invalid effort. Must be one of: ${validEfforts.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === 'resolved' && !existing.resolvedAt) {
        updateData.resolvedAt = new Date();
      }
    }
    if (body.priority !== undefined) {
      updateData.priority = body.priority;
    }
    if (body.effort !== undefined) {
      updateData.effort = body.effort;
    }
    if (body.title !== undefined) {
      updateData.title = body.title;
    }
    if (body.description !== undefined) {
      updateData.description = body.description;
    }
    if (body.impact !== undefined) {
      updateData.impact = body.impact;
    }
    if (body.recommendation !== undefined) {
      updateData.recommendation = body.recommendation;
    }

    const insight = await prisma.perceptionInsight.update({
      where: { id: insightId },
      data: updateData,
    });

    console.log('[Insights API] Updated insight:', insightId, updateData);

    return NextResponse.json({
      success: true,
      message: 'Insight updated successfully',
      data: {
        insight: {
          id: insight.id,
          brand360Id: insight.brand360Id,
          category: insight.category,
          priority: insight.priority,
          title: insight.title,
          status: insight.status,
          effort: insight.effort,
          resolvedAt: insight.resolvedAt,
          updatedAt: insight.updatedAt,
        },
      },
    });
  } catch (error: unknown) {
    console.error('[Insights API] PUT insightId Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update insight',
        message: errorMessage,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * DELETE /api/aeo/insights/:insightId
 * Delete an insight (only if not linked to corrections)
 */
export async function DELETE(
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

    if (!insightId) {
      return NextResponse.json(
        { error: 'Insight ID is required' },
        { status: 400 }
      );
    }

    // Check if insight exists and has linked corrections
    const existing = await prisma.perceptionInsight.findUnique({
      where: { id: insightId },
      include: {
        correctionWorkflow: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Insight not found' },
        { status: 404 }
      );
    }

    if (existing.correctionWorkflow) {
      return NextResponse.json(
        { error: 'Cannot delete insight with linked correction workflow. Dismiss the insight instead.' },
        { status: 400 }
      );
    }

    await prisma.perceptionInsight.delete({
      where: { id: insightId },
    });

    console.log('[Insights API] Deleted insight:', insightId);

    return NextResponse.json({
      success: true,
      message: 'Insight deleted successfully',
    });
  } catch (error: unknown) {
    console.error('[Insights API] DELETE insightId Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete insight',
        message: errorMessage,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
