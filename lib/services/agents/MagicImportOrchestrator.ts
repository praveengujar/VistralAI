/**
 * MagicImportOrchestrator - Coordinates all agents for brand discovery
 *
 * Orchestrates the full Magic Import flow:
 * 1. CrawlerAgent -> EntityHome, OrganizationSchema
 * 2. VibeCheckAgent -> BrandIdentityPrism, BrandArchetype, BrandVoice
 * 3. CompetitorAgent -> CompetitorGraph
 *
 * Saves all data to database and calculates completion scores.
 */

import { PrismaClient } from '@prisma/client';
import { CrawlerAgent } from './CrawlerAgent';
import { VibeCheckAgent } from './VibeCheckAgent';
import { CompetitorAgent } from './CompetitorAgent';
import {
  MagicImportResult,
  MagicImportOptions,
  MagicImportStage,
  AgentProgressCallback,
} from './types';

const prisma = new PrismaClient();

export class MagicImportOrchestrator {
  private crawlerAgent: CrawlerAgent;
  private vibeCheckAgent: VibeCheckAgent;
  private competitorAgent: CompetitorAgent;

  constructor() {
    this.crawlerAgent = new CrawlerAgent();
    this.vibeCheckAgent = new VibeCheckAgent();
    this.competitorAgent = new CompetitorAgent();
  }

  /**
   * Execute the full Magic Import flow
   */
  async execute(
    organizationId: string,
    websiteUrl: string,
    brandName: string,
    options: MagicImportOptions = {}
  ): Promise<MagicImportResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const stages: MagicImportStage[] = [];

    const discoveries = {
      entityHome: false,
      organizationSchema: false,
      brandIdentity: false,
      competitors: 0,
    };

    const onProgress = options.onProgress || (() => {});

    // Step 1: Create or get Brand360 profile
    let brand360 = await prisma.brand360Profile.findFirst({
      where: { organizationId },
    });

    if (!brand360) {
      brand360 = await prisma.brand360Profile.create({
        data: { organizationId },
      });
    }

    let websiteContent = '';

