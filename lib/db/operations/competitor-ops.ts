// Competitor Operations (Legacy and AEO)

import prisma from '../prisma';
import { CompetitorProfile } from '@/types';
import { transformCompetitorProfile } from './transforms';

// ============================================
// Legacy Competitor Profile Operations
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
