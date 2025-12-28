// PostgreSQL/MongoDB Database Operations via Prisma
// Prisma is database-agnostic - works with both PostgreSQL and MongoDB
// Mirrors all 31 functions from mockDb.ts with identical signatures

import prisma from './prisma';
import bcrypt from 'bcrypt';
import {
  User,
  BrandProfile,
  BrandIdentity,
  MarketPosition,
  CompetitorProfile,
  ProductDetail,
  BrandAsset,
  UploadedDocument,
  Brand360Data,
} from '@/types';

// ============================================
// User Operations
// ============================================

export const createUser = async (
  email: string,
  password: string,
  accountType: User['accountType']
) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      accountType: accountType as any,
    },
  });

  return {
    id: user.id,
    email: user.email,
    password: user.password,
    accountType: user.accountType as User['accountType'],
    createdAt: user.createdAt,
    subscription: user.subscription as User['subscription'],
  };
};

export const getUserByEmail = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) return undefined;

  return {
    id: user.id,
    email: user.email,
    password: user.password,
    accountType: user.accountType as User['accountType'],
    createdAt: user.createdAt,
    subscription: user.subscription as User['subscription'],
  };
};

export const getUserById = async (id: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      password: user.password,
      accountType: user.accountType as User['accountType'],
      createdAt: user.createdAt,
      subscription: user.subscription as User['subscription'],
    };
  } catch {
    return null;
  }
};