    // Step 2: Run Crawler Agent
    if (!options.skipCrawler) {
      onProgress('crawler', 0, 'Starting website crawl...');
      stages.push({ name: 'crawler', status: 'running' });

      const crawlResult = options.maxPages
        ? await this.crawlerAgent.crawlMultiple(websiteUrl, options.maxPages)
        : await this.crawlerAgent.crawl(websiteUrl);

      if (crawlResult.success && crawlResult.data) {
        stages[stages.length - 1] = {
          name: 'crawler',
          status: 'completed',
          confidence: crawlResult.confidence,
          duration: crawlResult.duration,
        };

        websiteContent = crawlResult.data.rawContent;

        // Save Entity Home
        try {
          await prisma.entityHome.upsert({
            where: { brand360Id: brand360.id },
            create: {
              brand360Id: brand360.id,
              canonicalUrl: crawlResult.data.entityHome.canonicalUrl || websiteUrl,
              linkedinUrl: crawlResult.data.entityHome.linkedinUrl,
              twitterUrl: crawlResult.data.entityHome.twitterUrl,
              facebookUrl: crawlResult.data.entityHome.facebookUrl,
              youtubeUrl: crawlResult.data.entityHome.youtubeUrl,
              githubUrl: crawlResult.data.entityHome.githubUrl,
              instagramUrl: crawlResult.data.entityHome.instagramUrl,
              crunchbaseUrl: crawlResult.data.entityHome.crunchbaseUrl,
              schemaValidated: crawlResult.data.schemaMarkup.length > 0,
              socialConsistent: crawlResult.data.socialLinks.length > 0,
              alternateNames: crawlResult.data.entityHome.alternateNames || [],
              formerNames: crawlResult.data.entityHome.formerNames || [],
            },
            update: {
              canonicalUrl: crawlResult.data.entityHome.canonicalUrl || websiteUrl,
              linkedinUrl: crawlResult.data.entityHome.linkedinUrl,
              twitterUrl: crawlResult.data.entityHome.twitterUrl,
              facebookUrl: crawlResult.data.entityHome.facebookUrl,
              youtubeUrl: crawlResult.data.entityHome.youtubeUrl,
              githubUrl: crawlResult.data.entityHome.githubUrl,
              instagramUrl: crawlResult.data.entityHome.instagramUrl,
              crunchbaseUrl: crawlResult.data.entityHome.crunchbaseUrl,
              schemaValidated: crawlResult.data.schemaMarkup.length > 0,
              socialConsistent: crawlResult.data.socialLinks.length > 0,
            },
          });
          discoveries.entityHome = true;
        } catch (err) {
          errors.push(`EntityHome save error: ${err}`);
        }

        // Save Organization Schema
        if (crawlResult.data.organizationSchema.name) {
          try {
            await prisma.organizationSchema.upsert({
              where: { brand360Id: brand360.id },
              create: {
                brand360Id: brand360.id,
                organizationType:
                  crawlResult.data.organizationSchema.organizationType || 'Organization',
                legalName:
                  crawlResult.data.organizationSchema.legalName ||
                  crawlResult.data.organizationSchema.name ||
                  brandName,
                name: crawlResult.data.organizationSchema.name || brandName,
                alternateName: crawlResult.data.organizationSchema.alternateName,
                description: crawlResult.data.organizationSchema.description,
                slogan: crawlResult.data.organizationSchema.slogan,
                foundingDate: crawlResult.data.organizationSchema.foundingDate,
                foundingLocation: crawlResult.data.organizationSchema.foundingLocation,
                founders: crawlResult.data.organizationSchema.founders as object,
                address: crawlResult.data.organizationSchema.address as object,
                numberOfEmployees: crawlResult.data.organizationSchema.numberOfEmployees,
                awards: crawlResult.data.organizationSchema.awards || [],
                subOrganizations: crawlResult.data.organizationSchema.subOrganizations || [],
                jsonLdOutput: crawlResult.data.organizationSchema.jsonLdOutput as object,
              },
              update: {
                organizationType:
                  crawlResult.data.organizationSchema.organizationType || 'Organization',
                name: crawlResult.data.organizationSchema.name || brandName,
                description: crawlResult.data.organizationSchema.description,
                slogan: crawlResult.data.organizationSchema.slogan,
                foundingDate: crawlResult.data.organizationSchema.foundingDate,
                founders: crawlResult.data.organizationSchema.founders as object,
                jsonLdOutput: crawlResult.data.organizationSchema.jsonLdOutput as object,
              },
            });
            discoveries.organizationSchema = true;
          } catch (err) {
            errors.push(`OrganizationSchema save error: ${err}`);
          }
        }

        onProgress('crawler', 100, 'Crawl complete');
      } else {
        stages[stages.length - 1] = {
          name: 'crawler',
          status: 'failed',
          error: crawlResult.errors?.join(', '),
        };
        errors.push(`Crawler Agent: ${crawlResult.errors?.join(', ')}`);
      }
    }

