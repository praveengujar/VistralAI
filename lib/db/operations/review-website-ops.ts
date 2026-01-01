// Review Website Integration Database Operations

import prisma from '../prisma';

// ============================================
// Review Category Operations
// ============================================

export const getAllReviewCategories = async () => {
  return prisma.reviewCategory.findMany({
    include: {
      websites: {
        where: { isActive: true },
        orderBy: { priority: 'desc' },
      },
    },
    orderBy: { name: 'asc' },
  });
};

export const getReviewCategoryById = async (id: string) => {
  return prisma.reviewCategory.findUnique({
    where: { id },
    include: {
      websites: {
        where: { isActive: true },
        orderBy: { priority: 'desc' },
      },
    },
  });
};

export const getReviewCategoryBySlug = async (slug: string) => {
  return prisma.reviewCategory.findUnique({
    where: { slug },
    include: {
      websites: {
        where: { isActive: true },
        orderBy: { priority: 'desc' },
      },
    },
  });
};

export const createReviewCategory = async (data: {
  name: string;
  slug: string;
  description?: string;
  industryKeywords?: string[];
}) => {
  return prisma.reviewCategory.create({
    data,
  });
};

export const updateReviewCategory = async (
  id: string,
  data: {
    name?: string;
    slug?: string;
    description?: string;
    industryKeywords?: string[];
  }
) => {
  return prisma.reviewCategory.update({
    where: { id },
    data,
  });
};

export const deleteReviewCategory = async (id: string) => {
  return prisma.reviewCategory.delete({
    where: { id },
  });
};

// ============================================
// Review Website Operations
// ============================================

export const getReviewWebsitesByCategory = async (categoryId: string) => {
  return prisma.reviewWebsite.findMany({
    where: { categoryId, isActive: true },
    orderBy: { priority: 'desc' },
  });
};

export const getAllActiveReviewWebsites = async () => {
  return prisma.reviewWebsite.findMany({
    where: { isActive: true },
    include: {
      category: true,
    },
    orderBy: [{ priority: 'desc' }, { name: 'asc' }],
  });
};

export const getReviewWebsiteById = async (id: string) => {
  return prisma.reviewWebsite.findUnique({
    where: { id },
    include: {
      category: true,
    },
  });
};

export const getReviewWebsiteBySlug = async (categoryId: string, slug: string) => {
  return prisma.reviewWebsite.findUnique({
    where: {
      categoryId_slug: { categoryId, slug },
    },
    include: {
      category: true,
    },
  });
};

export const createReviewWebsite = async (data: {
  categoryId: string;
  name: string;
  slug: string;
  domain: string;
  logoUrl?: string;
  reviewType?: string;
  audienceType?: string;
  citationFormat?: string;
  isActive?: boolean;
  priority?: number;
}) => {
  return prisma.reviewWebsite.create({
    data,
  });
};

export const updateReviewWebsite = async (
  id: string,
  data: {
    name?: string;
    slug?: string;
    domain?: string;
    logoUrl?: string;
    reviewType?: string;
    audienceType?: string;
    citationFormat?: string;
    isActive?: boolean;
    priority?: number;
  }
) => {
  return prisma.reviewWebsite.update({
    where: { id },
    data,
  });
};

export const deleteReviewWebsite = async (id: string) => {
  return prisma.reviewWebsite.delete({
    where: { id },
  });
};

// ============================================
// Brand Category Mapping Operations
// ============================================

export const getBrandCategoryMappings = async (brand360Id: string) => {
  return prisma.brandCategoryMapping.findMany({
    where: { brand360Id },
    include: {
      category: {
        include: {
          websites: {
            where: { isActive: true },
            orderBy: { priority: 'desc' },
          },
        },
      },
    },
    orderBy: { isPrimary: 'desc' },
  });
};

export const getBrandCategoryMapping = async (brand360Id: string, categoryId: string) => {
  return prisma.brandCategoryMapping.findUnique({
    where: {
      brand360Id_categoryId: { brand360Id, categoryId },
    },
    include: {
      category: true,
    },
  });
};

export const upsertBrandCategoryMapping = async (
  brand360Id: string,
  categoryId: string,
  data: {
    isPrimary?: boolean;
    confidence?: number;
    source?: string;
  }
) => {
  return prisma.brandCategoryMapping.upsert({
    where: {
      brand360Id_categoryId: { brand360Id, categoryId },
    },
    create: {
      brand360Id,
      categoryId,
      ...data,
    },
    update: data,
    include: {
      category: true,
    },
  });
};

export const deleteBrandCategoryMapping = async (brand360Id: string, categoryId: string) => {
  return prisma.brandCategoryMapping.delete({
    where: {
      brand360Id_categoryId: { brand360Id, categoryId },
    },
  });
};

export const deleteAllBrandCategoryMappings = async (brand360Id: string) => {
  return prisma.brandCategoryMapping.deleteMany({
    where: { brand360Id },
  });
};

// Get review websites relevant to a brand (based on its category mappings)
export const getReviewWebsitesForBrand = async (brand360Id: string) => {
  const mappings = await getBrandCategoryMappings(brand360Id);

  if (mappings.length === 0) {
    return [];
  }

  const categoryIds = mappings.map((m) => m.categoryId);

  return prisma.reviewWebsite.findMany({
    where: {
      categoryId: { in: categoryIds },
      isActive: true,
    },
    include: {
      category: true,
    },
    orderBy: [{ priority: 'desc' }, { name: 'asc' }],
  });
};

// ============================================
// Prompt Review Site Usage Operations
// ============================================

export const createPromptReviewSiteUsage = async (
  promptId: string,
  websiteId: string,
  citationStyle: string = 'inline'
) => {
  return prisma.promptReviewSiteUsage.create({
    data: {
      promptId,
      websiteId,
      citationStyle,
    },
    include: {
      website: true,
    },
  });
};

export const getPromptReviewSiteUsages = async (promptId: string) => {
  return prisma.promptReviewSiteUsage.findMany({
    where: { promptId },
    include: {
      website: {
        include: {
          category: true,
        },
      },
    },
  });
};

export const deletePromptReviewSiteUsage = async (promptId: string, websiteId: string) => {
  return prisma.promptReviewSiteUsage.delete({
    where: {
      promptId_websiteId: { promptId, websiteId },
    },
  });
};

export const deleteAllPromptReviewSiteUsages = async (promptId: string) => {
  return prisma.promptReviewSiteUsage.deleteMany({
    where: { promptId },
  });
};

// Bulk create usages for a prompt
export const createPromptReviewSiteUsages = async (
  promptId: string,
  websiteIds: string[],
  citationStyle: string = 'inline'
) => {
  // Create usages one by one, skipping duplicates
  const results = [];
  for (const websiteId of websiteIds) {
    try {
      const usage = await prisma.promptReviewSiteUsage.upsert({
        where: {
          promptId_websiteId: {
            promptId,
            websiteId,
          },
        },
        update: { citationStyle },
        create: {
          promptId,
          websiteId,
          citationStyle,
        },
      });
      results.push(usage);
    } catch {
      // Skip if there's a conflict
      continue;
    }
  }
  return { count: results.length };
};
