import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';

/**
 * GET /api/aeo/reports/:reportId
 * Check status or download a generated report
 *
 * Returns:
 * - If generating: { status: 'generating', progress: number }
 * - If ready: File download or { status: 'ready', downloadUrl: string }
 * - If failed: { status: 'failed', error: string }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { reportId } = await params;

    if (!reportId) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

    // Validate report ID format
    if (!reportId.startsWith('report_')) {
      return NextResponse.json(
        { error: 'Invalid report ID format' },
        { status: 400 }
      );
    }

    // In a real implementation, we would:
    // 1. Look up the report in the database
    // 2. Check if generation is complete
    // 3. Return the file or status

    // For now, we'll simulate the status check
    // Parse the report ID to extract timestamp
    const parts = reportId.split('_');
    if (parts.length < 3) {
      return NextResponse.json(
        { error: 'Invalid report ID' },
        { status: 400 }
      );
    }

    const timestamp = parseInt(parts[2], 10);
    if (isNaN(timestamp)) {
      return NextResponse.json(
        { error: 'Invalid report ID timestamp' },
        { status: 400 }
      );
    }

    const now = Date.now();
    const elapsed = now - timestamp;

    // Simulate generation progress (30 seconds total)
    const generationTime = 30000; // 30 seconds
    const progress = Math.min(100, Math.round((elapsed / generationTime) * 100));

    if (elapsed < generationTime) {
      // Still generating
      return NextResponse.json({
        success: true,
        data: {
          reportId,
          status: 'generating',
          progress,
          estimatedRemaining: `${Math.max(0, Math.round((generationTime - elapsed) / 1000))} seconds`,
        },
      });
    }

    // Generation complete - in reality, we'd return the file
    // For now, return a ready status with a mock download URL
    return NextResponse.json({
      success: true,
      data: {
        reportId,
        status: 'ready',
        format: 'pdf',
        fileSize: '1.2 MB',
        generatedAt: new Date(timestamp + generationTime).toISOString(),
        expiresAt: new Date(timestamp + generationTime + 24 * 60 * 60 * 1000).toISOString(),
        downloadUrl: `/api/aeo/reports/${reportId}/download`,
        message: 'Report generation is simulated. In production, this would return the actual file.',
      },
    });
  } catch (error: unknown) {
    console.error('[Reports API] GET reportId Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check report status',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/aeo/reports/:reportId
 * Delete a generated report
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { reportId } = await params;

    if (!reportId) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

    // In a real implementation, we would:
    // 1. Look up the report in the database
    // 2. Delete the file from storage
    // 3. Remove the database record

    console.log('[Reports API] Deleted report:', reportId);

    return NextResponse.json({
      success: true,
      message: 'Report deleted successfully',
    });
  } catch (error: unknown) {
    console.error('[Reports API] DELETE reportId Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete report',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
