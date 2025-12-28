import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

/**
 * GET /api/brand-360/positioning?brand360Id=xxx
 * Get market positioning with value propositions, proof points, and axes
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

    const positioning = await prisma.aEOMarketPositioning.findUnique({
      where: { brand360Id },
      include: {
        valuePropositions: true,
        proofPoints: true,
        positioningAxes: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: positioning,
    });
  } catch (error: any) {
    console.error('Error fetching market positioning:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market positioning', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/brand-360/positioning
 * Upsert market positioning with related data
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { brand360Id, valuePropositions, proofPoints, positioningAxes, ...positioningData } = body;

    if (!brand360Id) {
      return NextResponse.json(
        { error: 'brand360Id is required' },
        { status: 400 }
      );
    }

    // Upsert positioning
    const positioning = await prisma.aEOMarketPositioning.upsert({
      where: { brand360Id },
      create: {
        brand360Id,
        positioningStatement: positioningData.positioningStatement,
        targetAudienceSummary: positioningData.targetAudienceSummary,
        categoryDefinition: positioningData.categoryDefinition,
        primaryBenefit: positioningData.primaryBenefit,
        competitiveAlternative: positioningData.competitiveAlternative,
        reasonToBelieve: positioningData.reasonToBelieve,
        categoryType: positioningData.categoryType,
        categoryPosition: positioningData.categoryPosition,
        competitiveStance: positioningData.competitiveStance,
        primaryDifferentiator: positioningData.primaryDifferentiator,
        secondaryDifferentiators: positioningData.secondaryDifferentiators || [],
        beforeState: positioningData.beforeState,
        afterState: positioningData.afterState,
        transformationStory: positioningData.transformationStory,
        elevatorPitch: positioningData.elevatorPitch,
        boilerplate: positioningData.boilerplate,
        headlines: positioningData.headlines || [],
        pricingPosition: positioningData.pricingPosition,
        pricingRationale: positioningData.pricingRationale,
        importSource: 'manual',
      },
      update: {
        positioningStatement: positioningData.positioningStatement,
        targetAudienceSummary: positioningData.targetAudienceSummary,
        categoryDefinition: positioningData.categoryDefinition,
        primaryBenefit: positioningData.primaryBenefit,
        competitiveAlternative: positioningData.competitiveAlternative,
        reasonToBelieve: positioningData.reasonToBelieve,
        categoryType: positioningData.categoryType,
        categoryPosition: positioningData.categoryPosition,
        competitiveStance: positioningData.competitiveStance,
        primaryDifferentiator: positioningData.primaryDifferentiator,
        secondaryDifferentiators: positioningData.secondaryDifferentiators,
        beforeState: positioningData.beforeState,
        afterState: positioningData.afterState,
        transformationStory: positioningData.transformationStory,
        elevatorPitch: positioningData.elevatorPitch,
        boilerplate: positioningData.boilerplate,
        headlines: positioningData.headlines,
        pricingPosition: positioningData.pricingPosition,
        pricingRationale: positioningData.pricingRationale,
      },
    });

    // Update value propositions if provided
    if (valuePropositions !== undefined) {
      await prisma.valueProposition.deleteMany({
        where: { positioningId: positioning.id },
      });

      if (valuePropositions.length > 0) {
        await prisma.valueProposition.createMany({
          data: valuePropositions.map((vp: any) => ({
            positioningId: positioning.id,
            headline: vp.headline,
            subheadline: vp.subheadline,
            description: vp.description,
            type: vp.type || 'Primary',
            functionalValue: vp.functionalValue,
            emotionalValue: vp.emotionalValue,
            socialValue: vp.socialValue,
            economicValue: vp.economicValue,
            supportingProof: vp.supportingProof || [],
            customerQuote: vp.customerQuote,
            metricValue: vp.metricValue,
          })),
        });
      }
    }

    // Update proof points if provided
    if (proofPoints !== undefined) {
      await prisma.proofPoint.deleteMany({
        where: { positioningId: positioning.id },
      });

      if (proofPoints.length > 0) {
        await prisma.proofPoint.createMany({
          data: proofPoints.map((pp: any) => ({
            positioningId: positioning.id,
            type: pp.type,
            title: pp.title,
            description: pp.description,
            metricValue: pp.metricValue,
            source: pp.source,
            sourceUrl: pp.sourceUrl,
            isVerified: pp.isVerified || false,
            primaryClaimSupported: pp.primaryClaimSupported,
          })),
        });
      }
    }

    // Update positioning axes if provided
    if (positioningAxes !== undefined) {
      await prisma.positioningAxis.deleteMany({
        where: { positioningId: positioning.id },
      });

      if (positioningAxes.length > 0) {
        await prisma.positioningAxis.createMany({
          data: positioningAxes.map((axis: any) => ({
            positioningId: positioning.id,
            name: axis.name,
            lowEndLabel: axis.lowEndLabel,
            highEndLabel: axis.highEndLabel,
            brandPosition: axis.brandPosition,
            competitorPositions: axis.competitorPositions || {},
            importance: axis.importance,
            isDefining: axis.isDefining || false,
          })),
        });
      }
    }

    // Fetch updated positioning with relations
    const updatedPositioning = await prisma.aEOMarketPositioning.findUnique({
      where: { id: positioning.id },
      include: {
        valuePropositions: true,
        proofPoints: true,
        positioningAxes: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedPositioning,
    });
  } catch (error: any) {
    console.error('Error updating market positioning:', error);
    return NextResponse.json(
      { error: 'Failed to update market positioning', message: error.message },
      { status: 500 }
    );
  }
}
