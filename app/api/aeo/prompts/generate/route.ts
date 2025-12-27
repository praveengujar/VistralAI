import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { PrismaClient } from '@prisma/client';
import { PromptGeneratorAgent } from '@/lib/services/agents/PromptGeneratorAgent';
import { PromptCategory } from '@/lib/services/agents/types';

// Type for product item
interface ProductItem {
  name: string;
  category: string | null;
  features: string[] | null;
  benefits: string[] | null;
  useCases: string[] | null;
  isHero: boolean | null;
}

const prisma = new PrismaClient();

/**
 * POST /api/aeo/prompts/generate
 * Generate prompts for a brand based on Brand360 profile data
 *
 * Request body:
 * - brand360Id: string (required)
 * - brandName: string (required)
 * - options?: {
 *     categories?: PromptCategory[]
 *     maxPerCategory?: number
 *     regenerate?: boolean (delete existing first)
 *   }
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { brand360Id, brandName, options } = body;

    // Validate required fields
    if (!brand360Id) {
      return NextResponse.json(
        { error: 'Brand360 ID is required' },
        { status: 400 }
      );
    }

    if (!brandName) {
      return NextResponse.json(
        { error: 'Brand name is required' },
        { status: 400 }
      );
    }

    console.log('[Prompt Generate API] Starting generation for:', {
      brand360Id,
      brandName,
      options,
    });

    // Load Brand360 profile with relations
    const brand360 = await prisma.brand360Profile.findUnique({
      where: { id: brand360Id },
      include: {
        brandIdentityPrism: true,
        brandArchetype: true,
        brandVoiceProfile: true,
        competitorGraph: {
          include: {
            competitors: true,
          },
        },
        customerPersonas: true,
        products: true,
        claimLocker: {
          include: {
            claims: true,
          },
        },
        riskFactors: true,
      },
    });

    if (!brand360) {
      return NextResponse.json(
        { error: 'Brand360 profile not found' },
        { status: 404 }
      );
    }

    // If regenerate option is set, delete existing prompts
    if (options?.regenerate) {
      await prisma.generatedPrompt.deleteMany({
        where: { brand360Id },
      });
      console.log('[Prompt Generate API] Deleted existing prompts');
    }

    // Generate prompts
    const generator = new PromptGeneratorAgent();
    const generatorOptions = {
      categories: options?.categories as PromptCategory[] | undefined,
      maxPerCategory: options?.maxPerCategory,
    };

    // Transform Prisma types (null) to generator types (undefined)
    const brand360Data = {
      id: brand360.id,
      organizationId: brand360.organizationId,
      brandIdentityPrism: brand360.brandIdentityPrism ?? undefined,
      brandArchetype: brand360.brandArchetype ? {
        primaryArchetype: brand360.brandArchetype.primaryArchetype,
        secondaryArchetype: brand360.brandArchetype.secondaryArchetype ?? undefined,
      } : undefined,
      brandVoiceProfile: brand360.brandVoiceProfile ? {
        primaryTone: brand360.brandVoiceProfile.primaryTone ?? undefined,
        vocabularyLevel: brand360.brandVoiceProfile.vocabularyLevel,
      } : undefined,
      competitorGraph: brand360.competitorGraph ?? undefined,
      customerPersonas: brand360.customerPersonas,
      products: brand360.products.map((p: ProductItem) => ({
        name: p.name,
        category: p.category ?? undefined,
        features: p.features ?? undefined,
        benefits: p.benefits ?? undefined,
        useCases: p.useCases ?? undefined,
        isHero: p.isHero ?? undefined,
      })),
      claimLocker: brand360.claimLocker ?? undefined,
      riskFactors: brand360.riskFactors,
    };

    const result = await generator.generate(
      brand360Data,
      brandName,
      generatorOptions
    );

    if (!result.success || !result.data) {
      return NextResponse.json(
        {
          success: false,
          error: 'Prompt generation failed',
          message: result.errors?.join(', '),
        },
        { status: 500 }
      );
    }

    // Save prompts to database
    const savedPrompts = [];
    for (const prompt of result.data.prompts) {
      const saved = await prisma.generatedPrompt.create({
        data: {
          brand360Id,
          category: prompt.category,
          categoryLabel: prompt.categoryLabel,
          intent: prompt.intent,
          template: prompt.template,
          renderedPrompt: prompt.renderedPrompt,
          targetPersona: prompt.targetPersona,
          targetCompetitor: prompt.targetCompetitor,
          targetClaim: prompt.targetClaim,
          targetProduct: prompt.targetProduct,
          expectedThemes: prompt.expectedThemes,
          expectedTone: prompt.expectedTone,
          expectedEntities: prompt.expectedEntities,
          expectedCitations: prompt.expectedCitations,
          adversarialTwist: prompt.adversarialTwist,
          hallucinationTest: prompt.hallucinationTest,
          priority: prompt.priority,
          isCustom: prompt.isCustom,
          isActive: true,
        },
      });
      savedPrompts.push(saved);
    }

    console.log('[Prompt Generate API] Generation completed:', {
      totalGenerated: result.data.totalGenerated,
      savedCount: savedPrompts.length,
      categoryBreakdown: result.data.categoryBreakdown,
    });

    return NextResponse.json({
      success: true,
      message: 'Prompts generated successfully',
      data: {
        prompts: savedPrompts,
        categoryBreakdown: result.data.categoryBreakdown,
        totalGenerated: result.data.totalGenerated,
        personasCovered: result.data.personasCovered,
        competitorsCovered: result.data.competitorsCovered,
        productsCovered: result.data.productsCovered,
      },
    });
  } catch (error: unknown) {
    console.error('[Prompt Generate API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Prompt generation failed',
        message: errorMessage,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
