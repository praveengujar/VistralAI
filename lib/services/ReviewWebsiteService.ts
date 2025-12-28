// Review Website Service
// Manages review website categories, mappings, and prompt integration

import {
  getAllReviewCategories,
  getReviewCategoryById,
  getReviewCategoryBySlug,
  getReviewWebsitesByCategory,
  getAllActiveReviewWebsites,
  getBrandCategoryMappings,
  upsertBrandCategoryMapping,
  deleteBrandCategoryMapping,
  deleteAllBrandCategoryMappings,
  getReviewWebsitesForBrand,
  createPromptReviewSiteUsages,
  getPromptReviewSiteUsages,
  deleteAllPromptReviewSiteUsages,
} from '@/lib/db/operations/review-website-ops';

import type {
  ReviewCategory,
  ReviewWebsite,
  BrandCategoryMapping,
} from '@prisma/client';

// Types for service responses
export interface ReviewCategoryWithWebsites extends ReviewCategory {
  websites: ReviewWebsite[];
}

export interface BrandCategoryMappingWithCategory extends BrandCategoryMapping {
  category: ReviewCategoryWithWebsites;
}

export interface ReviewWebsiteWithCategory extends ReviewWebsite {
  category: ReviewCategory;
}

export interface CategoryDetectionResult {
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  confidence: number;
  matchedKeywords: string[];
}

export class ReviewWebsiteService {
  /**
   * Get all review categories with their websites
   */
  async getAllCategories(): Promise<ReviewCategoryWithWebsites[]> {
    return getAllReviewCategories() as Promise<ReviewCategoryWithWebsites[]>;
  }

  /**
   * Get a category by ID
   */
  async getCategoryById(id: string): Promise<ReviewCategoryWithWebsites | null> {
    return getReviewCategoryById(id) as Promise<ReviewCategoryWithWebsites | null>;
  }

  /**
   * Get a category by slug
   */
  async getCategoryBySlug(slug: string): Promise<ReviewCategoryWithWebsites | null> {
    return getReviewCategoryBySlug(slug) as Promise<ReviewCategoryWithWebsites | null>;
  }

  /**
   * Get websites for a specific category
   */
  async getWebsitesByCategory(categoryId: string): Promise<ReviewWebsite[]> {
    return getReviewWebsitesByCategory(categoryId);
  }

  /**
   * Get all active review websites
   */
  async getAllActiveWebsites(): Promise<ReviewWebsiteWithCategory[]> {
    return getAllActiveReviewWebsites() as Promise<ReviewWebsiteWithCategory[]>;
  }

  /**
   * Get brand's category mappings
   */
  async getBrandCategories(brand360Id: string): Promise<BrandCategoryMappingWithCategory[]> {
    return getBrandCategoryMappings(brand360Id) as Promise<BrandCategoryMappingWithCategory[]>;
  }

  /**
   * Get review websites relevant to a brand based on its category mappings
   */
  async getRelevantWebsites(brand360Id: string): Promise<ReviewWebsiteWithCategory[]> {
    return getReviewWebsitesForBrand(brand360Id) as Promise<ReviewWebsiteWithCategory[]>;
  }

  /**
   * Map a brand to a category
   */
  async mapBrandToCategory(
    brand360Id: string,
    categoryId: string,
    options: {
      isPrimary?: boolean;
      confidence?: number;
      source?: 'manual' | 'auto' | 'ai';
    } = {}
  ): Promise<BrandCategoryMappingWithCategory> {
    return upsertBrandCategoryMapping(brand360Id, categoryId, {
      isPrimary: options.isPrimary ?? false,
      confidence: options.confidence,
      source: options.source ?? 'manual',
    }) as Promise<BrandCategoryMappingWithCategory>;
  }

  /**
   * Remove a brand's category mapping
   */
  async removeBrandCategory(brand360Id: string, categoryId: string): Promise<void> {
    await deleteBrandCategoryMapping(brand360Id, categoryId);
  }

  /**
   * Remove all category mappings for a brand
   */
  async removeAllBrandCategories(brand360Id: string): Promise<void> {
    await deleteAllBrandCategoryMappings(brand360Id);
  }

