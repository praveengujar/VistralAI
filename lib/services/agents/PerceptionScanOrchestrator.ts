/**
 * PerceptionScanOrchestrator - Coordinates perception scan execution
 *
 * Orchestrates the full scan flow:
 * 1. Load prompts for brand
 * 2. Build ground truth from Brand360
 * 3. Query platforms (OpenAI real, others mocked for Phase 3-4)
 * 4. Evaluate responses with LLM-as-a-Judge
 * 5. Aggregate scores and generate insights
 */

import { PrismaClient } from '@prisma/client';
import { PerceptionEvaluatorAgent } from './PerceptionEvaluatorAgent';
import { PromptGeneratorAgent } from './PromptGeneratorAgent';
import {
  AgentProgressCallback,
  PerceptionScanOptions,
  PerceptionScanResult,
  PerceptionEvaluatorResult,
  AggregatedScores,
  QuadrantPosition,
  LLMPlatform,
  PromptCategory,
  Brand360GroundTruth,
} from './types';

const prisma = new PrismaClient();

// Type for product item
interface ProductItem {
  name: string;
  category: string | null;
  features: string[] | null;
  benefits: string[] | null;
  useCases: string[] | null;
  isHero: boolean | null;
}

// Type for claim item
interface ClaimItem {
  claimText: string;
  evidenceUrl: string | null;
}

// Type for competitor item
interface CompetitorItem {
  name: string;
}

interface PerceptionInsightData {
  category: string;
  priority: string;
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  effort: string;
  platforms: string[];
  affectedPromptCategories: string[];
  currentValue: number;
  targetValue: number;
  unit: string;
}

export class PerceptionScanOrchestrator {
  private evaluator: PerceptionEvaluatorAgent;

  constructor() {
    this.evaluator = new PerceptionEvaluatorAgent();
  }

