/**
 * Onboarding Confirmation API
 * POST /api/onboarding/confirm
 * Confirms and saves the generated brand profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createBrandProfile,
  createBrandIdentity,
  createMarketPosition,
  createCompetitorProfile,
  createProductDetail,
} from '@/lib/db';

const confirmSchema = z.object({
  userId: z.string().min(1),
  brandName: z.string().min(1),
  domain: z.string().min(1),
  descriptor: z.string().optional(),
  category: z.string().optional(),
  brandIdentity: z.object({
    mission: z.string().optional(),
    vision: z.string().optional(),
    values: z.array(z.string()).optional(),
    uniqueSellingPoints: z.array(z.string()).optional(),
    brandVoice: z.object({
      tone: z.array(z.string()).optional(),
      keywords: z.array(z.string()).optional(),
      avoidWords: z.array(z.string()).optional(),
    }).optional(),
  }).optional(),
  competitors: z.array(z.object({
    name: z.string(),
    domain: z.string().optional(),
    strengths: z.array(z.string()).optional(),
    weaknesses: z.array(z.string()).optional(),
    differentiators: z.array(z.string()).optional(),
  })).optional(),
  products: z.array(z.object({
    name: z.string(),
    category: z.string().optional(),
    description: z.string().optional(),
    features: z.array(z.string()).optional(),
    benefits: z.array(z.string()).optional(),
    useCases: z.array(z.string()).optional(),
    price: z.number().optional(),
    currency: z.string().optional(),
    url: z.string().optional(),
  })).optional(),
});

type ConfirmRequest = z.infer<typeof confirmSchema>;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = confirmSchema.parse(body);

    // Create brand profile
    const profile = await createBrandProfile({
      userId: data.userId,
      brandName: data.brandName,
      domain: data.domain,
      descriptor: data.descriptor || '',
      category: data.category || 'Other',
      competitors: data.competitors?.map((c) => c.name) || [],
      catalog: { products: [] },
      integrations: { gsc: false, ga4: false, shopify: false },
    });

    // Create brand identity if provided
    if (data.brandIdentity) {
      const brandVoice = data.brandIdentity.brandVoice || {
        tone: [],
        keywords: [],
        avoidWords: [],
      };
      await createBrandIdentity({
        brandId: profile.id,
        mission: data.brandIdentity.mission,
        vision: data.brandIdentity.vision,
        values: data.brandIdentity.values || [],
        uniqueSellingPoints: data.brandIdentity.uniqueSellingPoints || [],
        brandVoice: {
          tone: brandVoice.tone || [],
          keywords: brandVoice.keywords || [],
          avoidWords: brandVoice.avoidWords || [],
        },
      });
    }

    // Create competitors
    if (data.competitors && data.competitors.length > 0) {
      for (const competitor of data.competitors) {
        await createCompetitorProfile({
          brandId: profile.id,
          name: competitor.name,
          domain: competitor.domain || '',
          isPrimary: true,
          strengths: competitor.strengths || [],
          weaknesses: competitor.weaknesses || [],
          differentiators: competitor.differentiators || [],
        });
      }
    }

    // Create products
    if (data.products && data.products.length > 0) {
      for (const product of data.products) {
        await createProductDetail({
          brandId: profile.id,
          name: product.name,
          category: product.category || 'Service',
          description: product.description || '',
          features: product.features || [],
          benefits: product.benefits || [],
          useCases: product.useCases || [],
          pricing: {
            currency: product.currency || 'USD',
            amount: product.price || 0,
          },
          url: product.url || '',
          isActive: true,
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        brandId: profile.id,
        message: 'Brand profile created successfully',
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 },
      );
    }

    console.error('Error confirming onboarding:', error);
    return NextResponse.json(
      { error: 'Failed to create brand profile' },
      { status: 500 },
    );
  }
}
