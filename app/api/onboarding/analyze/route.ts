/**
 * Onboarding Analysis API
 * POST /api/onboarding/analyze
 * Starts asynchronous brand profile analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getJobQueue, createAndTrackJob } from '@/lib/services/queue/JobQueue';
import { getCrawler } from '@/lib/services/crawler';
import { simulateWebsiteCrawl } from '@/lib/services/crawler/WebCrawler';
import { BrandIntelligence } from '@/lib/services/llm/BrandIntelligence';
import { ProductIngestion } from '@/lib/services/ingestion/ProductIngestion';

const analyzeSchema = z.object({
  websiteUrl: z.string().url('Invalid URL format'),
  userId: z.string().min(1),
  brandId: z.string().optional(),
});

type AnalyzeRequest = z.infer<typeof analyzeSchema>;

/**
 * Validates and normalizes a URL
 */
function normalizeUrl(urlString: string): string {
  if (!urlString.startsWith('http')) {
    urlString = 'https://' + urlString;
  }
  const url = new URL(urlString);
  return url.hostname || urlString; // Return domain for crawler
}

/**
 * Main analysis workflow
 */
async function performAnalysis(request: AnalyzeRequest, jobId: string) {
  const queue = getJobQueue();

  try {
    // Step 1: Crawl website
    queue.updateJob(jobId, {
      status: 'crawling',
      currentStep: 'Reading website content...',
      progress: 5,
      startedAt: new Date(),
    });

    const domain = normalizeUrl(request.websiteUrl);
    let crawlResult;

    try {
      // Use crawler factory (Firecrawl or WebCrawler based on feature flag)
      const crawler = getCrawler();
      crawlResult = await crawler.crawlBrandWebsite(request.websiteUrl);
    } catch (error) {
      console.error('Crawl error:', error);
      // Fall back to simulated crawl on error
      const domain = normalizeUrl(request.websiteUrl);
      crawlResult = await simulateWebsiteCrawl(domain);
    }

    queue.updateJob(jobId, {
      progress: 25,
      currentStep: 'Extracting brand information...',
    });

    // Step 2: Extract brand identity (using comprehensive profile if possible)
    queue.updateJob(jobId, {
      status: 'extracting',
      currentStep: 'Analyzing brand DNA...',
      progress: 40,
    });

    const brandIntelligence = new BrandIntelligence();

    // Attempt comprehensive extraction first
    const comprehensiveProfile = await brandIntelligence.extractComprehensiveBrandProfile(crawlResult);

    if (comprehensiveProfile) {
      queue.updateJob(jobId, {
        progress: 80,
        currentStep: 'Finalizing brand profile...',
      });

      // Map comprehensive profile to JobResult
      queue.completeJob(jobId, {
        brandIdentity: {
          id: `bi_${jobId}`,
          brandId: request.brandId || '',
          mission: comprehensiveProfile.brandIdentity.mission.statement,
          vision: comprehensiveProfile.brandIdentity.vision.statement,
          values: comprehensiveProfile.brandIdentity.coreValues.map(v => v.value),
          brandStory: comprehensiveProfile.brandIdentity.positioningStatement,
          uniqueSellingPoints: comprehensiveProfile.brandIdentity.uniqueValueProposition ? [comprehensiveProfile.brandIdentity.uniqueValueProposition] : [],
          brandVoice: {
            tone: comprehensiveProfile.brandVoice.personalityTraits,
            keywords: comprehensiveProfile.brandVoice.signaturePhrases,
            avoidWords: comprehensiveProfile.brandVoice.languageToAvoid,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        competitors: comprehensiveProfile.competitiveLandscape.competitors.map((c, idx) => ({
          id: `cp_${jobId}_${idx}`,
          brandId: request.brandId || '',
          name: c.name,
          domain: '', // Domain not always extracted in unified prompt
          isPrimary: c.type === 'direct',
          strengths: c.theirAdvantage ? [c.theirAdvantage] : [],
          weaknesses: [],
          differentiators: c.ourAdvantage ? [c.ourAdvantage] : [],
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
        products: (comprehensiveProfile.productPortfolio.heroOfferings || []).map((p, idx) => ({
          id: `prod_${jobId}_${idx}`,
          brandId: request.brandId || '',
          name: p.name,
          category: comprehensiveProfile.productPortfolio.categories[0]?.name || 'Product',
          description: p.description,
          features: p.keyBenefits,
          benefits: [],
          useCases: [],
          pricing: {
            currency: 'USD',
            amount: 0, // Price not reliably extracted in unified prompt yet for specific items
          },
          url: request.websiteUrl,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
        crawlDuration: crawlResult.crawlDuration,
      });
      return;
    }

    // Fallback to individual extractions if comprehensive failed or returned null (mock mode)
    const brandIdentity = await brandIntelligence.extractBrandIdentity(
      crawlResult,
      domain,
    );

    queue.updateJob(jobId, {
      progress: 60,
      currentStep: 'Identifying competitors...',
    });

    const competitors = await brandIntelligence.identifyCompetitors(
      domain.split('.')[0],
      crawlResult,
    );

    queue.updateJob(jobId, {
      progress: 75,
      currentStep: 'Categorizing products and services...',
    });

    // Use BrandIntelligence for products too (Real API)
    const productCategories = await brandIntelligence.categorizeProducts(crawlResult);

    // Convert to product entities
    const products = productCategories.map((p, idx) => ({
      id: `prod_${jobId}_${idx}`,
      brandId: request.brandId || '',
      name: p.name,
      category: 'Product', // Default
      description: p.description,
      features: p.keyFeatures,
      benefits: [],
      useCases: [],
      pricing: {
        currency: 'USD',
        amount: 0,
      },
      url: request.websiteUrl,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    queue.updateJob(jobId, {
      progress: 90,
      currentStep: 'Finalizing brand profile...',
    });

    // Complete job with result
    queue.completeJob(jobId, {
      brandIdentity: {
        id: `bi_${jobId}`,
        brandId: request.brandId || '',
        mission: brandIdentity.mission,
        vision: brandIdentity.vision,
        values: brandIdentity.coreValues,
        brandStory: '',
        uniqueSellingPoints: brandIdentity.uniqueSellingPropositions,
        brandVoice: {
          tone: brandIdentity.brandVoiceAttributes,
          keywords: crawlResult.metadata.keywords,
          avoidWords: [],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      competitors: competitors.map((c, idx) => ({
        id: `cp_${jobId}_${idx}`,
        brandId: request.brandId || '',
        name: c.name,
        domain: c.website || '', // Legacy schema has website
        isPrimary: c.competitionType === 'direct',
        strengths: [],
        weaknesses: [],
        differentiators: [c.rationale],
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      products: products,
      crawlDuration: crawlResult.crawlDuration,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error during analysis';
    console.error('Analysis error:', error);
    queue.failJob(jobId, errorMessage);
  }
}

/**
 * POST handler to start analysis job
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = analyzeSchema.parse(body);

    // Create job
    const job = createAndTrackJob(
      data.userId,
      data.websiteUrl,
      undefined,
      data.brandId,
    );

    // Start async processing (fire and forget)
    // In production, this would be queued properly with Bull/Redis
    performAnalysis(data, job.id).catch((error) => {
      console.error('Background job error:', error);
    });

    // Return job immediately
    return NextResponse.json(
      {
        jobId: job.id,
        status: job.status,
        progress: job.progress,
        message: 'Analysis started',
      },
      { status: 202 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: error.errors,
        },
        { status: 400 },
      );
    }

    console.error('Error starting analysis:', error);
    return NextResponse.json(
      { error: 'Failed to start analysis' },
      { status: 500 },
    );
  }
}
