// Transform helpers: Prisma types -> App types

import {
  BrandProfile,
  BrandIdentity,
  MarketPosition,
  CompetitorProfile,
  ProductDetail,
  BrandAsset,
  UploadedDocument,
} from '@/types';

export function transformBrandProfile(profile: any): BrandProfile {
  return {
    id: profile.id,
    userId: profile.userId,
    brandName: profile.brandName,
    domain: profile.domain,
    descriptor: profile.descriptor,
    category: profile.category,
    competitors: profile.competitors,
    catalog: { products: [] },
    integrations: { gsc: false, ga4: false, shopify: false },
    crawlingStatus: profile.crawlingStatus,
  };
}

export function transformBrandIdentity(identity: any): BrandIdentity {
  return {
    id: identity.id,
    brandId: identity.brandId,
    mission: identity.mission,
    vision: identity.vision,
    values: identity.values || [],
    brandStory: identity.brandStory,
    uniqueSellingPoints: identity.uniqueSellingPoints || [],
    brandVoice: identity.brandVoice || {
      tone: [],
      keywords: [],
      avoidWords: [],
    },
    brandPersonality: identity.brandPersonality,
    tagline: identity.tagline,
    foundedYear: identity.foundedYear,
    headquarters: identity.headquarters,
    source: identity.source,
    extractionConfidence: identity.extractionConfidence,
    extractedFromUrl: identity.extractedFromUrl,
    createdAt: identity.createdAt,
    updatedAt: identity.updatedAt,
  };
}

export function transformMarketPosition(position: any): MarketPosition {
  return {
    id: position.id,
    brandId: position.brandId,
    targetAudiences: position.targetAudiences || [],
    marketSegment: position.marketSegment,
    geographicMarkets: position.geographicMarkets || [],
    industryVerticals: position.industryVerticals || [],
    marketSize: position.marketSize,
    marketShare: position.marketShare,
    positioning: position.positioning,
    pricingStrategy: position.pricingStrategy,
    createdAt: position.createdAt,
    updatedAt: position.updatedAt,
  };
}

export function transformCompetitorProfile(competitor: any): CompetitorProfile {
  return {
    id: competitor.id,
    brandId: competitor.brandId,
    name: competitor.name,
    domain: competitor.domain,
    isPrimary: competitor.isPrimary,
    strengths: competitor.strengths || [],
    weaknesses: competitor.weaknesses || [],
    marketShare: competitor.marketShare,
    pricingPosition: competitor.pricingPosition,
    differentiators: competitor.differentiators || [],
    targetAudienceOverlap: competitor.targetAudienceOverlap,
    source: competitor.source,
    competitionType: competitor.competitionType,
    confidenceScore: competitor.confidenceScore,
    reasonForSelection: competitor.reasonForSelection,
    createdAt: competitor.createdAt,
    updatedAt: competitor.updatedAt,
  };
}

export function transformProductDetail(product: any): ProductDetail {
  return {
    id: product.id,
    brandId: product.brandId,
    name: product.name,
    sku: product.sku,
    category: product.category,
    subcategory: product.subcategory,
    description: product.description,
    shortDescription: product.shortDescription,
    features: product.features || [],
    benefits: product.benefits || [],
    useCases: product.useCases || [],
    targetAudience: product.targetAudience || [],
    pricing: product.pricing || {
      currency: 'USD',
      amount: 0,
      billingPeriod: undefined,
    },
    url: product.url,
    imageUrls: product.imageUrls || [],
    specifications: product.specifications,
    awards: product.awards || [],
    certifications: product.certifications || [],
    isActive: product.isActive,
    launchDate: product.launchDate,
    source: product.source,
    confidenceScore: product.confidenceScore,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export function transformBrandAsset(asset: any): BrandAsset {
  return {
    id: asset.id,
    brandId: asset.brandId,
    type: asset.type,
    name: asset.name,
    description: asset.description,
    fileUrl: asset.fileUrl,
    metadata: asset.metadata || {},
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
  };
}

export function transformUploadedDocument(document: any): UploadedDocument {
  return {
    id: document.id,
    brandId: document.brandId,
    fileName: document.fileName,
    fileType: document.fileType,
    fileSize: document.fileSize,
    fileUrl: document.fileUrl,
    status: document.status,
    extractedData: document.extractedData,
    processingError: document.processingError,
    uploadedAt: document.uploadedAt,
    processedAt: document.processedAt,
  };
}
