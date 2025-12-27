import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ExportSection {
  name: string;
  enabled: boolean;
}

/**
 * POST /api/aeo/reports/export
 * Generate a PDF or CSV export of AEO data
 *
 * Request body:
 * - brand360Id: string (required)
 * - format: 'pdf' | 'csv' (required)
 * - sections: string[] (optional) - Which sections to include
 * - dateRange: '7d' | '30d' | '90d' | 'all' (default '30d')
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { brand360Id, format, sections = ['summary', 'insights', 'corrections'], dateRange = '30d' } = body;

    if (!brand360Id) {
      return NextResponse.json(
        { error: 'Brand360 ID is required' },
        { status: 400 }
      );
    }

    const validFormats = ['pdf', 'csv'];
    if (!format || !validFormats.includes(format)) {
      return NextResponse.json(
        { error: `Invalid format. Must be one of: ${validFormats.join(', ')}` },
        { status: 400 }
      );
    }

    const validSections = ['summary', 'platforms', 'categories', 'insights', 'corrections', 'trends'];
    const invalidSections = sections.filter((s: string) => !validSections.includes(s));
    if (invalidSections.length > 0) {
      return NextResponse.json(
        { error: `Invalid sections: ${invalidSections.join(', ')}. Valid sections: ${validSections.join(', ')}` },
        { status: 400 }
      );
    }

    // Verify brand360 exists
    const brand360 = await prisma.brand360Profile.findUnique({
      where: { id: brand360Id },
      select: { id: true, brandName: true },
    });

    if (!brand360) {
      return NextResponse.json(
        { error: 'Brand360 profile not found' },
        { status: 404 }
      );
    }

    // Generate a report ID (in a real implementation, this would trigger async generation)
    const reportId = `report_${brand360Id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Calculate date filter
    let dateFilter: Date | undefined;
    const now = new Date();
    switch (dateRange) {
      case '7d':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        dateFilter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFilter = undefined;
    }

    // In a real implementation, we would:
    // 1. Queue a background job to generate the report
    // 2. Store the report metadata in the database
    // 3. Return immediately with the report ID
    // 4. The client would poll /api/aeo/reports/:reportId for status

    // For now, we'll generate inline for CSV format
    if (format === 'csv') {
      const csvData = await generateCSVReport(brand360Id, sections, dateFilter);

      return new NextResponse(csvData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${(brand360.brandName || 'brand').replace(/[^a-zA-Z0-9]/g, '_')}_aeo_report_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // For PDF, return a pending status (would be generated async)
    console.log('[Reports API] Export requested:', {
      reportId,
      brand360Id,
      format,
      sections,
      dateRange,
    });

    return NextResponse.json({
      success: true,
      message: 'Report generation started',
      data: {
        reportId,
        status: 'generating',
        format,
        sections,
        dateRange,
        estimatedTime: '30 seconds',
        checkUrl: `/api/aeo/reports/${reportId}`,
      },
    });
  } catch (error: unknown) {
    console.error('[Reports API] POST export Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate export',
        message: errorMessage,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function generateCSVReport(
  brand360Id: string,
  sections: string[],
  dateFilter?: Date
): Promise<string> {
  const rows: string[][] = [];
  const scanWhere: Record<string, unknown> = { brand360Id };
  if (dateFilter) {
    scanWhere.createdAt = { gte: dateFilter };
  }

  // Header
  rows.push(['VistralAI AEO Report']);
  rows.push(['Generated At', new Date().toISOString()]);
  rows.push([]);

  if (sections.includes('summary')) {
    rows.push(['=== SUMMARY ===']);

    const latestScan = await prisma.perceptionScan.findFirst({
      where: { brand360Id },
      orderBy: { createdAt: 'desc' },
    });

    if (latestScan) {
      rows.push(['Overall Score', String(latestScan.overallScore || 0)]);
      rows.push(['Quadrant Position', latestScan.quadrantPosition || 'unknown']);
      rows.push(['Last Scan Date', latestScan.completedAt?.toISOString() || latestScan.createdAt.toISOString()]);
    }
    rows.push([]);
  }

  if (sections.includes('insights')) {
    rows.push(['=== INSIGHTS ===']);
    rows.push(['ID', 'Category', 'Priority', 'Title', 'Status', 'Created At']);

    const insights = await prisma.perceptionInsight.findMany({
      where: { brand360Id },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    });

    for (const insight of insights) {
      rows.push([
        insight.id,
        insight.category,
        insight.priority,
        insight.title,
        insight.status,
        insight.createdAt.toISOString(),
      ]);
    }
    rows.push([]);
  }

  if (sections.includes('corrections')) {
    rows.push(['=== CORRECTIONS ===']);
    rows.push(['ID', 'Problem Type', 'Status', 'Pre-Fix Score', 'Post-Fix Score', 'Updated At']);

    const corrections = await prisma.correctionWorkflow.findMany({
      where: { brand360Id },
      orderBy: { updatedAt: 'desc' },
    });

    for (const correction of corrections) {
      rows.push([
        correction.id,
        correction.problemType,
        correction.status,
        String(correction.preFixScore || ''),
        String(correction.postFixScore || ''),
        correction.updatedAt.toISOString(),
      ]);
    }
    rows.push([]);
  }

  if (sections.includes('platforms')) {
    rows.push(['=== PLATFORM SCORES ===']);
    rows.push(['Platform', 'Average Score', 'Result Count']);

    const results = await prisma.aIPerceptionResult.findMany({
      where: scanWhere,
      select: {
        platform: true,
        faithfulnessScore: true,
        shareOfVoice: true,
        overallSentiment: true,
        voiceAlignmentScore: true,
        hallucinationScore: true,
      },
    });

    const platformScores: Record<string, { total: number; count: number }> = {};
    for (const result of results) {
      if (!platformScores[result.platform]) {
        platformScores[result.platform] = { total: 0, count: 0 };
      }
      const avgScore = ((result.faithfulnessScore || 0) + (result.shareOfVoice || 0) +
        (((result.overallSentiment || 0) + 1) / 2 * 100) + (result.voiceAlignmentScore || 0) +
        (result.hallucinationScore || 0)) / 5;
      platformScores[result.platform].total += avgScore;
      platformScores[result.platform].count++;
    }

    for (const [platform, data] of Object.entries(platformScores)) {
      rows.push([
        platform,
        String(Math.round(data.total / data.count)),
        String(data.count),
      ]);
    }
    rows.push([]);
  }

  // Convert to CSV string
  return rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
}
