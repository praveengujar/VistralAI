import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/aeo/corrections/:workflowId/approve
 * Approve a correction workflow
 *
 * Request body:
 * - approvedFixes: string[] (which fix types to approve: 'schema_org', 'faq', 'content', 'wikipedia')
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

    // Can only approve from 'suggested' status
    if (existing.status !== 'suggested') {
      return NextResponse.json(
        { error: `Cannot approve workflow with status '${existing.status}'. Only suggested workflows can be approved.` },
        { status: 400 }
      );
    }

    const validFixTypes = ['schema_org', 'faq', 'content', 'wikipedia'];
    const approvedFixes: string[] = body.approvedFixes || [];

    // Validate approved fix types
    for (const fixType of approvedFixes) {
      if (!validFixTypes.includes(fixType)) {
        return NextResponse.json(
          { error: `Invalid fix type: ${fixType}. Must be one of: ${validFixTypes.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Verify the approved fixes actually exist in the workflow
    const availableFixes: string[] = [];
    if (existing.schemaOrgFix) availableFixes.push('schema_org');
    if (existing.faqPageSuggestion) availableFixes.push('faq');
    if (existing.contentRecommendation) availableFixes.push('content');
    if (existing.wikipediaEditSuggestion) availableFixes.push('wikipedia');

    const invalidApprovals = approvedFixes.filter((f: string) => !availableFixes.includes(f));
    if (invalidApprovals.length > 0) {
      return NextResponse.json(
        { error: `Cannot approve non-existent fixes: ${invalidApprovals.join(', ')}. Available: ${availableFixes.join(', ')}` },
        { status: 400 }
      );
    }

    // If no fixes specified, approve all available
    const fixesToApprove = approvedFixes.length > 0 ? approvedFixes : availableFixes;

    // Clear out non-approved fixes if specific ones were selected
    const updateData: Record<string, unknown> = {
      status: 'approved',
      approvedAt: new Date(),
      notes: body.notes || existing.notes,
    };

    if (approvedFixes.length > 0) {
      // Only keep approved fixes
      if (!approvedFixes.includes('schema_org')) {
        updateData.schemaOrgFix = null;
      }
      if (!approvedFixes.includes('faq')) {
        updateData.faqPageSuggestion = null;
      }
      if (!approvedFixes.includes('content')) {
        updateData.contentRecommendation = null;
      }
      if (!approvedFixes.includes('wikipedia')) {
        updateData.wikipediaEditSuggestion = null;
      }
    }

    const workflow = await prisma.correctionWorkflow.update({
      where: { id: workflowId },
      data: updateData,
    });

    // Update linked insight status if exists
    if (workflow.insightId) {
      await prisma.perceptionInsight.update({
        where: { id: workflow.insightId },
        data: { status: 'in_progress' },
      });
    }

    console.log('[Corrections API] Approved workflow:', workflowId, {
      approvedFixes: fixesToApprove,
    });

    return NextResponse.json({
      success: true,
      message: 'Correction workflow approved',
      data: {
        workflow: {
          id: workflow.id,
          brand360Id: workflow.brand360Id,
          problemType: workflow.problemType,
          status: workflow.status,
          approvedAt: workflow.approvedAt,
          approvedFixes: fixesToApprove,
        },
        nextSteps: [
          'Implement the approved fixes on your website/platforms',
          'Once implemented, call the verify endpoint to measure improvement',
        ],
      },
    });
  } catch (error: unknown) {
    console.error('[Corrections API] POST approve Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to approve correction workflow',
        message: errorMessage,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