    // Step 3: Run Vibe Check Agent
    if (!options.skipVibeCheck && websiteContent) {
      onProgress('vibecheck', 0, 'Analyzing brand identity...');
      stages.push({ name: 'vibecheck', status: 'running' });

      const vibeResult = await this.vibeCheckAgent.analyze(websiteContent, brandName);

      if (vibeResult.success && vibeResult.data) {
        stages[stages.length - 1] = {
          name: 'vibecheck',
          status: 'completed',
          confidence: vibeResult.confidence,
          duration: vibeResult.duration,
        };

        // Save Brand Identity Prism
        if (vibeResult.data.brandIdentityPrism) {
          try {
            await prisma.brandIdentityPrism.upsert({
              where: { brand360Id: brand360.id },
              create: {
                brand360Id: brand360.id,
                physique: vibeResult.data.brandIdentityPrism.physique as object,
                personalityScores: vibeResult.data.brandIdentityPrism.personalityScores as object,
                personalityTraits: vibeResult.data.brandIdentityPrism.personalityTraits || [],
                cultureValues: vibeResult.data.brandIdentityPrism.cultureValues || [],
                cultureDescription: vibeResult.data.brandIdentityPrism.cultureDescription,
                relationshipType: vibeResult.data.brandIdentityPrism.relationshipType,
                relationshipDescription: vibeResult.data.brandIdentityPrism.relationshipDescription,
                reflectionProfile: vibeResult.data.brandIdentityPrism.reflectionProfile as object,
                selfImage: vibeResult.data.brandIdentityPrism.selfImage,
                inferredByAgent: true,
                confidence: vibeResult.confidence,
              },
              update: {
                physique: vibeResult.data.brandIdentityPrism.physique as object,
                personalityScores: vibeResult.data.brandIdentityPrism.personalityScores as object,
                personalityTraits: vibeResult.data.brandIdentityPrism.personalityTraits || [],
                cultureValues: vibeResult.data.brandIdentityPrism.cultureValues || [],
                cultureDescription: vibeResult.data.brandIdentityPrism.cultureDescription,
                relationshipType: vibeResult.data.brandIdentityPrism.relationshipType,
                selfImage: vibeResult.data.brandIdentityPrism.selfImage,
                confidence: vibeResult.confidence,
              },
            });
          } catch (err) {
            errors.push(`BrandIdentityPrism save error: ${err}`);
          }
        }

        // Save Brand Archetype
        if (vibeResult.data.brandArchetype?.primaryArchetype) {
          try {
            await prisma.brandArchetype.upsert({
              where: { brand360Id: brand360.id },
              create: {
                brand360Id: brand360.id,
                primaryArchetype: vibeResult.data.brandArchetype.primaryArchetype,
                primaryScore: vibeResult.data.brandArchetype.primaryScore || 70,
                secondaryArchetype: vibeResult.data.brandArchetype.secondaryArchetype,
                secondaryScore: vibeResult.data.brandArchetype.secondaryScore,
                expectedTone: vibeResult.data.brandArchetype.expectedTone || [],
                expectedDepth: vibeResult.data.brandArchetype.expectedDepth || 'moderate',
                expectedCitations: vibeResult.data.brandArchetype.expectedCitations || false,
                expectedHumor: vibeResult.data.brandArchetype.expectedHumor || 'none',
                archetypeScores: vibeResult.data.brandArchetype.archetypeScores as object,
              },
              update: {
                primaryArchetype: vibeResult.data.brandArchetype.primaryArchetype,
                primaryScore: vibeResult.data.brandArchetype.primaryScore || 70,
                secondaryArchetype: vibeResult.data.brandArchetype.secondaryArchetype,
                secondaryScore: vibeResult.data.brandArchetype.secondaryScore,
                expectedTone: vibeResult.data.brandArchetype.expectedTone || [],
                archetypeScores: vibeResult.data.brandArchetype.archetypeScores as object,
              },
            });
          } catch (err) {
            errors.push(`BrandArchetype save error: ${err}`);
          }
        }

        // Save Brand Voice Profile
        if (vibeResult.data.brandVoice) {
          try {
            await prisma.brandVoiceProfile.upsert({
              where: { brand360Id: brand360.id },
              create: {
                brand360Id: brand360.id,
                voiceSpectrums: vibeResult.data.brandVoice.voiceSpectrums as object,
                primaryTone: vibeResult.data.brandVoice.primaryTone,
                secondaryTones: vibeResult.data.brandVoice.secondaryTones || [],
                vocabularyLevel: vibeResult.data.brandVoice.vocabularyLevel || 'moderate',
                sentenceStyle: vibeResult.data.brandVoice.sentenceStyle || 'moderate',
                approvedPhrases: vibeResult.data.brandVoice.approvedPhrases || [],
                bannedPhrases: vibeResult.data.brandVoice.bannedPhrases || [],
                bannedTopics: vibeResult.data.brandVoice.bannedTopics || [],
                voiceSamples: vibeResult.data.brandVoice.voiceSamples || [],
              },
              update: {
                voiceSpectrums: vibeResult.data.brandVoice.voiceSpectrums as object,
                primaryTone: vibeResult.data.brandVoice.primaryTone,
                secondaryTones: vibeResult.data.brandVoice.secondaryTones || [],
                vocabularyLevel: vibeResult.data.brandVoice.vocabularyLevel || 'moderate',
                approvedPhrases: vibeResult.data.brandVoice.approvedPhrases || [],
                bannedPhrases: vibeResult.data.brandVoice.bannedPhrases || [],
              },
            });
          } catch (err) {
            errors.push(`BrandVoiceProfile save error: ${err}`);
          }
        }

        discoveries.brandIdentity = true;
        onProgress('vibecheck', 100, 'Brand identity analysis complete');
      } else {
        stages[stages.length - 1] = {
          name: 'vibecheck',
          status: 'failed',
          error: vibeResult.errors?.join(', '),
        };
        errors.push(`Vibe Check Agent: ${vibeResult.errors?.join(', ')}`);
      }
    }

