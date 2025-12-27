import { NextRequest, NextResponse } from 'next/server';
import { createBrandProfile, getBrandProfileByUserId } from '@/lib/db';
import { saveExtractedData, updateCrawlingStatus } from '@/lib/services/brand-service';
import { analyzeWebsite } from '@/lib/ai/website-analyzer';
import { z } from 'zod';

const brandProfileSchema = z.object({
  userId: z.string(),
  brandName: z.string().min(1),
  domain: z.string().min(1),
  descriptor: z.string().optional(),
  category: z.string(),
  competitors: z.array(z.string()),
  products: z.array(z.string()).optional(),
  integrations: z.object({
    gsc: z.boolean().optional(),
    ga4: z.boolean().optional(),
    shopify: z.boolean().optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = brandProfileSchema.parse(body);

    // Check if user already has a profile
    const existingProfile = await getBrandProfileByUserId(data.userId);
    if (existingProfile) {
      return NextResponse.json({ error: 'Brand profile already exists' }, { status: 409 });
    }

    // Create brand profile
    const profile = await createBrandProfile({
      userId: data.userId,
      brandName: data.brandName,
      domain: data.domain,
      descriptor: data.descriptor || '',
      category: data.category,
      competitors: data.competitors,
      catalog: {
        products: data.products ? data.products.map((p, i) => ({
          id: `prod_${i}`,
          name: p,
          category: 'Uncategorized',
          url: '',
          description: '',
          attributes: {}
        })) : []
      },
      integrations: {
        gsc: data.integrations?.gsc || false,
        ga4: data.integrations?.ga4 || false,
        shopify: data.integrations?.shopify || false,
      },
    });

    // Integrated Firecrawl: Trigger background website analysis
    // This runs asynchronously to not block the response
    if (profile.domain) {
      console.log(`[BrandProfile] Triggering background analysis for ${profile.domain}`);

      // Update status to processing (fire and forget)
      updateCrawlingStatus(profile.id, 'processing').then(() => {
        analyzeWebsite(profile.id, profile.domain)
          .then(async (result) => {
            console.log(`[BrandProfile] Analysis complete for ${profile.domain}`);
            await saveExtractedData(profile.id, result.extractedData);
            await updateCrawlingStatus(profile.id, 'completed');
          })
          .catch(async (err: any) => {
            console.error('[BrandProfile] Background analysis failed:', err);
            await updateCrawlingStatus(profile.id, 'failed');
          });
      });
    }

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }

    console.error('Error creating brand profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const profile = await getBrandProfileByUserId(userId);

    if (!profile) {
      return NextResponse.json({ error: 'Brand profile not found' }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error fetching brand profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
