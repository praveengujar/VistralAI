// Website Analyzer Service
// Crawls and analyzes a website to extract Brand 360° data
// Uses Firecrawl for crawling and Claude for extraction

import {
  Brand360Data,
  BrandIdentity,
  MarketPosition,
  CompetitorProfile,
  ProductDetail,
} from '@/types';
import { getCrawler } from '@/lib/services/crawler/FirecrawlService';
import type { CrawlResult } from '@/lib/services/crawler';
import { createBrandIntelligence } from '@/lib/services/llm/BrandIntelligence';

/**
 * Truncate content to prevent token overflow
 * Keeps first 80% and last 20% to preserve important context
 */
function truncateContent(content: string, maxTokens: number = 30000): string {
  // Handle undefined/null content
  if (!content) {
    console.warn('[WebsiteAnalyzer] Content is undefined or empty');
    return '';
  }

  // Rough estimate: 1 token ≈ 4 characters
  const maxChars = maxTokens * 4;

  if (content.length <= maxChars) {
    return content;
  }

  console.log(`[WebsiteAnalyzer] Truncating content from ${content.length} to ${maxChars} chars (~${maxTokens} tokens)`);

  // Keep first 80% and last 20% to preserve important context
  const firstPart = content.substring(0, Math.floor(maxChars * 0.8));
  const lastPart = content.substring(content.length - Math.floor(maxChars * 0.2));

  return firstPart + '\n\n[... content truncated ...]\n\n' + lastPart;
}

/**
 * Truncate crawl result content to prevent token overflow
 */
function truncateCrawlResult(crawlResult: CrawlResult, maxTokens: number = 30000): CrawlResult {
  // Truncate rawText
  const truncatedRawText = truncateContent(crawlResult.rawText || '', maxTokens);

  // Truncate homepage content
  const truncatedHomepage = {
    ...crawlResult.homepage,
    content: truncateContent(crawlResult.homepage.content || '', maxTokens),
  };

  return {
    ...crawlResult,
    homepage: truncatedHomepage,
    rawText: truncatedRawText,
  };
}

export interface WebsiteAnalysisResult {
  url: string;
  extractedData: Partial<Brand360Data>;
  confidence: number; // 0-100
  pagesAnalyzed: number;
  suggestions: string[];
  warnings: string[];
  crawlTime: number; // milliseconds
}

export interface WebsiteCrawlOptions {
  maxPages?: number; // Max pages to crawl (default: 20)
  includeSubdomains?: boolean; // Crawl subdomains (default: false)
  depth?: number; // Max crawl depth (default: 3)
}

/**
 * Analyze a website and extract Brand 360° data
 *
 * Uses Firecrawl to crawl the website and BrandIntelligence (Claude) to extract data.
 *
 * @param url - Website URL to analyze
 * @param brandId - Brand ID to associate the data with
 * @param options - Crawl options
 */