    // Step 4: Run Competitor Agent
    if (!options.skipCompetitors && websiteContent) {
      onProgress('competitors', 0, 'Discovering competitors...');
      stages.push({ name: 'competitors', status: 'running' });

      // Get category from organization schema
      const orgSchema = await prisma.organizationSchema.findUnique({
        where: { brand360Id: brand360.id },
      });
      const category = orgSchema?.description || brandName;

      const competitorResult = await this.competitorAgent.discover(
        brandName,
        category,
        websiteContent
      );

      if (competitorResult.success && competitorResult.data) {
        stages[stages.length - 1] = {
          name: 'competitors',
          status: 'completed',
          confidence: competitorResult.confidence,
          duration: competitorResult.duration,
        };

        // Create or update Competitor Graph
        try {
          const competitorGraph = await prisma.competitorGraph.upsert({
            where: { brand360Id: brand360.id },
            create: {
              brand360Id: brand360.id,
              lastCrawled: new Date(),
              discoverySource: 'agent',
            },
            update: {
              lastCrawled: new Date(),
            },
          });

          // Delete existing competitors (to avoid duplicates)
          await prisma.competitor.deleteMany({
            where: { competitorGraphId: competitorGraph.id },
          });

          // Add new competitors
          for (const competitor of competitorResult.data.competitors) {
            if (competitor.name) {
              await prisma.competitor.create({
                data: {
                  competitorGraphId: competitorGraph.id,
                  name: competitor.name,
                  website: competitor.website,
                  description: competitor.description,
                  competitorType: competitor.competitorType || 'direct',
                  threatLevel: competitor.threatLevel || 'medium',
                  marketPosition: competitor.marketPosition,
                  pricingTier: competitor.pricingTier,
                  strengths: competitor.strengths || [],
                  weaknesses: competitor.weaknesses || [],
                  discoveredBy: 'agent',
                },
              });
            }
          }

          discoveries.competitors = competitorResult.data.competitors.length;
        } catch (err) {
          errors.push(`CompetitorGraph save error: ${err}`);
        }

        onProgress('competitors', 100, 'Competitor discovery complete');
      } else {
        stages[stages.length - 1] = {
          name: 'competitors',
          status: 'failed',
          error: competitorResult.errors?.join(', '),
        };
        errors.push(`Competitor Agent: ${competitorResult.errors?.join(', ')}`);
      }
    }

    // Step 5: Calculate scores
    const completionScore = await this.calculateCompletionScore(brand360.id);
    const entityHealthScore = await this.calculateEntityHealthScore(brand360.id);