  /**
   * Execute a full perception scan
   */
  async execute(
    brand360Id: string,
    options: PerceptionScanOptions = {}
  ): Promise<PerceptionScanResult> {
    const startedAt = new Date();
    const platforms = options.platforms || ['chatgpt'];
    const mockExternalPlatforms = options.mockExternalPlatforms ?? true;

    // Report progress
    const reportProgress = options.onProgress || (() => {});

    try {
      reportProgress('initializing', 0, 'Loading brand data...');

      // Step 1: Load Brand360 profile with all relations
      const brand360 = await this.loadBrand360(brand360Id);
      if (!brand360) {
        throw new Error(`Brand360 profile not found: ${brand360Id}`);
      }

      // Step 2: Build ground truth
      const groundTruth = this.buildGroundTruth(brand360);

      // Step 3: Load prompts (or auto-generate if none exist)
      reportProgress('loading_prompts', 10, 'Loading prompts...');
      let prompts = await this.loadPrompts(brand360Id, options);

      if (prompts.length === 0) {
        reportProgress('generating_prompts', 12, 'No prompts found. Auto-generating...');

        // Get brand name - try BrandProfile first, then organization schema
        const brandProfile = await prisma.brandProfile.findUnique({
          where: { id: brand360.organizationId },
        });
        const brandName = brandProfile?.brandName ||
                         brand360.organizationSchema?.name ||
                         brand360.organizationSchema?.legalName ||
                         'Unknown Brand';
        console.log(`[PerceptionScan] Using brand name: ${brandName} (from ${brandProfile?.brandName ? 'BrandProfile' : 'fallback'})`);

        // Generate prompts
        const generator = new PromptGeneratorAgent();
        const brand360Data = {
          id: brand360.id,
          organizationId: brand360.organizationId,
          brandIdentityPrism: brand360.brandIdentityPrism ?? undefined,
          brandArchetype: brand360.brandArchetype ? {
            primaryArchetype: brand360.brandArchetype.primaryArchetype,
            secondaryArchetype: brand360.brandArchetype.secondaryArchetype ?? undefined,
          } : undefined,
          brandVoiceProfile: brand360.brandVoiceProfile ? {
            primaryTone: brand360.brandVoiceProfile.primaryTone ?? undefined,
            vocabularyLevel: brand360.brandVoiceProfile.vocabularyLevel,
          } : undefined,
          competitorGraph: brand360.competitorGraph ?? undefined,
          customerPersonas: brand360.customerPersonas || [],
          products: (brand360.products || []).map((p: ProductItem) => ({
            name: p.name,
            category: p.category ?? undefined,
            features: p.features ?? undefined,
            benefits: p.benefits ?? undefined,
            useCases: p.useCases ?? undefined,
            isHero: p.isHero ?? undefined,
          })),
          claimLocker: brand360.claimLocker ?? undefined,
          riskFactors: brand360.riskFactors,
        };

        const result = await generator.generate(brand360Data, brandName, {
          categories: ['navigational', 'comparative', 'voice', 'adversarial'],
          maxPerCategory: 13, // ~50 prompts total (13 x 4 categories)
        });

        if (result.success && result.data) {
          // Save generated prompts to database
          for (const prompt of result.data.prompts) {
            await prisma.generatedPrompt.create({
              data: {
                brand360Id,
                category: prompt.category,
                categoryLabel: prompt.categoryLabel,
                intent: prompt.intent,
                template: prompt.template,
                renderedPrompt: prompt.renderedPrompt,
                targetPersona: prompt.targetPersona,
                targetCompetitor: prompt.targetCompetitor,
                targetClaim: prompt.targetClaim,
                targetProduct: prompt.targetProduct,
                expectedThemes: prompt.expectedThemes,
                expectedTone: prompt.expectedTone,
                expectedEntities: prompt.expectedEntities,
                expectedCitations: prompt.expectedCitations,
                adversarialTwist: prompt.adversarialTwist,
                hallucinationTest: prompt.hallucinationTest,
                priority: prompt.priority,
                isCustom: prompt.isCustom,
                isActive: true,
              },
            });
          }

          console.log(`[PerceptionScan] Auto-generated ${result.data.prompts.length} prompts:`);
          result.data.prompts.forEach((p, i) => {
            console.log(`  [${i + 1}] ${p.category}: "${p.renderedPrompt.substring(0, 80)}..."`);
          });

          // Reload prompts
          prompts = await this.loadPrompts(brand360Id, options);
          console.log(`[PerceptionScan] Loaded ${prompts.length} prompts from database`);
        }

        if (prompts.length === 0) {
          throw new Error('Failed to generate prompts. Please ensure your Brand 360 profile has sufficient data.');
        }
      }

      // Step 4: Create scan record
      reportProgress('creating_scan', 15, 'Creating scan record...');
      console.log(`[PerceptionScan] Creating scan record for ${prompts.length} prompts on ${platforms.length} platforms`);
      const scan = await prisma.perceptionScan.create({
        data: {
          brand360Id,
          status: 'running',
          platforms,
          promptCount: prompts.length * platforms.length,
          completedCount: 0,
          startedAt,
        },
      });
      console.log(`[PerceptionScan] Scan record created: ${scan.id}`);

      // Step 5: Execute evaluations
      const results: PerceptionEvaluatorResult[] = [];
      const totalEvaluations = prompts.length * platforms.length;
      let completedCount = 0;
      console.log(`[PerceptionScan] Starting ${totalEvaluations} evaluations...`);

      for (const prompt of prompts) {
        for (const platform of platforms) {
          try {
            console.log(`[PerceptionScan] Evaluating prompt ${completedCount + 1}/${totalEvaluations}: "${prompt.renderedPrompt.substring(0, 50)}..." on ${platform}`);
            reportProgress(
              'evaluating',
              20 + Math.round((completedCount / totalEvaluations) * 60),
              `Evaluating prompt on ${platform}...`
            );

            const shouldMock =
              mockExternalPlatforms && platform !== 'chatgpt';

            console.log(`[PerceptionScan] Calling evaluator (mock=${shouldMock})...`);
            const result = await this.evaluator.evaluatePrompt(
              prompt.id,
              {
                renderedPrompt: prompt.renderedPrompt,
                hallucinationTest: prompt.hallucinationTest,
                adversarialTwist: prompt.adversarialTwist || undefined,
                expectedThemes: prompt.expectedThemes,
                expectedTone: prompt.expectedTone || undefined,
              },
              platform as LLMPlatform,
              groundTruth,
              { mock: shouldMock }
            );

            results.push(result);

            // Save result to database
            await prisma.aIPerceptionResult.create({
              data: {
                promptId: prompt.id,
                brand360Id,
                scanId: scan.id,
                platform,
                model: result.model,
                response: result.response,
                responseTime: result.responseTime,
                tokensUsed: result.tokensUsed,
                faithfulnessScore: result.metrics.faithfulnessScore,
                faithfulnessErrors: result.metrics.faithfulnessErrors,
                shareOfVoice: result.metrics.shareOfVoice,
                brandMentioned: result.metrics.brandMentioned,
                brandPosition: result.metrics.brandPosition,
                competitorsMentioned: result.metrics.competitorsMentioned,
                competitorPositions: result.metrics.competitorPositions,
                overallSentiment: result.metrics.overallSentiment,
                aspectSentiments: result.metrics.aspectSentiments,
                voiceAlignmentScore: result.metrics.voiceAlignmentScore,
                voiceDeviations: result.metrics.voiceDeviations,
                hallucinationScore: result.metrics.hallucinationScore,
                hallucinations: result.metrics.hallucinations,
                keyThemes: result.metrics.keyThemes,
                missingInformation: result.metrics.missingInformation,
                opportunities: result.metrics.opportunities,
              },
            });

            completedCount++;

            // Update scan progress
            await prisma.perceptionScan.update({
              where: { id: scan.id },
              data: { completedCount },
            });
          } catch (error) {
            console.error(
              `[PerceptionScan] Error evaluating prompt ${prompt.id} on ${platform}:`,
              error
            );
            // Continue with other evaluations
          }
        }
      }

      // Step 6: Aggregate scores
      reportProgress('aggregating', 85, 'Aggregating scores...');
      const aggregatedScores = this.aggregateScores(results, prompts);

      // Step 7: Determine quadrant position
      const quadrantPosition = this.determineQuadrant(aggregatedScores);

      // Step 8: Generate insights
      reportProgress('insights', 90, 'Generating insights...');
      const insights = await this.generateInsights(
        results,
        aggregatedScores,
        brand360
      );

      // Save insights to database
      for (const insight of insights) {
        await prisma.perceptionInsight.create({
          data: {
            brand360Id,
            ...insight,
          },
        });
      }

      // Step 9: Update scan record with final results
      const completedAt = new Date();
      await prisma.perceptionScan.update({
        where: { id: scan.id },
        data: {
          status: 'completed',
          completedAt,
          overallScore: aggregatedScores.overall,
          platformScores: aggregatedScores.byPlatform,
          quadrantPosition,
        },
      });

      reportProgress('complete', 100, 'Scan complete!');

      return {
        scanId: scan.id,
        brand360Id,
        status: 'completed',
        platforms: platforms as LLMPlatform[],
        promptCount: prompts.length,
        completedCount,
        results,
        aggregatedScores,
        quadrantPosition,
        insights: insights.map((i) => i.title),
        startedAt,
        completedAt,
      };
    } catch (error) {
      console.error('[PerceptionScan] Orchestration error:', error);
      throw error;
    }
  }

