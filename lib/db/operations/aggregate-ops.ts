// Aggregate Operations

import prisma from '../prisma';
import { Brand360Data, BrandIdentity, MarketPosition } from '@/types';
import {
  getBrandIdentityByBrandId,
  getMarketPositionByBrandId,
} from './brand-profile-ops';
import { getCompetitorsByBrandId } from './competitor-ops';
import { getProductsByBrandId } from './product-ops';
import { getAssetsByBrandId } from './asset-ops';
import {
  transformBrandProfile,
  transformBrandIdentity,
  transformMarketPosition,
  transformCompetitorProfile,
  transformProductDetail,
  transformBrandAsset,
  transformUploadedDocument,
} from './transforms';

// ============================================
// Aggregate Brand 360 Data
// ============================================

export const getBrand360Data = async (brandId: string): Promise<Brand360Data | null> => {
  const [identity, marketPosition, competitors, products, assets] = await Promise.all([
    getBrandIdentityByBrandId(brandId),
    getMarketPositionByBrandId(brandId),
    getCompetitorsByBrandId(brandId),
    getProductsByBrandId(brandId),
    getAssetsByBrandId(brandId),
  ]);

  if (!identity && !marketPosition && competitors.length === 0 && products.length === 0) {
    return null;
  }

  // Calculate completion status
  const calculateCompletion = (obj: any, requiredFields: string[]) => {
    if (!obj) return 0;
    const filled = requiredFields.filter((field) => {
      const value = obj[field];
      if (Array.isArray(value)) return value.length > 0;
      return value !== null && value !== undefined && value !== '';
    }).length;
    return Math.round((filled / requiredFields.length) * 100);
  };

  const identityCompletion = calculateCompletion(identity, [
    'mission',
    'vision',
    'values',
    'uniqueSellingPoints',
    'brandVoice',
  ]);
  const marketCompletion = calculateCompletion(marketPosition, [
    'targetAudiences',
    'marketSegment',
    'geographicMarkets',
    'industryVerticals',
  ]);
  const competitorsCompletion = competitors.length > 0 ? 100 : 0;
  const productsCompletion = products.length > 0 ? 100 : 0;

  const overallStrength = Math.round(
    (identityCompletion + marketCompletion + competitorsCompletion + productsCompletion) / 4
  );

  return {
    brandId,
    identity: identity || ({} as BrandIdentity),
    marketPosition: marketPosition || ({} as MarketPosition),
    competitors,
    products,
    assets,
    profileStrength: overallStrength,
    lastUpdated: new Date(),
    completionStatus: {
      identity: identityCompletion,
      marketPosition: marketCompletion,
      competitors: competitorsCompletion,
      products: productsCompletion,
    },
  };
};

// ============================================
// Database Statistics
// ============================================

export const logDbStats = async () => {
  const [users, brandProfiles, brandIdentities, marketPositions, competitorProfiles, productDetails] =
    await Promise.all([
      prisma.user.count(),
      prisma.brandProfile.count(),
      prisma.brandIdentity.count(),
      prisma.marketPosition.count(),
      prisma.competitorProfile.count(),
      prisma.productDetail.count(),
    ]);

  console.log('[Database Stats]', {
    users,
    brandProfiles,
    brandIdentities,
    marketPositions,
    competitorProfiles,
    productDetails,
  });
};

export const getAllData = async () => {
  const [
    users,
    brandProfiles,
    brandIdentities,
    marketPositions,
    competitorProfiles,
    productDetails,
    brandAssets,
    uploadedDocuments,
  ] = await Promise.all([
    prisma.user.findMany(),
    prisma.brandProfile.findMany(),
    prisma.brandIdentity.findMany(),
    prisma.marketPosition.findMany(),
    prisma.competitorProfile.findMany(),
    prisma.productDetail.findMany(),
    prisma.brandAsset.findMany(),
    prisma.uploadedDocument.findMany(),
  ]);

  return {
    stats: {
      users: users.length,
      brandProfiles: brandProfiles.length,
      brandIdentities: brandIdentities.length,
      marketPositions: marketPositions.length,
      competitorProfiles: competitorProfiles.length,
      productDetails: productDetails.length,
      brandAssets: brandAssets.length,
      uploadedDocuments: uploadedDocuments.length,
    },
    data: {
      users: users.map((u: Record<string, unknown>) => ({ ...u, password: '[REDACTED]' })),
      brandProfiles: brandProfiles.map(transformBrandProfile),
      brandIdentities: brandIdentities.map(transformBrandIdentity),
      marketPositions: marketPositions.map(transformMarketPosition),
      competitorProfiles: competitorProfiles.map(transformCompetitorProfile),
      productDetails: productDetails.map(transformProductDetail),
      brandAssets: brandAssets.map(transformBrandAsset),
      uploadedDocuments: uploadedDocuments.map(transformUploadedDocument),
    },
  };
};