    // Update profile
    await prisma.brand360Profile.update({
      where: { id: brand360.id },
      data: {
        completionScore,
        entityHealthScore,
        lastAgentCrawlAt: new Date(),
        lastAnalyzedAt: new Date(),
      },
    });

    const totalDuration = Date.now() - startTime;

    return {
      brand360Id: brand360.id,
      completionScore,
      entityHealthScore,
      discoveries,
      stages,
      errors,
      totalDuration,
    };
  }

  /**
   * Calculate profile completion score (0-100)
   */
  private async calculateCompletionScore(brand360Id: string): Promise<number> {
    const profile = await prisma.brand360Profile.findUnique({
      where: { id: brand360Id },
      include: {
        entityHome: true,
        organizationSchema: true,
        brandIdentityPrism: true,
        brandArchetype: true,
        brandVoiceProfile: true,
        competitorGraph: { include: { competitors: true } },
        customerPersonas: true,
        products: true,
        claimLocker: { include: { claims: true } },
      },
    });

    if (!profile) return 0;

    let score = 0;

    // Entity Home (15 points)
    if (profile.entityHome) {
      score += 5;
      if (profile.entityHome.wikidataVerified) score += 5;
      if (profile.entityHome.schemaValidated) score += 5;
    }

    // Organization Schema (10 points)
    if (profile.organizationSchema) {
      score += 5;
      if (profile.organizationSchema.founders) score += 3;
      if (profile.organizationSchema.foundingDate) score += 2;
    }

    // Brand Identity Prism (20 points)
    if (profile.brandIdentityPrism) {
      score += 10;
      if (profile.brandIdentityPrism.personalityScores) score += 5;
      if (profile.brandIdentityPrism.cultureValues?.length) score += 5;
    }

    // Brand Archetype (10 points)
    if (profile.brandArchetype) {
      score += 5;
      if (profile.brandArchetype.primaryScore && profile.brandArchetype.primaryScore > 70)
        score += 5;
    }

    // Brand Voice (10 points)
    if (profile.brandVoiceProfile) {
      score += 5;
      if (profile.brandVoiceProfile.voiceSamples?.length) score += 5;
    }

    // Competitors (15 points)
    if (profile.competitorGraph?.competitors?.length) {
      score += Math.min(profile.competitorGraph.competitors.length * 3, 15);
    }

    // Customer Personas (10 points)
    if (profile.customerPersonas.length > 0) {
      score += Math.min(profile.customerPersonas.length * 5, 10);
    }

    // Products (5 points)
    if (profile.products.length > 0) {
      score += Math.min(profile.products.length, 5);
    }

    // Claims (5 points)
    if (profile.claimLocker?.claims?.length) {
      score += Math.min(profile.claimLocker.claims.length, 5);
    }

    return Math.min(score, 100);
  }

  /**
   * Calculate entity health score (0-100)
   */
  private async calculateEntityHealthScore(brand360Id: string): Promise<number> {
    const entityHome = await prisma.entityHome.findUnique({
      where: { brand360Id },
    });

    if (!entityHome) return 0;

    let score = 0;

    // Canonical URL (20 points)
    if (entityHome.canonicalUrl) score += 20;

    // Knowledge Graph presence (30 points)
    if (entityHome.googleKgId) score += 15;
    if (entityHome.wikidataId) score += 15;

    // Schema validation (20 points)
    if (entityHome.schemaValidated) score += 20;

    // Social consistency (20 points)
    if (entityHome.socialConsistent) score += 10;
    const socialLinks = [
      entityHome.linkedinUrl,
      entityHome.twitterUrl,
      entityHome.facebookUrl,
      entityHome.youtubeUrl,
      entityHome.githubUrl,
    ].filter(Boolean).length;
    score += Math.min(socialLinks * 2, 10);

    // Wikipedia (10 points)
    if (entityHome.wikipediaUrl) score += 10;

    return Math.min(score, 100);
  }
}