export const verifyPassword = async (password: string, hashedPassword: string) => {
  return bcrypt.compare(password, hashedPassword);
};

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
  // Only include fields that exist in the PostgreSQL schema
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
  // Extract brand voice fields from nested object to flat fields
  const brandVoice = identity.brandVoice || { tone: [], keywords: [], avoidWords: [] };

  const newIdentity = await prisma.brandIdentity.create({
    data: {
      brandId: identity.brandId,
      mission: identity.mission,
      vision: identity.vision,
      values: identity.values || [],
      brandStory: identity.brandStory,
      uniqueSellingPoints: identity.uniqueSellingPoints || [],
      // Nested brand voice object (MongoDB embedded document)
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

  // Use nested brandVoice object (MongoDB embedded document)
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
      // Store targetAudiences as embedded documents
      targetAudiences: (position.targetAudiences || []) as any,
      marketSegment: position.marketSegment,
      geographicMarkets: position.geographicMarkets || [],
      industryVerticals: position.industryVerticals || [],
      // Use embedded marketSize type
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

  // Use embedded marketSize type
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

// ============================================
// Competitor Profile Operations
// ============================================

export const createCompetitorProfile = async (
  competitor: Omit<CompetitorProfile, 'id' | 'createdAt' | 'updatedAt'>
) => {
  const newCompetitor = await prisma.competitorProfile.create({
    data: {
      brandId: competitor.brandId,
      name: competitor.name,
      domain: competitor.domain,
      isPrimary: competitor.isPrimary || false,
      strengths: competitor.strengths || [],
      weaknesses: competitor.weaknesses || [],
      marketShare: competitor.marketShare,
      pricingPosition: competitor.pricingPosition as any,
      differentiators: competitor.differentiators || [],
      targetAudienceOverlap: competitor.targetAudienceOverlap,
      source: competitor.source as any,
      competitionType: competitor.competitionType as any,
      confidenceScore: competitor.confidenceScore,
      reasonForSelection: competitor.reasonForSelection,
    },
  });

  return transformCompetitorProfile(newCompetitor);
};

export const getCompetitorsByBrandId = async (brandId: string) => {
  try {
    const competitors = await prisma.competitorProfile.findMany({
      where: { brandId },
    });

    return competitors.map(transformCompetitorProfile);
  } catch {
    return [];
  }
};

export const updateCompetitorProfile = async (id: string, updates: Partial<CompetitorProfile>) => {
  const competitor = await prisma.competitorProfile.update({
    where: { id },
    data: updates as any,
  });

  return transformCompetitorProfile(competitor);
};

export const deleteCompetitorProfile = async (id: string) => {
  try {
    await prisma.competitorProfile.delete({
      where: { id },
    });
    return true;
  } catch {
    return false;
  }
};

// ============================================
// Product Detail Operations
// ============================================

export const createProductDetail = async (
  product: Omit<ProductDetail, 'id' | 'createdAt' | 'updatedAt'>
) => {
  const newProduct = await prisma.productDetail.create({
    data: {
      brandId: product.brandId,
      name: product.name,
      sku: product.sku,
      category: product.category,
      subcategory: product.subcategory,
      description: product.description || '',
      shortDescription: product.shortDescription,
      features: product.features || [],
      benefits: product.benefits || [],
      useCases: product.useCases || [],
      targetAudience: product.targetAudience || [],
      // Nested pricing object (MongoDB embedded document)
      pricing: product.pricing ? {
        currency: product.pricing.currency || 'USD',
        amount: product.pricing.amount || 0,
        billingPeriod: product.pricing.billingPeriod as any,
      } : null,
      url: product.url || '',
      imageUrls: product.imageUrls || [],
      specifications: product.specifications as any,
      awards: product.awards || [],
      certifications: product.certifications || [],
      isActive: product.isActive ?? true,
      launchDate: product.launchDate,
      source: product.source as any,
      confidenceScore: product.confidenceScore,
    },
  });

  return transformProductDetail(newProduct);
};

export const getProductsByBrandId = async (brandId: string) => {
  try {
    const products = await prisma.productDetail.findMany({
      where: { brandId },
    });

    return products.map(transformProductDetail);
  } catch {
    return [];
  }
};

export const updateProductDetail = async (id: string, updates: Partial<ProductDetail>) => {
  const { pricing, ...otherUpdates } = updates as any;
  const data: any = { ...otherUpdates };

  // Use nested pricing object (MongoDB embedded document)
  if (pricing) {
    data.pricing = {
      currency: pricing.currency || 'USD',
      amount: pricing.amount || 0,
      billingPeriod: pricing.billingPeriod,
    };
  }

  const product = await prisma.productDetail.update({
    where: { id },
    data,
  });

  return transformProductDetail(product);
};

export const deleteProductDetail = async (id: string) => {
  try {
    await prisma.productDetail.delete({
      where: { id },
    });
    return true;
  } catch {
    return false;
  }
};

// ============================================
// Brand Asset Operations
// ============================================

export const createBrandAsset = async (
  asset: Omit<BrandAsset, 'id' | 'createdAt' | 'updatedAt'>
) => {
  const newAsset = await prisma.brandAsset.create({
    data: {
      brandId: asset.brandId,
      type: asset.type as any,
      name: asset.name,
      description: asset.description,
      fileUrl: asset.fileUrl,
      metadata: asset.metadata as any,
    },
  });

  return transformBrandAsset(newAsset);
};

export const getAssetsByBrandId = async (brandId: string) => {
  try {
    const assets = await prisma.brandAsset.findMany({
      where: { brandId },
    });

    return assets.map(transformBrandAsset);
  } catch {
    return [];
  }
};

export const deleteAsset = async (id: string) => {
  try {
    await prisma.brandAsset.delete({
      where: { id },
    });
    return true;
  } catch {
    return false;
  }
};

// ============================================
// Uploaded Document Operations
// ============================================

export const createUploadedDocument = async (
  document: Omit<UploadedDocument, 'id' | 'uploadedAt'>
) => {
  const newDocument = await prisma.uploadedDocument.create({
    data: {
      brandId: document.brandId,
      fileName: document.fileName,
      fileType: document.fileType as any,
      fileSize: document.fileSize || 0,
      fileUrl: document.fileUrl,
      status: (document.status as any) || 'pending',
      extractedData: document.extractedData as any,
      processingError: document.processingError,
      processedAt: document.processedAt,
    },
  });

  return transformUploadedDocument(newDocument);
};

export const getDocumentsByBrandId = async (brandId: string) => {
  try {
    const documents = await prisma.uploadedDocument.findMany({
      where: { brandId },
    });

    return documents.map(transformUploadedDocument);
  } catch {
    return [];
  }
};

export const updateDocument = async (id: string, updates: Partial<UploadedDocument>) => {
  const document = await prisma.uploadedDocument.update({
    where: { id },
    data: updates as any,
  });

  return transformUploadedDocument(document);
};

export const getDocumentById = async (id: string) => {
  try {
    const document = await prisma.uploadedDocument.findUnique({
      where: { id },
    });

    if (!document) return null;

    return transformUploadedDocument(document);
  } catch {
    return null;
  }
};

// ============================================
// Aggregate Operations
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

  // Calculate completion status (same logic as mockDb)
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

// ============================================
// Transform Helpers (Prisma types -> App types)
// ============================================

function transformBrandProfile(profile: any): BrandProfile {
  return {
    id: profile.id,
    userId: profile.userId,
    brandName: profile.brandName,
    domain: profile.domain,
    descriptor: profile.descriptor,
    category: profile.category,
    competitors: profile.competitors,
    // These fields are maintained for backwards compatibility but not stored in PostgreSQL
    catalog: { products: [] },
    integrations: { gsc: false, ga4: false, shopify: false },
    crawlingStatus: profile.crawlingStatus,
  };
}

function transformBrandIdentity(identity: any): BrandIdentity {
  return {
    id: identity.id,
    brandId: identity.brandId,
    mission: identity.mission,
    vision: identity.vision,
    values: identity.values || [],
    brandStory: identity.brandStory,
    uniqueSellingPoints: identity.uniqueSellingPoints || [],
    // Read from nested brandVoice object (MongoDB embedded document)
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

function transformMarketPosition(position: any): MarketPosition {
  return {
    id: position.id,
    brandId: position.brandId,
    targetAudiences: position.targetAudiences || [],
    marketSegment: position.marketSegment,
    geographicMarkets: position.geographicMarkets || [],
    industryVerticals: position.industryVerticals || [],
    // Use embedded marketSize directly
    marketSize: position.marketSize,
    marketShare: position.marketShare,
    positioning: position.positioning,
    pricingStrategy: position.pricingStrategy,
    createdAt: position.createdAt,
    updatedAt: position.updatedAt,
  };
}

function transformCompetitorProfile(competitor: any): CompetitorProfile {
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

function transformProductDetail(product: any): ProductDetail {
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
    // Read from nested pricing object (MongoDB embedded document)
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

function transformBrandAsset(asset: any): BrandAsset {
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

function transformUploadedDocument(document: any): UploadedDocument {
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

// ============================================
// AEO: Brand 360 Profile Operations
// ============================================

export const createBrand360Profile = async (organizationId: string) => {
  return prisma.brand360Profile.create({
    data: { organizationId },
  });
};

export const getBrand360ProfileByOrganizationId = async (organizationId: string) => {
  return prisma.brand360Profile.findFirst({
    where: { organizationId },
    include: {
      entityHome: true,
      organizationSchema: true,
      brandIdentityPrism: true,
      brandArchetype: true,
      brandVoiceProfile: true,
      competitorGraph: {
        include: { competitors: true },
      },
      customerPersonas: true,
      products: true,
      claimLocker: {
        include: { claims: true },
      },
      riskFactors: true,
      generatedPrompts: true,
      perceptionScans: {
        include: { results: true },
      },
    },
  });
};

export const getBrand360ProfileById = async (id: string) => {
  return prisma.brand360Profile.findUnique({
    where: { id },
    include: {
      entityHome: true,
      organizationSchema: true,
      brandIdentityPrism: true,
      brandArchetype: true,
      brandVoiceProfile: true,
      competitorGraph: {
        include: { competitors: true },
      },
      customerPersonas: true,
      products: true,
      claimLocker: {
        include: { claims: true },
      },
      riskFactors: true,
      generatedPrompts: true,
      perceptionScans: {
        include: { results: true },
      },
    },
  });
};

export const updateBrand360Profile = async (
  id: string,
  data: {
    completionScore?: number;
    entityHealthScore?: number;
    lastAgentCrawlAt?: Date;
    lastAnalyzedAt?: Date;
  }
) => {
  return prisma.brand360Profile.update({
    where: { id },
    data,
  });
};

// ============================================
// AEO: Entity Home Operations
// ============================================

export const getEntityHomeByBrand360Id = async (brand360Id: string) => {
  return prisma.entityHome.findUnique({
    where: { brand360Id },
  });
};

export const upsertEntityHome = async (
  brand360Id: string,
  data: {
    canonicalUrl: string;
    wikidataId?: string;
    wikipediaUrl?: string;
    linkedinUrl?: string;
    twitterUrl?: string;
    facebookUrl?: string;
    youtubeUrl?: string;
    githubUrl?: string;
    instagramUrl?: string;
    crunchbaseUrl?: string;
    schemaValidated?: boolean;
    socialConsistent?: boolean;
    googleKgId?: string;
    googleKgScore?: number;
    googleKgDescription?: string;
    alternateNames?: string[];
    formerNames?: string[];
  }
) => {
  return prisma.entityHome.upsert({
    where: { brand360Id },
    create: { brand360Id, ...data },
    update: data,
  });
};

// ============================================
// AEO: Organization Schema Operations
// ============================================

export const getOrganizationSchemaByBrand360Id = async (brand360Id: string) => {
  return prisma.organizationSchema.findUnique({
    where: { brand360Id },
  });
};

export const upsertOrganizationSchema = async (
  brand360Id: string,
  data: {
    organizationType: string;
    legalName: string;
    name: string;
    alternateName?: string;
    description?: string;
    slogan?: string;
    foundingDate?: Date;
    foundingLocation?: string;
    founders?: object;
    address?: object;
    numberOfEmployees?: string;
    naicsCode?: string;
    isicCode?: string;
    awards?: string[];
    parentOrganization?: string;
    subOrganizations?: string[];
    jsonLdOutput?: object;
  }
) => {
  return prisma.organizationSchema.upsert({
    where: { brand360Id },
    create: { brand360Id, ...data },
    update: data,
  });
};

// ============================================
// AEO: Brand Identity Prism Operations
// ============================================

export const getBrandIdentityPrismByBrand360Id = async (brand360Id: string) => {
  return prisma.brandIdentityPrism.findUnique({
    where: { brand360Id },
  });
};

export const upsertBrandIdentityPrism = async (
  brand360Id: string,
  data: {
    physique?: object;
    personalityScores?: object;
    personalityTraits?: string[];
    cultureValues?: string[];
    cultureDescription?: string;
    relationshipType?: string;
    relationshipDescription?: string;
    reflectionProfile?: object;
    selfImage?: string;
    inferredByAgent?: boolean;
    confidence?: number;
  }
) => {
  return prisma.brandIdentityPrism.upsert({
    where: { brand360Id },
    create: { brand360Id, ...data },
    update: data,
  });
};

// ============================================
// AEO: Brand Archetype Operations
// ============================================

export const getBrandArchetypeByBrand360Id = async (brand360Id: string) => {
  return prisma.brandArchetype.findUnique({
    where: { brand360Id },
  });
};

export const upsertBrandArchetype = async (
  brand360Id: string,
  data: {
    primaryArchetype: string;
    primaryScore?: number;
    secondaryArchetype?: string;
    secondaryScore?: number;
    expectedTone?: string[];
    expectedDepth?: string;
    expectedCitations?: boolean;
    expectedHumor?: string;
    archetypeScores?: object;
  }
) => {
  return prisma.brandArchetype.upsert({
    where: { brand360Id },
    create: { brand360Id, ...data },
    update: data,
  });
};

// ============================================
// AEO: Brand Voice Profile Operations
// ============================================

export const getBrandVoiceProfileByBrand360Id = async (brand360Id: string) => {
  return prisma.brandVoiceProfile.findUnique({
    where: { brand360Id },
  });
};

export const upsertBrandVoiceProfile = async (
  brand360Id: string,
  data: {
    voiceSpectrums?: object;
    primaryTone?: string;
    secondaryTones?: string[];
    vocabularyLevel?: string;
    sentenceStyle?: string;
    approvedPhrases?: string[];
    bannedPhrases?: string[];
    bannedTopics?: string[];
    voiceSamples?: string[];
    voiceEmbedding?: number[];
  }
) => {
  return prisma.brandVoiceProfile.upsert({
    where: { brand360Id },
    create: { brand360Id, ...data },
    update: data,
  });
};

// ============================================
// AEO: Competitor Graph Operations
// ============================================

export const getCompetitorGraphByBrand360Id = async (brand360Id: string) => {
  return prisma.competitorGraph.findUnique({
    where: { brand360Id },
    include: { competitors: true },
  });
};

export const upsertCompetitorGraph = async (
  brand360Id: string,
  data: {
    lastCrawled?: Date;
    discoverySource?: string;
  }
) => {
  return prisma.competitorGraph.upsert({
    where: { brand360Id },
    create: { brand360Id, ...data },
    update: data,
  });
};

export const addCompetitorToGraph = async (
  competitorGraphId: string,
  data: {
    name: string;
    website?: string;
    description?: string;
    logoUrl?: string;
    competitorType: string;
    threatLevel: string;
    marketPosition?: string;
    pricingTier?: string;
    strengths?: string[];
    weaknesses?: string[];
    discoveredBy: string;
  }
) => {
  return prisma.competitor.create({
    data: { competitorGraphId, ...data },
  });
};

export const deleteCompetitorFromGraph = async (competitorId: string) => {
  return prisma.competitor.delete({
    where: { id: competitorId },
  });
};

// ============================================
// AEO: Claim Locker Operations
// ============================================

export const getClaimLockerByBrand360Id = async (brand360Id: string) => {
  return prisma.claimLocker.findUnique({
    where: { brand360Id },
    include: { claims: true },
  });
};

export const upsertClaimLocker = async (brand360Id: string) => {
  return prisma.claimLocker.upsert({
    where: { brand360Id },
    create: { brand360Id },
    update: {},
  });
};

export const addClaimToLocker = async (
  claimLockerId: string,
  data: {
    claimText: string;
    category?: string;
    verificationStatus?: string;
    sourceUrl?: string;
    sourceType?: string;
    approvedDate?: Date;
    expiresAt?: Date;
    confidenceScore?: number;
    supportingEvidence?: string[];
  }
) => {
  return prisma.claim.create({
    data: { claimLockerId, ...data },
  });
};

export const updateClaim = async (
  claimId: string,
  data: {
    verificationStatus?: string;
    approvedDate?: Date;
    expiresAt?: Date;
    confidenceScore?: number;
    supportingEvidence?: string[];
  }
) => {
  return prisma.claim.update({
    where: { id: claimId },
    data,
  });
};

export const deleteClaim = async (claimId: string) => {
  return prisma.claim.delete({
    where: { id: claimId },
  });
};

// ============================================
// AEO: Customer Persona Operations
// ============================================

export const getCustomerPersonasByBrand360Id = async (brand360Id: string) => {
  return prisma.customerPersona.findMany({
    where: { brand360Id },
  });
};

export const createCustomerPersona = async (
  brand360Id: string,
  data: {
    personaName: string;
    demographics?: object;
    psychographics?: object;
    jobsToBeDone?: string[];
    painPoints?: string[];
    motivations?: string[];
    preferredChannels?: string[];
    decisionCriteria?: string[];
    objections?: string[];
    searchBehavior?: object;
    isPrimary?: boolean;
  }
) => {
  return prisma.customerPersona.create({
    data: { brand360Id, ...data } as any,
  });
};

export const updateCustomerPersona = async (
  personaId: string,
  data: Partial<{
    personaName: string;
    demographics: object;
    psychographics: object;
    jobsToBeDone: string[];
    motivations: string[];
    preferredChannels: string[];
    decisionCriteria: string[];
    searchBehavior: object;
    isPrimary: boolean;
  }>
) => {
  return prisma.customerPersona.update({
    where: { id: personaId },
    data: data as any,
  });
};

export const deleteCustomerPersona = async (personaId: string) => {
  return prisma.customerPersona.delete({
    where: { id: personaId },
  });
};

// ============================================
// AEO: Product Operations (Enhanced)
// ============================================

export const getAEOProductsByBrand360Id = async (brand360Id: string) => {
  return prisma.product.findMany({
    where: { brand360Id },
  });
};

export const createAEOProduct = async (
  brand360Id: string,
  data: {
    name: string;
    schemaType?: string;
    sku?: string;
    gtin?: string;
    category?: string;
    description?: string;
    shortDescription?: string;
    features?: string[];
    benefits?: string[];
    useCases?: string[];
    pricingJson?: object;
    url?: string;
    imageUrls?: string[];
    specifications?: object;
    awards?: string[];
    certifications?: string[];
    isActive?: boolean;
    schemaOrgOutput?: object;
  }
) => {
  return prisma.product.create({
    data: { brand360Id, ...data } as any,
  });
};

export const updateAEOProduct = async (
  productId: string,
  data: Partial<{
    name: string;
    schemaType: string;
    sku: string;
    gtin: string;
    category: string;
    description: string;
    shortDescription: string;
    features: string[];
    benefits: string[];
    useCases: string[];
    pricingJson: object;
    url: string;
    imageUrls: string[];
    specifications: object;
    awards: string[];
    certifications: string[];
    isActive: boolean;
    schemaOrgOutput: object;
  }>
) => {
  return prisma.product.update({
    where: { id: productId },
    data,
  });
};

export const deleteAEOProduct = async (productId: string) => {
  return prisma.product.delete({
    where: { id: productId },
  });
};

// ============================================
// AEO: Generated Prompt Operations
// ============================================

export const getGeneratedPromptsByBrand360Id = async (brand360Id: string) => {
  return prisma.generatedPrompt.findMany({
    where: { brand360Id },
    orderBy: { createdAt: 'desc' },
  });
};

export const getGeneratedPromptsByCategory = async (
  brand360Id: string,
  category: string
) => {
  return prisma.generatedPrompt.findMany({
    where: { brand360Id, category },
    orderBy: { createdAt: 'desc' },
  });
};

export const createGeneratedPrompt = async (
  brand360Id: string,
  data: {
    category: string;
    promptText: string;
    intent?: string;
    targetPersonaId?: string;
    targetCompetitorId?: string;
    expectedBrandMention?: boolean;
    expectedCitations?: boolean;
    riskLevel?: string;
    tags?: string[];
  }
) => {
  return prisma.generatedPrompt.create({
    data: { brand360Id, ...data } as any,
  });
};

export const updateGeneratedPrompt = async (
  promptId: string,
  data: {
    lastTestedAt?: Date;
    testCount?: number;
  }
) => {
  return prisma.generatedPrompt.update({
    where: { id: promptId },
    data: data as any,
  });
};

export const deleteGeneratedPrompt = async (promptId: string) => {
  return prisma.generatedPrompt.delete({
    where: { id: promptId },
  });
};

// ============================================
// AEO: Perception Scan Operations
// ============================================

export const getPerceptionScansByBrand360Id = async (brand360Id: string) => {
  return prisma.perceptionScan.findMany({
    where: { brand360Id },
    include: { results: true },
    orderBy: { createdAt: 'desc' },
  });
};

export const createPerceptionScan = async (
  brand360Id: string,
  data: {
    scanType?: string;
    promptsUsed?: string[];
    modelsUsed?: string[];
  }
) => {
  return prisma.perceptionScan.create({
    data: {
      brand360Id,
      status: 'pending',
      ...data
    },
  });
};

export const updatePerceptionScan = async (
  scanId: string,
  data: {
    status?: string;
    completedAt?: Date;
    aggregateScores?: object;
    quadrantPosition?: string;
  }
) => {
  return prisma.perceptionScan.update({
    where: { id: scanId },
    data,
  });
};

export const addPerceptionResult = async (
  perceptionScanId: string,
  brand360Id: string,
  data: {
    promptId: string;
    modelUsed: string;
    rawResponse: string;
    faithfulnessScore?: number;
    shareOfVoice?: number;
    sentimentScore?: number;
    voiceAlignmentScore?: number;
    hallucinationRisk?: number;
    brandMentioned?: boolean;
    competitorsMentioned?: string[];
    citationUrls?: string[];
    evaluationNotes?: string;
  }
) => {
  return prisma.aIPerceptionResult.create({
    data: { perceptionScanId, brand360Id, ...data } as any,
  });
};

// ============================================
// AEO: Perception Insight Operations
// ============================================

export const getPerceptionInsightsByBrand360Id = async (brand360Id: string) => {
  return prisma.perceptionInsight.findMany({
    where: { brand360Id },
    orderBy: { createdAt: 'desc' },
  });
};

export const createPerceptionInsight = async (
  brand360Id: string,
  data: {
    insightType: string;
    title: string;
    description: string;
    severity?: string;
    affectedArea?: string;
    suggestedAction?: string;
    relatedPromptIds?: string[];
    relatedResultIds?: string[];
    isResolved?: boolean;
  }
) => {
  return prisma.perceptionInsight.create({
    data: { brand360Id, ...data } as any,
  });
};

export const updatePerceptionInsight = async (
  insightId: string,
  data: {
    isResolved?: boolean;
    resolvedAt?: Date;
  }
) => {
  return prisma.perceptionInsight.update({
    where: { id: insightId },
    data,
  });
};

// ============================================
// AEO: Correction Workflow Operations
// ============================================

export const getCorrectionWorkflowsByBrand360Id = async (brand360Id: string) => {
  return prisma.correctionWorkflow.findMany({
    where: { brand360Id },
    orderBy: { createdAt: 'desc' },
  });
};

export const createCorrectionWorkflow = async (
  brand360Id: string,
  data: {
    triggerType: string;
    targetField: string;
    currentValue?: string;
    suggestedValue?: string;
    rationale?: string;
    relatedInsightId?: string;
  }
) => {
  return prisma.correctionWorkflow.create({
    data: {
      brand360Id,
      status: 'pending',
      ...data
    } as any,
  });
};

export const updateCorrectionWorkflow = async (
  workflowId: string,
  data: {
    status?: string;
    approvedBy?: string;
    approvedAt?: Date;
    rejectionReason?: string;
    appliedAt?: Date;
  }
) => {
  return prisma.correctionWorkflow.update({
    where: { id: workflowId },
    data,
  });
};

// ============================================
// AEO: Risk Factors Operations
// ============================================

export const getRiskFactorsByBrand360Id = async (brand360Id: string) => {
  return prisma.riskFactors.findUnique({
    where: { brand360Id },
  });
};

export const upsertRiskFactors = async (
  brand360Id: string,
  data: {
    adversarialPrompts?: string[];
    knownMisrepresentations?: object[];
    competitorFalsehoods?: object[];
    hallucinationPatterns?: string[];
    riskScore?: number;
    lastAssessedAt?: Date;
  }
) => {
  return prisma.riskFactors.upsert({
    where: { brand360Id },
    create: { brand360Id, ...data } as any,
    update: data as any,
  });
};
