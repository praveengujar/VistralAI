import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { PrismaClient } from '@prisma/client';

// Type for prompt item
interface PromptItem {
  id: string;
  category: string;
  [key: string]: unknown;
}

// Type for grouped prompts
type GroupedPrompts = Record<string, PromptItem[]>;

const prisma = new PrismaClient();

/**
 * GET /api/aeo/prompts?brand360Id=xxx&category=xxx
 * Get prompts for a brand, optionally filtered by category
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
    const category = searchParams.get('category');

    if (!brand360Id) {
      return NextResponse.json(
        { error: 'Brand360 ID is required' },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = {
      brand360Id,
      isActive: true,
    };

    if (category) {
      where.category = category;
    }

    const prompts = await prisma.generatedPrompt.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { priority: 'desc' },
      ],
    });

    // Group by category for easier consumption
    const grouped = prompts.reduce((acc: GroupedPrompts, prompt: PromptItem) => {
      if (!acc[prompt.category]) {
        acc[prompt.category] = [];
      }
      acc[prompt.category].push(prompt);
      return acc;
    }, {} as GroupedPrompts);

    return NextResponse.json({
      success: true,
      data: {
        prompts,
        grouped,
        total: prompts.length,
        categories: Object.keys(grouped),
      },
    });
  } catch (error: unknown) {
    console.error('[Prompts API] GET Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch prompts',
        message: errorMessage,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * POST /api/aeo/prompts
 * Create a custom prompt
 *
 * Request body:
 * - brand360Id: string (required)
 * - category: string (required)
 * - renderedPrompt: string (required)
 * - template?: string
 * - intent?: string
 * - expectedThemes?: string[]
 * - expectedTone?: string
 * - expectedEntities?: string[]
 * - expectedCitations?: boolean
 * - priority?: number
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
      renderedPrompt,
      template,
      intent,
      expectedThemes,
      expectedTone,
      expectedEntities,
      expectedCitations,
      priority,
      targetPersona,
      targetCompetitor,
      targetProduct,
    } = body;

    // Validate required fields
    if (!brand360Id) {
      return NextResponse.json(
        { error: 'Brand360 ID is required' },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      );
    }

    if (!renderedPrompt) {
      return NextResponse.json(
        { error: 'Prompt text is required' },
        { status: 400 }
      );
    }

    // Category labels
    const categoryLabels: Record<string, string> = {
      navigational: 'The Who',
      functional: 'The How',
      comparative: 'The Which',
      voice: 'The Vibe',
      adversarial: 'The Risk',
    };

    const prompt = await prisma.generatedPrompt.create({
      data: {
        brand360Id,
        category,
        categoryLabel: categoryLabels[category] || category,
        intent: intent || 'informational',
        template: template || renderedPrompt,
        renderedPrompt,
        expectedThemes: expectedThemes || [],
        expectedTone,
        expectedEntities: expectedEntities || [],
        expectedCitations: expectedCitations || false,
        hallucinationTest: false,
        priority: priority || 5,
        isCustom: true,
        isActive: true,
        targetPersona,
        targetCompetitor,
        targetProduct,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Custom prompt created',
      data: prompt,
    });
  } catch (error: unknown) {
    console.error('[Prompts API] POST Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create prompt',
        message: errorMessage,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * DELETE /api/aeo/prompts?promptId=xxx
 * Delete a prompt
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const promptId = searchParams.get('promptId');

    if (!promptId) {
      return NextResponse.json(
        { error: 'Prompt ID is required' },
        { status: 400 }
      );
    }

    // Soft delete by setting isActive to false
    await prisma.generatedPrompt.update({
      where: { id: promptId },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: 'Prompt deleted',
    });
  } catch (error: unknown) {
    console.error('[Prompts API] DELETE Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete prompt',
        message: errorMessage,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