  /**
   * Load Brand360 profile with all relations
   * Note: brand360Id is actually the organizationId (BrandProfile.id)
   */
  private async loadBrand360(brand360Id: string) {
    return prisma.brand360Profile.findFirst({
      where: { organizationId: brand360Id },
      include: {
        entityHome: true,
        organizationSchema: true,
        brandIdentityPrism: true,
        brandArchetype: true,
        brandVoiceProfile: true,
        competitorGraph: {
          include: {
            competitors: true,
          },
        },
        customerPersonas: true,
        products: true,
        claimLocker: {
          include: {
            claims: true,
          },
        },
        riskFactors: true,
      },
    });
  }

  /**
   * Load prompts based on options
   */
  private async loadPrompts(
    brand360Id: string,
    options: PerceptionScanOptions
  ) {
    const where: Record<string, unknown> = {
      brand360Id,
      isActive: true,
    };

    if (options.promptIds && options.promptIds.length > 0) {
      where.id = { in: options.promptIds };
    }

    if (options.categories && options.categories.length > 0) {
      where.category = { in: options.categories };
    }

    let prompts = await prisma.generatedPrompt.findMany({
      where,
      orderBy: { priority: 'desc' },
    });

    // Apply maxPrompts limit with balanced category distribution
    if (options.maxPrompts && prompts.length > options.maxPrompts) {
      // Group prompts by category
      const byCategory: Record<string, typeof prompts> = {};
      for (const p of prompts) {
        if (!byCategory[p.category]) byCategory[p.category] = [];
        byCategory[p.category].push(p);
      }

      const categories = Object.keys(byCategory);
      const perCategory = Math.ceil(options.maxPrompts / categories.length);

      // Take equal amounts from each category (already sorted by priority)
      const selected: typeof prompts = [];
      for (const cat of categories) {
        selected.push(...byCategory[cat].slice(0, perCategory));
      }

      // Trim to exact maxPrompts if we went over
      prompts = selected.slice(0, options.maxPrompts);

      console.log(`[PerceptionScan] Balanced prompt selection: ${options.maxPrompts} prompts across ${categories.length} categories (${perCategory} per category)`);
    }

    return prompts;
  }