  /**
   * Auto-detect relevant categories based on brand data
   * Uses industry keywords to match categories
   */
  async autoDetectCategories(
    brand360Id: string,
    brandData: {
      category?: string;
      industry?: string;
      description?: string;
      products?: Array<{ category?: string; description?: string }>;
      industryVerticals?: string[];
    }
  ): Promise<CategoryDetectionResult[]> {
    const categories = await this.getAllCategories();
    const results: CategoryDetectionResult[] = [];

    // Collect all text to search through
    const searchText = [
      brandData.category,
      brandData.industry,
      brandData.description,
      ...(brandData.industryVerticals || []),
      ...(brandData.products?.map((p) => p.category) || []),
      ...(brandData.products?.map((p) => p.description) || []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (!searchText) {
      console.log('[ReviewWebsiteService] No search text found, returning empty results');
      return [];
    }

    console.log('[ReviewWebsiteService] Search text (first 500 chars):', searchText.substring(0, 500));

    for (const category of categories) {
      const matchedKeywords: string[] = [];

      for (const keyword of category.industryKeywords) {
        // Use word boundary matching to avoid false positives
        // e.g., "jobs" shouldn't match "Steve Jobs", "auto" shouldn't match "automation"
        const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`);
        if (regex.test(searchText)) {
          matchedKeywords.push(keyword);
          console.log(`[ReviewWebsiteService] Matched keyword "${keyword}" for category "${category.name}"`);
        }
      }

      if (matchedKeywords.length > 0) {
        // Calculate confidence based on matched keywords
        const confidence = Math.min(
          1.0,
          matchedKeywords.length / Math.max(category.industryKeywords.length, 3) +
            0.2 * matchedKeywords.length
        );

        results.push({
          categoryId: category.id,
          categoryName: category.name,
          categorySlug: category.slug,
          confidence,
          matchedKeywords,
        });
      }
    }

    // Sort by confidence descending
    results.sort((a, b) => b.confidence - a.confidence);

    return results;
  }

  /**
   * Auto-detect and apply category mappings for a brand
   */
  async autoMapBrandCategories(
    brand360Id: string,
    brandData: {
      category?: string;
      industry?: string;
      description?: string;
      products?: Array<{ category?: string; description?: string }>;
      industryVerticals?: string[];
    },
    options: {
      minConfidence?: number;
      maxCategories?: number;
      clearExisting?: boolean;
    } = {}
  ): Promise<BrandCategoryMappingWithCategory[]> {
    const minConfidence = options.minConfidence ?? 0.3;
    const maxCategories = options.maxCategories ?? 3;

    // Detect categories
    const detected = await this.autoDetectCategories(brand360Id, brandData);

    // Filter by confidence and limit
    const toApply = detected
      .filter((d) => d.confidence >= minConfidence)
      .slice(0, maxCategories);

    if (options.clearExisting) {
      await this.removeAllBrandCategories(brand360Id);
    }

    // Apply mappings
    const mappings: BrandCategoryMappingWithCategory[] = [];
    for (let i = 0; i < toApply.length; i++) {
      const detection = toApply[i];
      const mapping = await this.mapBrandToCategory(brand360Id, detection.categoryId, {
        isPrimary: i === 0,
        confidence: detection.confidence,
        source: 'auto',
      });
      mappings.push(mapping);
    }

    return mappings;
  }

  /**
   * Record which review sites were used in a prompt
   */
  async recordPromptUsage(
    promptId: string,
    websiteIds: string[],
    citationStyle: 'inline' | 'footnote' | 'list' = 'inline'
  ): Promise<void> {
    if (websiteIds.length === 0) return;

    // Clear existing usages
    await deleteAllPromptReviewSiteUsages(promptId);

    // Create new usages
    await createPromptReviewSiteUsages(promptId, websiteIds, citationStyle);
  }

  /**
   * Get review sites used in a prompt
   */
  async getPromptUsages(promptId: string) {
    return getPromptReviewSiteUsages(promptId);
  }

  /**
   * Get review websites grouped by category for UI display
   */
  async getWebsitesGroupedByCategory(): Promise<
    Array<{
      category: ReviewCategory;
      websites: ReviewWebsite[];
    }>
  > {
    const categories = await this.getAllCategories();

    return categories.map((category) => ({
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        industryKeywords: category.industryKeywords,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
      websites: category.websites,
    }));
  }

  /**
   * Get the top N review websites for a brand, prioritized by category mapping
   */
  async getTopWebsitesForBrand(
    brand360Id: string,
    limit: number = 5
  ): Promise<ReviewWebsiteWithCategory[]> {
    const websites = await this.getRelevantWebsites(brand360Id);
    return websites.slice(0, limit);
  }
}

// Singleton instance
export const reviewWebsiteService = new ReviewWebsiteService();
