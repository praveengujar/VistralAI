import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

/**
 * GET /api/brand-360/personas?brand360Id=xxx
 * Get all personas for a brand
 */
export async function GET(request: NextRequest) {
  try {
    const brand360Id = request.nextUrl.searchParams.get('brand360Id');

    if (!brand360Id) {
      return NextResponse.json(
        { error: 'brand360Id is required' },
        { status: 400 }
      );
    }

    const personas = await prisma.customerPersona.findMany({
      where: { brand360Id },
      include: {
        painPoints: true,
      },
      orderBy: { priority: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: personas,
    });
  } catch (error: any) {
    console.error('Error fetching personas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch personas', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/brand-360/personas
 * Create a new persona with pain points
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brand360Id, painPoints, ...personaData } = body;

    if (!brand360Id) {
      return NextResponse.json(
        { error: 'brand360Id is required' },
        { status: 400 }
      );
    }

    if (!personaData.name) {
      return NextResponse.json(
        { error: 'Persona name is required' },
        { status: 400 }
      );
    }

    const persona = await prisma.customerPersona.create({
      data: {
        brand360Id,
        name: personaData.name,
        title: personaData.title,
        archetype: personaData.archetype,
        avatarUrl: personaData.avatarUrl,
        type: personaData.type || 'primary',
        ageRange: personaData.ageRange,
        gender: personaData.gender,
        location: personaData.location,
        companySize: personaData.companySize,
        industry: personaData.industry,
        seniorityLevel: personaData.seniorityLevel,
        personality: personaData.personality,
        values: personaData.values || [],
        motivations: personaData.motivations || [],
        frustrations: personaData.frustrations || [],
        aspirations: personaData.aspirations || [],
        primaryGoals: personaData.primaryGoals || [],
        secondaryGoals: personaData.secondaryGoals || [],
        kpis: personaData.kpis || [],
        buyingRole: personaData.buyingRole,
        buyingCriteria: personaData.buyingCriteria || [],
        purchaseTimeline: personaData.purchaseTimeline,
        informationSources: personaData.informationSources || [],
        socialPlatforms: personaData.socialPlatforms || [],
        communities: personaData.communities || [],
        currentSolution: personaData.currentSolution,
        switchingCost: personaData.switchingCost,
        commonObjections: personaData.commonObjections || [],
        purchaseBarriers: personaData.purchaseBarriers || [],
        keyMessages: personaData.keyMessages || [],
        toneThatResonates: personaData.toneThatResonates,
        triggerWords: personaData.triggerWords || [],
        avoidWords: personaData.avoidWords || [],
        priority: personaData.priority || 1,
        revenueImpact: personaData.revenueImpact,
        strategicFit: personaData.strategicFit,
        importSource: 'manual',
        needsReview: false,
        painPoints: painPoints?.length > 0 ? {
          create: painPoints.map((pp: any) => ({
            title: pp.title,
            description: pp.description,
            category: pp.category,
            severity: pp.severity || 'medium',
            frequency: pp.frequency,
            businessImpact: pp.businessImpact,
            emotionalImpact: pp.emotionalImpact,
            currentWorkaround: pp.currentWorkaround,
            addressedByProduct: pp.addressedByProduct,
            solutionDescription: pp.solutionDescription,
          })),
        } : undefined,
      },
      include: {
        painPoints: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: persona,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating persona:', error);
    return NextResponse.json(
      { error: 'Failed to create persona', message: error.message },
      { status: 500 }
    );
  }
}