  /**
   * Build ground truth from Brand360 profile
   */
  private buildGroundTruth(brand360: NonNullable<Awaited<ReturnType<typeof this.loadBrand360>>>): Brand360GroundTruth {
    const brandName =
      brand360.organizationSchema?.name ||
      brand360.entityHome?.canonicalUrl?.replace(/https?:\/\//, '').split('/')[0] ||
      'Unknown Brand';

    const products = brand360.products.map((p: ProductItem) => ({
      name: p.name,
      features: p.features || [],
      benefits: p.benefits || [],
    }));

    const claims = brand360.claimLocker?.claims.map((c: ClaimItem) => ({
      claimText: c.claimText,
      evidenceUrl: c.evidenceUrl || undefined,
    })) || [];

    const competitors = brand360.competitorGraph?.competitors.map((c: CompetitorItem) => ({
      name: c.name,
    })) || [];

    const foundingYear = brand360.organizationSchema?.foundingDate
      ? new Date(brand360.organizationSchema.foundingDate).getFullYear().toString()
      : undefined;

    const founders = brand360.organizationSchema?.founders as Array<{ name: string }> | undefined;
    const founderNames = founders?.map((f) => f.name) || [];

    const values = brand360.brandIdentityPrism?.cultureValues || [];

    const voiceProfile = {
      primaryTone: brand360.brandVoiceProfile?.primaryTone || 'professional',
      vocabularyLevel: brand360.brandVoiceProfile?.vocabularyLevel || 'moderate',
      approvedPhrases: brand360.brandVoiceProfile?.approvedPhrases || [],
      bannedPhrases: brand360.brandVoiceProfile?.bannedPhrases || [],
    };

    const riskFactors = brand360.riskFactors
      ? {
          misconceptions: brand360.riskFactors.commonMisconceptions || [],
          negativeKeywords: brand360.riskFactors.negativeKeywords || [],
        }
      : undefined;

    return {
      brandName,
      products,
      claims,
      competitors,
      foundingYear,
      founders: founderNames,
      values,
      voiceProfile,
      riskFactors,
    };
  }

  /**
   * Aggregate scores from individual results
   */
  private aggregateScores(
    results: PerceptionEvaluatorResult[],
    prompts: Array<{ category: string }>
  ): AggregatedScores {
    if (results.length === 0) {
      return {
        overall: 0,
        byPlatform: {},
        byCategory: {},
        byMetric: {
          faithfulness: 0,
          shareOfVoice: 0,
          sentiment: 0,
          voiceAlignment: 0,
          hallucinationRisk: 0,
        },
      };
    }

    // Calculate overall metrics
    const avgFaithfulness =
      results.reduce((sum, r) => sum + r.metrics.faithfulnessScore, 0) /
      results.length;
    const avgShareOfVoice =
      results.reduce((sum, r) => sum + r.metrics.shareOfVoice, 0) /
      results.length;
    const avgSentiment =
      results.reduce((sum, r) => sum + r.metrics.overallSentiment, 0) /
      results.length;
    const avgVoiceAlignment =
      results.reduce((sum, r) => sum + r.metrics.voiceAlignmentScore, 0) /
      results.length;
    const avgHallucination =
      results.reduce((sum, r) => sum + r.metrics.hallucinationScore, 0) /
      results.length;

    // Normalize sentiment from -1..1 to 0..100
    const normalizedSentiment = ((avgSentiment + 1) / 2) * 100;

    // Calculate overall score (weighted average)
    const overall = Math.round(
      avgFaithfulness * 0.25 +
        avgShareOfVoice * 0.25 +
        normalizedSentiment * 0.15 +
        avgVoiceAlignment * 0.15 +
        avgHallucination * 0.2
    );

    // Aggregate by platform
    const byPlatform: Partial<Record<LLMPlatform, number>> = {};
    const platforms = [...new Set(results.map((r) => r.platform))];
    for (const platform of platforms) {
      const platformResults = results.filter((r) => r.platform === platform);
      const platformScore =
        platformResults.reduce(
          (sum, r) => sum + this.evaluator.calculateOverallScore(r.metrics),
          0
        ) / platformResults.length;
      byPlatform[platform] = Math.round(platformScore);
    }

    // Aggregate by category
    const byCategory: Partial<Record<PromptCategory, number>> = {};
    const categories = [
      ...new Set(prompts.map((p) => p.category as PromptCategory)),
    ];
    for (const category of categories) {
      const categoryPromptIds = new Set(
        prompts
          .filter((p) => p.category === category)
          .map((_, i) => i.toString())
      );
      // This is simplified - in production you'd match by actual prompt IDs
      const categoryScore = overall; // Placeholder
      byCategory[category] = categoryScore;
    }

    return {
      overall,
      byPlatform,
      byCategory,
      byMetric: {
        faithfulness: Math.round(avgFaithfulness),
        shareOfVoice: Math.round(avgShareOfVoice),
        sentiment: Math.round(normalizedSentiment),
        voiceAlignment: Math.round(avgVoiceAlignment),
        hallucinationRisk: 100 - Math.round(avgHallucination), // Invert for "risk"
      },
    };
  }

  /**
   * Determine quadrant position based on scores
   *
   * Quadrant logic:
   * - Dominant: High visibility (>50) + High accuracy (>70)
   * - Vulnerable: High visibility (>50) + Low accuracy (<70)
   * - Niche: Low visibility (<50) + High accuracy (>70)
   * - Invisible: Low visibility (<50) + Low accuracy (<70)
   */
  private determineQuadrant(scores: AggregatedScores): QuadrantPosition {
    const visibility = scores.byMetric.shareOfVoice;
    const accuracy =
      (scores.byMetric.faithfulness + (100 - scores.byMetric.hallucinationRisk)) / 2;

    if (visibility >= 50 && accuracy >= 70) {
      return 'dominant';
    } else if (visibility >= 50 && accuracy < 70) {
      return 'vulnerable';
    } else if (visibility < 50 && accuracy >= 70) {
      return 'niche';
    } else {
      return 'invisible';
    }
  }

  /**
   * Generate insights from scan results
   */
  private async generateInsights(
    results: PerceptionEvaluatorResult[],
    scores: AggregatedScores,
    _brand360: NonNullable<Awaited<ReturnType<typeof this.loadBrand360>>>
  ): Promise<PerceptionInsightData[]> {
    const insights: PerceptionInsightData[] = [];

    // Visibility insights
    if (scores.byMetric.shareOfVoice < 30) {
      insights.push({
        category: 'visibility',
        priority: 'critical',
        title: 'Low AI Visibility',
        description: `Your brand is mentioned in only ${scores.byMetric.shareOfVoice}% of AI responses. You're largely invisible to AI assistants.`,
        impact: 'Users asking AI assistants about your category rarely hear about you.',
        recommendation:
          'Improve your Schema.org markup, build more backlinks from authoritative sources, and ensure your Wikipedia presence is accurate.',
        effort: 'high',
        platforms: Object.keys(scores.byPlatform),
        affectedPromptCategories: ['navigational', 'functional', 'comparative'],
        currentValue: scores.byMetric.shareOfVoice,
        targetValue: 50,
        unit: 'percent',
      });
    }

    // Accuracy insights
    if (scores.byMetric.faithfulness < 60) {
      insights.push({
        category: 'accuracy',
        priority: 'high',
        title: 'Factual Inaccuracies Detected',
        description: `AI responses about your brand have a ${100 - scores.byMetric.faithfulness}% error rate.`,
        impact:
          'Users are receiving incorrect information about your products and services.',
        recommendation:
          'Update your website content to be clearer, add FAQ pages addressing common questions, and ensure your Google Knowledge Panel is accurate.',
        effort: 'medium',
        platforms: Object.keys(scores.byPlatform),
        affectedPromptCategories: ['navigational', 'functional'],
        currentValue: scores.byMetric.faithfulness,
        targetValue: 80,
        unit: 'percent',
      });
    }

    // Hallucination insights
    if (scores.byMetric.hallucinationRisk > 20) {
      insights.push({
        category: 'hallucination',
        priority: 'critical',
        title: 'Hallucination Risk Detected',
        description: `AI models are inventing facts about your brand ${scores.byMetric.hallucinationRisk}% of the time.`,
        impact:
          'Users may receive fabricated information about features, pricing, or awards you don\'t have.',
        recommendation:
          'Create authoritative content that explicitly states what you do and don\'t offer. Add structured data to your pages.',
        effort: 'medium',
        platforms: Object.keys(scores.byPlatform),
        affectedPromptCategories: ['adversarial'],
        currentValue: scores.byMetric.hallucinationRisk,
        targetValue: 5,
        unit: 'percent',
      });
    }

    // Sentiment insights
    if (scores.byMetric.sentiment < 40) {
      insights.push({
        category: 'sentiment',
        priority: 'high',
        title: 'Negative Sentiment in AI Responses',
        description: `AI assistants describe your brand with ${100 - scores.byMetric.sentiment}% negative sentiment.`,
        impact: 'Users are being discouraged from choosing your brand.',
        recommendation:
          'Address negative reviews publicly, create positive case studies, and build more positive content signals.',
        effort: 'high',
        platforms: Object.keys(scores.byPlatform),
        affectedPromptCategories: ['voice', 'adversarial'],
        currentValue: scores.byMetric.sentiment,
        targetValue: 70,
        unit: 'percent',
      });
    }

    // Voice alignment insights
    if (scores.byMetric.voiceAlignment < 50) {
      insights.push({
        category: 'voice',
        priority: 'medium',
        title: 'Brand Voice Misalignment',
        description: `AI descriptions of your brand don't match your intended voice and personality.`,
        impact:
          'Your brand is being represented inconsistently across AI platforms.',
        recommendation:
          'Ensure your website and public content consistently uses your brand voice. Update your About page to clearly express your brand personality.',
        effort: 'low',
        platforms: Object.keys(scores.byPlatform),
        affectedPromptCategories: ['voice'],
        currentValue: scores.byMetric.voiceAlignment,
        targetValue: 75,
        unit: 'percent',
      });
    }

    // Competitive insights
    const competitorMentions = results.flatMap(
      (r) => r.metrics.competitorsMentioned
    );
    const competitorCounts = competitorMentions.reduce((acc, c) => {
      acc[c] = (acc[c] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topCompetitor = Object.entries(competitorCounts).sort(
      (a, b) => b[1] - a[1]
    )[0];

    if (topCompetitor && topCompetitor[1] > results.length * 0.5) {
      const competitorShareOfVoice = Math.round((topCompetitor[1] / results.length) * 100);
      insights.push({
        category: 'competitive',
        priority: 'medium',
        title: `Competitor Dominance: ${topCompetitor[0]}`,
        description: `${topCompetitor[0]} is mentioned in ${competitorShareOfVoice}% of responses where your brand should be featured.`,
        impact:
          'Your competitor is capturing share of voice that could be yours.',
        recommendation:
          'Create comparison content, highlight your differentiators, and ensure your unique value propositions are well-documented.',
        effort: 'medium',
        platforms: Object.keys(scores.byPlatform),
        affectedPromptCategories: ['comparative'],
        currentValue: competitorShareOfVoice,
        targetValue: 25,
        unit: 'percent',
      });
    }

    return insights;
  }

  /**
   * Get scan by ID
   */
  async getScan(scanId: string) {
    return prisma.perceptionScan.findUnique({
      where: { id: scanId },
      include: {
        results: true,
      },
    });
  }

  /**
   * Get all scans for a brand
   */
  async getScansForBrand(brand360Id: string) {
    return prisma.perceptionScan.findMany({
      where: { brand360Id },
      orderBy: { createdAt: 'desc' },
      include: {
        results: true,
      },
    });
  }
}
