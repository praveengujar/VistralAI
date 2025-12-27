import { NextRequest, NextResponse } from 'next/server';
import { analyzeWebsite, validateWebsite } from '@/lib/ai/website-analyzer';
import {
  createBrandIdentity,
  createMarketPosition,
  createCompetitorProfile,
  createProductDetail,
  getBrandIdentityByBrandId,
  getMarketPositionByBrandId,
  updateBrandIdentity,
  updateMarketPosition,
} from '@/lib/db';

/**
 * POST /api/brand-360/analyze-website
 * Analyze a website URL and extract Brand 360° data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandId, url, options } = body;

    if (!brandId || !url) {
      return NextResponse.json(
        { error: 'Brand ID and URL are required' },
        { status: 400 }
      );
    }

    // Validate URL
    const validation = await validateWebsite(url);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid URL', message: validation.error },
        { status: 400 }
      );
    }

    // Analyze website
    const analysisOptions = {
      maxPages: body.maxPages,
      depth: body.depth,
      ...options
    };
    const analysisResult = await analyzeWebsite(brandId, url, analysisOptions);

    // Save extracted data to database
    const { extractedData } = analysisResult;

    console.log('[AnalyzeWebsite API] Extracted data to save:', {
      hasIdentity: !!extractedData.identity,
      mission: extractedData.identity?.mission?.substring(0, 50) || 'EMPTY',
      vision: extractedData.identity?.vision?.substring(0, 50) || 'EMPTY',
      hasMarketPosition: !!extractedData.marketPosition,
      competitorsCount: extractedData.competitors?.length || 0,
      productsCount: extractedData.products?.length || 0,
    });

    // Save or update brand identity
    if (extractedData.identity) {
      const existingIdentity = await getBrandIdentityByBrandId(brandId);
      if (existingIdentity) {
        const updated = await updateBrandIdentity(existingIdentity.id, extractedData.identity);
        console.log('[AnalyzeWebsite API] Updated brand identity:', updated.id, 'mission:', updated.mission?.substring(0, 30));
      } else {
        const created = await createBrandIdentity({
          ...extractedData.identity,
          brandId,
        });
        console.log('[AnalyzeWebsite API] Created brand identity:', created.id, 'mission:', created.mission?.substring(0, 30));
      }
    }

    // Save or update market position
    if (extractedData.marketPosition) {
      const existingPosition = await getMarketPositionByBrandId(brandId);
      if (existingPosition) {
        await updateMarketPosition(existingPosition.id, extractedData.marketPosition);
      } else {
        await createMarketPosition({
          ...extractedData.marketPosition,
          targetAudiences: extractedData.marketPosition.targetAudiences || [],
          brandId,
        });
      }
    }

    // Save competitors
    if (extractedData.competitors) {
      for (const competitor of extractedData.competitors) {
        await createCompetitorProfile({
          ...competitor,
          brandId,
        });
      }
    }

    // Save products
    if (extractedData.products) {
      for (const product of extractedData.products) {
        await createProductDetail({
          ...product,
          brandId,
        });
      }
    }

    return NextResponse.json(
      {
        message: 'Website analyzed successfully',
        data: analysisResult,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error analyzing website:', error);
    return NextResponse.json(
      { error: 'Failed to analyze website', message: error.message },
      { status: 500 }
    );
  }
}
