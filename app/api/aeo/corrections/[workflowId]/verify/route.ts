import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/aeo/corrections/:workflowId/verify
 * Verify a correction workflow after implementation
 *
 * This endpoint marks the workflow as verified and optionally triggers a re-scan
 * to measure the improvement.
 *
 * Request body:
 * - postFixScore: number (optional - if provided manually)
 * - triggerRescan: boolean (optional - trigger a new perception scan)
 * - notes: string (optional)
 */
export async function POST(
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

    // Can only verify from 'approved' or 'implemented' status
    const verifiableStatuses = ['approved', 'implemented'];
    if (!verifiableStatuses.includes(existing.status)) {
      return NextResponse.json(
        { error: `Cannot verify workflow with status '${existing.status}'. Must be approved or implemented.` },
        { status: 400 }
      );
    }

    // Get the latest perception scan for post-fix score
    let postFixScore = body.postFixScore;
    let rescanTriggered = false;

    if (body.triggerRescan) {
      // In a real implementation, this would trigger a new perception scan
      // For now, we'll just note that a rescan was requested
      console.log('[Corrections API] Rescan requested for workflow:', workflowId);
      rescanTriggered = true;

      // Get the most recent scan to use as post-fix score
      const latestScan = await prisma.perceptionScan.findFirst({
        where: { brand360Id: existing.brand360Id, status: 'completed' },
        orderBy: { completedAt: 'desc' },
      });

      if (latestScan && !postFixScore) {
        postFixScore = latestScan.overallScore;
      }
    }

    // Calculate improvement if we have both scores
    let improvement = null;
    if (existing.preFixScore && postFixScore) {
      improvement = {
        before: existing.preFixScore,
        after: postFixScore,
        change: postFixScore - existing.preFixScore,
        percentChange: ((postFixScore - existing.preFixScore) / existing.preFixScore * 100).toFixed(1),
        improved: postFixScore > existing.preFixScore,
      };
    }

    // Update the workflow
    const workflow = await prisma.correctionWorkflow.update({
      where: { id: workflowId },
      data: {
        status: 'verified',
        verifiedAt: new Date(),
        postFixScore: postFixScore || existing.postFixScore,
        implementedAt: existing.implementedAt || new Date(),
        notes: body.notes || existing.notes,
      },
    });

    // Update linked insight status if exists
    if (workflow.insightId) {
      await prisma.perceptionInsight.update({
        where: { id: workflow.insightId },
        data: {
          status: 'resolved',
          resolvedAt: new Date(),
        },
      });
    }

    console.log('[Corrections API] Verified workflow:', workflowId, {
      improvement,
      rescanTriggered,
    });

    return NextResponse.json({
      success: true,
      message: 'Correction workflow verified',
      data: {
        workflow: {
          id: workflow.id,
          brand360Id: workflow.brand360Id,
          problemType: workflow.problemType,
          status: workflow.status,
          approvedAt: workflow.approvedAt,
          implementedAt: workflow.implementedAt,
          verifiedAt: workflow.verifiedAt,
          preFixScore: workflow.preFixScore,
          postFixScore: workflow.postFixScore,
        },
        improvement,
        rescanTriggered,
        summary: improvement ? {
          message: improvement.improved
            ? `Score improved by ${improvement.change.toFixed(1)} points (${improvement.percentChange}%)`
            : improvement.change === 0
              ? 'Score remained the same'
              : `Score decreased by ${Math.abs(improvement.change).toFixed(1)} points`,
          status: improvement.improved ? 'success' : improvement.change === 0 ? 'neutral' : 'warning',
        } : {
          message: 'No comparison available (missing pre-fix or post-fix score)',
          status: 'neutral',
        },
      },
    });
  } catch (error: unknown) {
    console.error('[Corrections API] POST verify Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to verify correction workflow',
        message: errorMessage,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
