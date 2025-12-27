import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { PrismaClient } from '@prisma/client';

// Type for insight from Prisma query
interface InsightItem {
  id: string;
  brand360Id: string;
  category: string;
  priority: string;
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  effort: string | null;
  platforms: string[];
  affectedPromptCategories: string[];
  status: string;
  dismissReason: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const prisma = new PrismaClient();

/**
 * GET /api/aeo/insights
 * List perception insights with filtering
 *
 * Query params:
 * - brand360Id: string (required)
 * - status: 'open' | 'in_progress' | 'resolved' | 'dismissed'
 * - priority: 'critical' | 'high' | 'medium' | 'low'
 * - category: string
 * - limit: number (default 20)
 * - offset: number (default 0)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const brand360Id = searchParams.get('brand360Id');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!brand360Id) {
      return NextResponse.json(
        { error: 'Brand360 ID is required' },
        { status: 400 }
      );
    }

    // Build where clause
    const where: Record<string, unknown> = { brand360Id };
    if (status) {
      where.status = status;
    }
    if (priority) {
      where.priority = priority;
    }
    if (category) {
      where.category = category;
    }

    // Get insights
    const [insights, total] = await Promise.all([
      prisma.perceptionInsight.findMany({
        where,
        orderBy: [
          { priority: 'asc' }, // critical first
          { createdAt: 'desc' },
        ],
        take: limit,
        skip: offset,
      }),
      prisma.perceptionInsight.count({ where }),
    ]);

    // Get breakdown by priority
    const priorityBreakdown = await prisma.perceptionInsight.groupBy({
      by: ['priority'],
      where: { brand360Id, status: { in: ['open', 'in_progress'] } },
      _count: { priority: true },
    });

    // Get breakdown by category
    const categoryBreakdown = await prisma.perceptionInsight.groupBy({
      by: ['category'],
      where: { brand360Id, status: { in: ['open', 'in_progress'] } },
      _count: { category: true },
    });

    const byPriority: Record<string, number> = {};
    for (const item of priorityBreakdown) {
      byPriority[item.priority] = item._count.priority;
    }

    const byCategory: Record<string, number> = {};
    for (const item of categoryBreakdown) {
      byCategory[item.category] = item._count.category;
    }

    return NextResponse.json({
      success: true,
      data: {
        insights: insights.map((i: InsightItem) => ({
          id: i.id,
          brand360Id: i.brand360Id,
          category: i.category,
          priority: i.priority,
          title: i.title,
          description: i.description,
          impact: i.impact,
          recommendation: i.recommendation,
          effort: i.effort,
          platforms: i.platforms,
          affectedPromptCategories: i.affectedPromptCategories,
          status: i.status,
          dismissReason: i.dismissReason,
          resolvedAt: i.resolvedAt,
          createdAt: i.createdAt,
          updatedAt: i.updatedAt,
        })),
        total,
        byPriority,
        byCategory,
        pagination: {
          limit,
          offset,
          hasMore: offset + insights.length < total,
        },
      },
    });
  } catch (error: unknown) {
    console.error('[Insights API] GET Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch insights',
        message: errorMessage,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * POST /api/aeo/insights
 * Create a manual insight
 *
 * Request body:
 * - brand360Id: string (required)
 * - category: string (required)
 * - priority: 'critical' | 'high' | 'medium' | 'low'
 * - title: string (required)
 * - description: string (required)
 * - impact: string (required)
 * - recommendation: string (required)
 * - effort: 'low' | 'medium' | 'high' (optional)
 * - platforms: string[] (optional)
 * - affectedPromptCategories: string[] (optional)
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
    const {
      brand360Id,
      category,
      priority,
      title,
      description,
      impact,
      recommendation,
      effort,
      platforms,
      affectedPromptCategories,
    } = body;

    // Validate required fields
    if (!brand360Id) {
      return NextResponse.json(
        { error: 'Brand360 ID is required' },
        { status: 400 }
      );
    }

    if (!category || !title || !description || !impact || !recommendation) {
      return NextResponse.json(
        { error: 'Missing required fields: category, title, description, impact, recommendation' },
        { status: 400 }
      );
    }

    // Validate priority
    const validPriorities = ['critical', 'high', 'medium', 'low'];
    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate effort
    const validEfforts = ['low', 'medium', 'high'];
    if (effort && !validEfforts.includes(effort)) {
      return NextResponse.json(
        { error: `Invalid effort. Must be one of: ${validEfforts.join(', ')}` },
        { status: 400 }
      );
    }

    // Check brand360 exists
    const brand360 = await prisma.brand360Profile.findUnique({
      where: { id: brand360Id },
    });

    if (!brand360) {
      return NextResponse.json(
        { error: 'Brand360 profile not found' },
        { status: 404 }
      );
    }

    const insight = await prisma.perceptionInsight.create({
      data: {
        brand360: { connect: { id: brand360Id } },
        category,
        priority: priority || 'medium',
        title,
        description,
        impact,
        recommendation,
        effort,
        platforms: platforms || [],
        affectedPromptCategories: affectedPromptCategories || [],
        currentValue: 0,
        targetValue: 100,
        unit: 'score',
        status: 'open',
      },
    });

    console.log('[Insights API] Created insight:', insight.id);

    return NextResponse.json({
      success: true,
      message: 'Insight created successfully',
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
          createdAt: insight.createdAt,
        },
      },
    });
  } catch (error: unknown) {
    console.error('[Insights API] POST Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create insight',
        message: errorMessage,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