export async function analyzeWebsite(
  brandId: string,
  url: string,
  options: WebsiteCrawlOptions = {}
): Promise<WebsiteAnalysisResult> {
  const startTime = Date.now();

  console.log(`[WebsiteAnalyzer] Starting analysis for ${url}`);

  // 1. Crawl the website
  const crawler = getCrawler({
    maxPages: options.maxPages,
    maxDepth: options.depth,
  });

  // Use crawlBrandWebsite which returns CrawlResult
  const crawlResult = await crawler.crawlBrandWebsite(url);

  console.log(`[WebsiteAnalyzer] Crawl complete. Pages: ${crawlResult.crawledUrls.length}`);

  // 2. Extract data using BrandIntelligence
  const brandIntelligence = createBrandIntelligence();

  // Extract domain for brand name guessing
  let domain = '';
  try {
    domain = new URL(url).hostname.replace('www.', '');
  } catch (e) {
    domain = url;
  }
  const brandName = domain.split('.')[0];
  const brandNameCapitalized = brandName.charAt(0).toUpperCase() + brandName.slice(1);

  // Truncate content to prevent token overflow (114k → 30k tokens)
  const truncatedCrawlResult = truncateCrawlResult(crawlResult, 30000);
  console.log(`[WebsiteAnalyzer] Content prepared for LLM processing`);

  // Try comprehensive extraction first (more efficient - 1 API call instead of 3)
  let comprehensiveProfile = null;
  try {
    comprehensiveProfile = await brandIntelligence.extractComprehensiveBrandProfile(truncatedCrawlResult);
    console.log('[WebsiteAnalyzer] Comprehensive profile result:',
      comprehensiveProfile ? 'SUCCESS' : 'NULL',
      comprehensiveProfile?.brandIdentity?.mission?.statement ? `mission: "${comprehensiveProfile.brandIdentity.mission.statement.substring(0, 50)}..."` : 'mission: EMPTY'
    );
  } catch (error) {
    console.warn('[WebsiteAnalyzer] Comprehensive extraction failed, falling back to individual extractions:', error);
  }

  let confidenceVal = 0.8;
  let identity: Partial<BrandIdentity>;
  let competitors: CompetitorProfile[];
  let products: ProductDetail[];
  let marketPosition: Partial<MarketPosition>;

  if (comprehensiveProfile && comprehensiveProfile.brandIdentity) {
    // Map comprehensive profile to existing structure
    const profile = comprehensiveProfile;

    identity = {
      brandId,
      mission: profile.brandIdentity?.mission?.statement || '',
      vision: profile.brandIdentity?.vision?.statement || '',
      values: profile.brandIdentity?.coreValues?.map((v: any) => v.value) || [],
      brandStory: profile.brandIdentity?.positioningStatement || '',
      uniqueSellingPoints: profile.brandIdentity?.uniqueValueProposition ? [profile.brandIdentity.uniqueValueProposition] : [],
      brandVoice: {
        tone: profile.brandVoice?.personalityTraits || [],
        keywords: profile.brandVoice?.signaturePhrases || [],
        avoidWords: [],
      },
      brandPersonality: profile.brandVoice?.primaryArchetype || '',
      tagline: profile.brandIdentity?.tagline || undefined,
    };

    competitors = (profile.competitiveLandscape?.competitors || []).map((comp: any, index: number) => ({
      id: `comp-${Date.now()}-${index}`,
      brandId,
      name: comp.name,
      domain: '',
      isPrimary: comp.type === 'direct',
      strengths: comp.theirAdvantage ? [comp.theirAdvantage] : [],
      weaknesses: [],
      differentiators: comp.ourAdvantage ? [comp.ourAdvantage] : [],
      competitionType: comp.type,
      confidenceScore: comp.confidence || 0.8,
      reasonForSelection: comp.ourAdvantage || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    products = (profile.productPortfolio?.heroOfferings || []).map((prod: any, index: number) => ({
      id: `prod-${Date.now()}-${index}`,
      brandId,
      name: prod.name,
      category: profile.productPortfolio?.categories?.[0]?.name || 'Product',
      description: prod.description || '',
      features: prod.keyBenefits || [],
      benefits: [],
      useCases: [],
      targetAudience: [profile.targetAudience?.primarySegment?.name || ''],
      pricing: { currency: 'USD', amount: 0 },
      url: url,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    marketPosition = {
      brandId,
      targetAudiences: profile.targetAudience?.primarySegment ? [{
        id: `aud-${Date.now()}`,
        name: profile.targetAudience.primarySegment.name,
        demographics: {
          ageRange: profile.targetAudience.primarySegment.demographics?.ageRange,
          income: profile.targetAudience.primarySegment.demographics?.income,
          // Mapping other optional demographics
          location: profile.targetAudience.primarySegment.demographics?.location ? [profile.targetAudience.primarySegment.demographics.location] : [],
          gender: profile.targetAudience.primarySegment.demographics?.gender
        },
        psychographics: {
          painPoints: profile.targetAudience.primarySegment.painPoints || [],
          interests: profile.targetAudience.primarySegment.psychographics?.interests || [],
          // motivations mapped implicitly if needed, but not in interface explicitly as separate field other than above
        },
        isPrimary: true
      }] : [],
      positioning: profile.brandIdentity?.positioningStatement || '',
      pricingStrategy: profile.productPortfolio?.pricePositioning === 'value' ? 'value' :
        profile.productPortfolio?.pricePositioning === 'premium' ? 'premium' : 'competitive',
      industryVerticals: profile.brandIdentity?.industry ? [profile.brandIdentity.industry] : [],
    };

    confidenceVal = profile.profileMetadata?.overallConfidence || 0.8;
    console.log('[WebsiteAnalyzer] Used comprehensive profile extraction');
    console.log('[WebsiteAnalyzer] Mapped identity:', {
      mission: identity.mission?.substring(0, 50) || 'EMPTY',
      vision: identity.vision?.substring(0, 50) || 'EMPTY',
      valuesCount: identity.values?.length || 0,
    });
  } else {
    // Fall back to individual extractions (sequential to avoid rate limiting)
    console.log('[WebsiteAnalyzer] Using individual extractions (sequential)');

    // Sequential execution with delays to prevent rate limiting
    console.log('[WebsiteAnalyzer] Extracting brand identity...');
    const identityExtraction = await brandIntelligence.extractBrandIdentity(truncatedCrawlResult, domain);

    console.log('[WebsiteAnalyzer] Waiting 2s before next call...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('[WebsiteAnalyzer] Identifying competitors...');
    const competitorsExtraction = await brandIntelligence.identifyCompetitors(brandNameCapitalized, truncatedCrawlResult);

    console.log('[WebsiteAnalyzer] Waiting 2s before next call...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('[WebsiteAnalyzer] Categorizing products...');
    const productsExtraction = await brandIntelligence.categorizeProducts(truncatedCrawlResult);

    const { targetAudienceSummary, ...restIdentity } = identityExtraction as any;
    identity = {
      ...restIdentity,
      brandId,
    };


    competitors = competitorsExtraction.map((comp, index) => ({
      id: `comp-${Date.now()}-${index}`,
      brandId,
      name: comp.name,
      domain: comp.website || '',
      isPrimary: comp.competitionType === 'direct',
      strengths: [],
      weaknesses: [],
      differentiators: [],
      competitionType: comp.competitionType,
      confidenceScore: comp.confidence,
      reasonForSelection: comp.rationale,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    products = productsExtraction.map((prod, index) => ({
      id: `prod-${Date.now()}-${index}`,
      brandId,
      name: prod.name,
      category: 'Product',
      description: prod.description,
      features: prod.keyFeatures,
      benefits: [],
      useCases: [],
      targetAudience: [prod.targetMarket],
      pricing: { currency: 'USD', amount: 0 },
      url: url,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    marketPosition = {
      brandId,
      targetAudiences: [],
      positioning: identityExtraction.mission,
    };

    confidenceVal = identityExtraction.confidence || 0.8;
  }

  console.log('[WebsiteAnalyzer] Extraction complete');

  // Extract brand name from comprehensive profile or domain
  let extractedBrandName = '';
  if (comprehensiveProfile?.brandIdentity?.brandName) {
    extractedBrandName = comprehensiveProfile.brandIdentity.brandName;
  } else {
    // Fallback to domain-based name
    extractedBrandName = brandNameCapitalized;
  }

  const extractedData: any = {
    brandId,
    brandName: extractedBrandName,
    domain: domain,
    identity,
    marketPosition,
    competitors,
    products,
  };

  const finalConfidence = confidenceVal * 100;

  return {
    url,
    extractedData,
    confidence: finalConfidence,
    pagesAnalyzed: crawlResult.crawledUrls.length,
    suggestions: generateWebsiteSuggestions(extractedData, crawlResult.crawledUrls.length),
    warnings: generateWebsiteWarnings(extractedData, finalConfidence),
    crawlTime: Date.now() - startTime,
  };
}

/**
 * Generate suggestions based on website analysis
 */
function generateWebsiteSuggestions(
  extractedData: Partial<Brand360Data>,
  pagesAnalyzed: number
): string[] {
  const suggestions: string[] = [];

  if (pagesAnalyzed < 5) {
    suggestions.push('Consider adding more content pages for richer analysis');
  }

  if (!extractedData.identity?.tagline) {
    suggestions.push('Add a clear tagline or slogan to your homepage');
  }

  if (extractedData.products && extractedData.products.length < 3) {
    suggestions.push('Consider adding more product details to your website');
  }

  if (!extractedData.identity?.foundedYear) {
    suggestions.push('Add company founding year to your About page for credibility');
  }

  if (suggestions.length === 0) {
    suggestions.push('Great! Your website has comprehensive information');
  }

  return suggestions;
}

/**
 * Generate warnings based on website analysis
 */
function generateWebsiteWarnings(
  extractedData: Partial<Brand360Data>,
  confidence: number
): string[] {
  const warnings: string[] = [];

  if (confidence < 80) {
    warnings.push('Some information may need manual verification');
  }

  if (!extractedData.identity?.mission) {
    warnings.push('Mission statement not clearly stated on website');
  }

  if (!extractedData.products || extractedData.products.length === 0) {
    warnings.push('No product pages detected - consider adding product catalog');
  }

  return warnings;
}

/**
 * Quick website validation (checks if URL is accessible)
 */
export async function validateWebsite(url: string): Promise<{
  valid: boolean;
  error?: string;
  redirectUrl?: string;
}> {
  try {
    // In production: Actually fetch the URL and check response
    // For MVP: Basic URL validation
    new URL(url);

    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return { valid: true };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || 'Invalid URL',
    };
  }
}
