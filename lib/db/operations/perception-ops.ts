// AEO: Perception Scans, Prompts, Insights, and Corrections Operations

import prisma from '../prisma';

// ============================================
// Generated Prompt Operations
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
// Perception Scan Operations
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
// Perception Insight Operations
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
// Correction Workflow Operations
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
