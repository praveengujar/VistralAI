import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/brand-360/personas/[id]
 * Get a single persona by ID
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const persona = await prisma.customerPersona.findUnique({
      where: { id },
      include: {
        painPoints: true,
      },
    });

    if (!persona) {
      return NextResponse.json(
        { error: 'Persona not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: persona,
    });
  } catch (error: any) {
    console.error('Error fetching persona:', error);
    return NextResponse.json(
      { error: 'Failed to fetch persona', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/brand-360/personas/[id]
 * Update a persona and its pain points
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { painPoints, ...personaData } = body;

    // Update persona
    const persona = await prisma.customerPersona.update({
      where: { id },
      data: {
        name: personaData.name,
        title: personaData.title,
        archetype: personaData.archetype,
        avatarUrl: personaData.avatarUrl,
        type: personaData.type,
        ageRange: personaData.ageRange,
        gender: personaData.gender,
        location: personaData.location,
        companySize: personaData.companySize,
        industry: personaData.industry,
        seniorityLevel: personaData.seniorityLevel,
        personality: personaData.personality,
        values: personaData.values,
        motivations: personaData.motivations,
        frustrations: personaData.frustrations,
        aspirations: personaData.aspirations,
        primaryGoals: personaData.primaryGoals,
        secondaryGoals: personaData.secondaryGoals,
        kpis: personaData.kpis,
        buyingRole: personaData.buyingRole,
        buyingCriteria: personaData.buyingCriteria,
        purchaseTimeline: personaData.purchaseTimeline,
        informationSources: personaData.informationSources,
        socialPlatforms: personaData.socialPlatforms,
        communities: personaData.communities,
        currentSolution: personaData.currentSolution,
        switchingCost: personaData.switchingCost,
        commonObjections: personaData.commonObjections,
        purchaseBarriers: personaData.purchaseBarriers,
        keyMessages: personaData.keyMessages,
        toneThatResonates: personaData.toneThatResonates,
        triggerWords: personaData.triggerWords,
        avoidWords: personaData.avoidWords,
        priority: personaData.priority,
        revenueImpact: personaData.revenueImpact,
        strategicFit: personaData.strategicFit,
        needsReview: personaData.needsReview,
      },
    });

    // If pain points provided, update them
    if (painPoints !== undefined) {
      // Delete existing pain points
      await prisma.painPoint.deleteMany({
        where: { personaId: id },
      });

      // Create new pain points
      if (painPoints.length > 0) {
        await prisma.painPoint.createMany({
          data: painPoints.map((pp: any) => ({
            personaId: id,
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
        });
      }
    }

    // Fetch updated persona with pain points
    const updatedPersona = await prisma.customerPersona.findUnique({
      where: { id },
      include: {
        painPoints: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedPersona,
    });
  } catch (error: any) {
    console.error('Error updating persona:', error);
    return NextResponse.json(
      { error: 'Failed to update persona', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/brand-360/personas/[id]
 * Delete a persona and its pain points
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    // Delete pain points first (cascade)
    await prisma.painPoint.deleteMany({
      where: { personaId: id },
    });

    // Delete persona
    await prisma.customerPersona.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Persona deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting persona:', error);
    return NextResponse.json(
      { error: 'Failed to delete persona', message: error.message },
      { status: 500 }
    );
  }
}
