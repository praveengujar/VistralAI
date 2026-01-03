// API Route: GET /api/pricing
// Returns available pricing tiers

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const tiers = await prisma.pricingTier.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
        tagline: true,
        priceMonthly: true,
        priceYearly: true,
        currency: true,
        brandLimit: true,
        teamSeatLimit: true,
        competitorLimitPerBrand: true,
        customTopicsPerBrand: true,
        updateFrequency: true,
        features: true,
        platformsCovered: true,
        isPopular: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: tiers,
    });
  } catch (error) {
    console.error('Error fetching pricing tiers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pricing tiers' },
      { status: 500 }
    );
  }
}
