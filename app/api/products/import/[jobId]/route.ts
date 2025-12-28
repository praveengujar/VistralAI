import { NextRequest, NextResponse } from 'next/server';
import { productImportService } from '@/lib/services/ProductImportService';

interface RouteParams {
  params: Promise<{ jobId: string }>;
}

/**
 * GET /api/products/import/[jobId]
 * Get import job status and progress
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const jobProgress = await productImportService.getImportJob(jobId);

    if (!jobProgress) {
      return NextResponse.json(
        { error: 'Import job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: jobProgress,
    });
  } catch (error: any) {
    console.error('Error fetching import job:', error);
    return NextResponse.json(
      { error: 'Failed to fetch import job', message: error.message },
      { status: 500 }
    );
  }
}
