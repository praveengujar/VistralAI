// AEO: Brand 360 Profile and Related Entity Operations

import prisma from '../prisma';

// ============================================
// Brand 360 Profile Operations
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
// Entity Home Operations
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
// Organization Schema Operations
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
// Brand Identity Prism Operations
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
// Brand Archetype Operations
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
// Brand Voice Profile Operations
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
// Claim Locker Operations
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
// Customer Persona Operations
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
// Risk Factors Operations
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
