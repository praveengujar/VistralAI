import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/aeo/corrections/:workflowId
 * Get a specific correction workflow with all details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { workflowId } = await params;

    if (!workflowId) {
      return NextResponse.json(
        { error: 'Workflow ID is required' },
        { status: 400 }
      );
    }

    const workflow = await prisma.correctionWorkflow.findUnique({
      where: { id: workflowId },
      include: {
        insight: true,
        brand360: {
          select: {
            id: true,
            brandName: true,
          },
        },
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: 'Correction workflow not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        workflow: {
          id: workflow.id,
          brand360Id: workflow.brand360Id,
          brandName: workflow.brand360.brandName,
          insightId: workflow.insightId,
          problemType: workflow.problemType,
          problemDescription: workflow.problemDescription,
          status: workflow.status,
          affectedPlatforms: workflow.affectedPlatforms,
          preFixScore: workflow.preFixScore,
          postFixScore: workflow.postFixScore,
          approvedAt: workflow.approvedAt,
          implementedAt: workflow.implementedAt,
          verifiedAt: workflow.verifiedAt,
          notes: workflow.notes,
          createdAt: workflow.createdAt,
          updatedAt: workflow.updatedAt,
        },
        fixes: {
          schemaOrgFix: workflow.schemaOrgFix,
          faqPageSuggestion: workflow.faqPageSuggestion,
          contentRecommendation: workflow.contentRecommendation,
          wikipediaEditSuggestion: workflow.wikipediaEditSuggestion,
        },
        insight: workflow.insight ? {
          id: workflow.insight.id,
          category: workflow.insight.category,
          priority: workflow.insight.priority,
          title: workflow.insight.title,
          description: workflow.insight.description,
          impact: workflow.insight.impact,
          recommendation: workflow.insight.recommendation,
        } : null,
        improvement: workflow.preFixScore && workflow.postFixScore ? {
          before: workflow.preFixScore,
          after: workflow.postFixScore,
          change: workflow.postFixScore - workflow.preFixScore,
          percentChange: ((workflow.postFixScore - workflow.preFixScore) / workflow.preFixScore * 100).toFixed(1),
        } : null,
      },
    });
  } catch (error: unknown) {
    console.error('[Corrections API] GET workflowId Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch correction workflow',
        message: errorMessage,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * PUT /api/aeo/corrections/:workflowId
 * Update a correction workflow
 *
 * Request body:
 * - status: 'suggested' | 'approved' | 'implemented' | 'verified' | 'dismissed'
 * - implementedAt: Date (optional)
 * - notes: string (optional)
 * - schemaOrgFix: string (optional - update the fix)
 * - faqPageSuggestion: string (optional)
 * - contentRecommendation: string (optional)
 * - wikipediaEditSuggestion: string (optional)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { workflowId } = await params;
    const body = await request.json();

    if (!workflowId) {
      return NextResponse.json(
        { error: 'Workflow ID is required' },
        { status: 400 }
      );
    }

    // Check if workflow exists
    const existing = await prisma.correctionWorkflow.findUnique({
      where: { id: workflowId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Correction workflow not found' },
        { status: 404 }
      );
    }

    // Validate status if provided
    if (body.status) {
      const validStatuses = ['suggested', 'approved', 'implemented', 'verified', 'dismissed'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (body.status !== undefined) {
      updateData.status = body.status;
    }
    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }
    if (body.implementedAt !== undefined) {
      updateData.implementedAt = new Date(body.implementedAt);
    }
    if (body.schemaOrgFix !== undefined) {
      updateData.schemaOrgFix = body.schemaOrgFix;
    }
    if (body.faqPageSuggestion !== undefined) {
      updateData.faqPageSuggestion = body.faqPageSuggestion;
    }
    if (body.contentRecommendation !== undefined) {
      updateData.contentRecommendation = body.contentRecommendation;
    }
    if (body.wikipediaEditSuggestion !== undefined) {
      updateData.wikipediaEditSuggestion = body.wikipediaEditSuggestion;
    }

    // Handle status-specific timestamp updates
    if (body.status === 'implemented' && !existing.implementedAt) {
      updateData.implementedAt = new Date();
    }

    const workflow = await prisma.correctionWorkflow.update({
      where: { id: workflowId },
      data: updateData,
    });

    console.log('[Corrections API] Updated workflow:', workflowId, updateData);

    return NextResponse.json({
      success: true,
      message: 'Correction workflow updated',
      data: {
        workflow: {
          id: workflow.id,
          brand360Id: workflow.brand360Id,
          problemType: workflow.problemType,
          status: workflow.status,
          implementedAt: workflow.implementedAt,
          notes: workflow.notes,
          updatedAt: workflow.updatedAt,
        },
      },
    });
  } catch (error: unknown) {
    console.error('[Corrections API] PUT workflowId Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update correction workflow',
        message: errorMessage,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * DELETE /api/aeo/corrections/:workflowId
 * Delete a correction workflow (only allowed for 'suggested' or 'dismissed' status)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { workflowId } = await params;

    if (!workflowId) {
      return NextResponse.json(
        { error: 'Workflow ID is required' },
        { status: 400 }
      );
    }

    // Check if workflow exists and is deletable
    const existing = await prisma.correctionWorkflow.findUnique({
      where: { id: workflowId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Correction workflow not found' },
        { status: 404 }
      );
    }

    const deletableStatuses = ['suggested', 'dismissed'];
    if (!deletableStatuses.includes(existing.status)) {
      return NextResponse.json(
        { error: `Cannot delete workflow with status '${existing.status}'. Only suggested or dismissed workflows can be deleted.` },
        { status: 400 }
      );
    }

    await prisma.correctionWorkflow.delete({
      where: { id: workflowId },
    });

    console.log('[Corrections API] Deleted workflow:', workflowId);

    return NextResponse.json({
      success: true,
      message: 'Correction workflow deleted',
    });
  } catch (error: unknown) {
    console.error('[Corrections API] DELETE workflowId Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete correction workflow',
        message: errorMessage,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
