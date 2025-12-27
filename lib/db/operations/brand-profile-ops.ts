// Brand Profile, Identity, and Market Position Operations

import prisma from '../prisma';
import { BrandProfile, BrandIdentity, MarketPosition } from '@/types';
import {
  transformBrandProfile,
  transformBrandIdentity,
  transformMarketPosition,
} from './transforms';

// ============================================
// Brand Profile Operations
// ============================================

export const createBrandProfile = async (profile: Omit<BrandProfile, 'id'>) => {
  const newProfile = await prisma.brandProfile.create({
    data: {
      userId: profile.userId,
      brandName: profile.brandName,
      domain: profile.domain,
      descriptor: profile.descriptor || '',
      category: profile.category || 'Other',
      competitors: profile.competitors || [],
      crawlingStatus: 'idle',
    },
  });

  return transformBrandProfile(newProfile);
};

export const getBrandProfileByUserId = async (userId: string) => {
  try {
    const profile = await prisma.brandProfile.findUnique({
      where: { userId },
    });

    if (!profile) return null;

    return transformBrandProfile(profile);
  } catch {
    return null;
  }
};

export const updateBrandProfile = async (id: string, updates: Partial<BrandProfile>) => {
  const { catalog, integrations, ...validUpdates } = updates as any;

  const profile = await prisma.brandProfile.update({
    where: { id },
    data: validUpdates,
  });

  return transformBrandProfile(profile);
};

// ============================================
// Brand Identity Operations
// ============================================

export const createBrandIdentity = async (
  identity: Omit<BrandIdentity, 'id' | 'createdAt' | 'updatedAt'>
) => {
  const brandVoice = identity.brandVoice || { tone: [], keywords: [], avoidWords: [] };

  const newIdentity = await prisma.brandIdentity.create({
    data: {
      brandId: identity.brandId,
      mission: identity.mission,
      vision: identity.vision,
      values: identity.values || [],
      brandStory: identity.brandStory,
      uniqueSellingPoints: identity.uniqueSellingPoints || [],
      brandVoice: {
        tone: brandVoice.tone || [],
        keywords: brandVoice.keywords || [],
        avoidWords: brandVoice.avoidWords || [],
      },
      brandPersonality: identity.brandPersonality,
      tagline: identity.tagline,
      foundedYear: identity.foundedYear,
      headquarters: identity.headquarters,
      source: identity.source as any,
      extractionConfidence: identity.extractionConfidence as any,
      extractedFromUrl: identity.extractedFromUrl,
    },
  });

  return transformBrandIdentity(newIdentity);
};

export const getBrandIdentityByBrandId = async (brandId: string) => {
  try {
    const identity = await prisma.brandIdentity.findUnique({
      where: { brandId },
    });

    if (!identity) return null;

    return transformBrandIdentity(identity);
  } catch {
    return null;
  }
};

export const updateBrandIdentity = async (id: string, updates: Partial<BrandIdentity>) => {
  const { brandVoice, ...otherUpdates } = updates as any;
  const data: any = { ...otherUpdates };

  if (brandVoice) {
    data.brandVoice = {
      tone: brandVoice.tone || [],
      keywords: brandVoice.keywords || [],
      avoidWords: brandVoice.avoidWords || [],
    };
  }

  const identity = await prisma.brandIdentity.update({
    where: { id },
    data,
  });

  return transformBrandIdentity(identity);
};

// ============================================
// Market Position Operations
// ============================================

export const createMarketPosition = async (
  position: Omit<MarketPosition, 'id' | 'createdAt' | 'updatedAt'>
) => {
  const newPosition = await prisma.marketPosition.create({
    data: {
      brandId: position.brandId,
      targetAudiences: (position.targetAudiences || []) as any,
      marketSegment: position.marketSegment,
      geographicMarkets: position.geographicMarkets || [],
      industryVerticals: position.industryVerticals || [],
      marketSize: position.marketSize ? {
        value: position.marketSize.value,
        currency: position.marketSize.currency,
        year: position.marketSize.year,
      } : undefined,
      marketShare: position.marketShare,
      positioning: position.positioning,
      pricingStrategy: position.pricingStrategy as any,
    },
  });

  return transformMarketPosition(newPosition);
};

export const getMarketPositionByBrandId = async (brandId: string) => {
  try {
    const position = await prisma.marketPosition.findUnique({
      where: { brandId },
    });

    if (!position) return null;

    return transformMarketPosition(position);
  } catch {
    return null;
  }
};

export const updateMarketPosition = async (id: string, updates: Partial<MarketPosition>) => {
  const { marketSize, ...otherUpdates } = updates as any;
  const data: any = { ...otherUpdates };

  if (marketSize) {
    data.marketSize = {
      value: marketSize.value,
      currency: marketSize.currency,
      year: marketSize.year,
    };
  }

  const position = await prisma.marketPosition.update({
    where: { id },
    data,
  });

  return transformMarketPosition(position);
};
