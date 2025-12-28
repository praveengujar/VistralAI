import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

/**
 * GET /api/brand-360/audience?brand360Id=xxx
 * Get target audience profile with personas and segments
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

    const audience = await prisma.targetAudienceProfile.findUnique({
      where: { brand360Id },
      include: {
        segments: true,
      },
    });

    // Also fetch personas linked to this brand360
    const personas = await prisma.customerPersona.findMany({
      where: { brand360Id },
      include: {
        painPoints: true,
      },
      orderBy: { priority: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: {
        audience,
        personas,
      },
    });
  } catch (error: any) {
    console.error('Error fetching target audience:', error);
    return NextResponse.json(
      { error: 'Failed to fetch target audience', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/brand-360/audience
 * Upsert target audience profile
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { brand360Id, ...audienceData } = body;

    if (!brand360Id) {
      return NextResponse.json(
        { error: 'brand360Id is required' },
        { status: 400 }
      );
    }

    const audience = await prisma.targetAudienceProfile.upsert({
      where: { brand360Id },
      create: {
        brand360Id,
        primaryMarket: audienceData.primaryMarket,
        geographicFocus: audienceData.geographicFocus,
        targetIndustries: audienceData.targetIndustries || [],
        targetCompanySize: audienceData.targetCompanySize || [],
        targetJobTitles: audienceData.targetJobTitles || [],
        targetDepartments: audienceData.targetDepartments || [],
        ageRangeMin: audienceData.ageRangeMin,
        ageRangeMax: audienceData.ageRangeMax,
        incomeLevel: audienceData.incomeLevel,
        importSource: 'manual',
      },
      update: {
        primaryMarket: audienceData.primaryMarket,
        geographicFocus: audienceData.geographicFocus,
        targetIndustries: audienceData.targetIndustries,
        targetCompanySize: audienceData.targetCompanySize,
        targetJobTitles: audienceData.targetJobTitles,
        targetDepartments: audienceData.targetDepartments,
        ageRangeMin: audienceData.ageRangeMin,
        ageRangeMax: audienceData.ageRangeMax,
        incomeLevel: audienceData.incomeLevel,
      },
    });

    return NextResponse.json({
      success: true,
      data: audience,
    });
  } catch (error: any) {
    console.error('Error updating target audience:', error);
    return NextResponse.json(
      { error: 'Failed to update target audience', message: error.message },
      { status: 500 }
    );
  }
}
