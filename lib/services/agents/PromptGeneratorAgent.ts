/**
 * PromptGeneratorAgent - Generate strategic prompts from Brand360 data
 *
 * Generates 50+ prompts across 5 categories:
 * - navigational: Brand awareness/recognition
 * - functional: Problem-solving queries
 * - comparative: vs. competitor queries
 * - voice: Brand tone/personality
 * - adversarial: Challenging/negative scenarios
 */

import {
  AgentResult,
  PromptCategory,
  PromptGeneratorOptions,
  PromptGeneratorResult,
  GeneratedPromptData,
  PromptTemplate,
} from './types';
import {
  PROMPT_TEMPLATES,
  CATEGORY_LABELS,
  PERSONA_PRIORITY_MULTIPLIERS,
  COMPETITOR_PRIORITY_MULTIPLIERS,
  HALLUCINATION_TRAP_FEATURES,
  HALLUCINATION_TRAP_AWARDS,
  REVIEW_WEBSITE_TEMPLATES,
} from './promptTemplates';
import {
  reviewWebsiteService,
  ReviewWebsiteWithCategory,
} from '@/lib/services/ReviewWebsiteService';

// Types for Brand360 data with relations
interface Brand360WithRelations {
  id: string;
  organizationId: string;
  industry?: string;
  brandIdentityPrism?: {
    personalityTraits?: string[];
    cultureValues?: string[];
  } | null;
  brandArchetype?: {
    primaryArchetype?: string;
    secondaryArchetype?: string;
  } | null;
  brandVoiceProfile?: {
    primaryTone?: string;
    vocabularyLevel?: string;
    formalCasualScore?: number; // 1-10 scale
  } | null;
  competitorGraph?: {
    competitors: Array<{
      name: string;
      competitorType: string;
      threatLevel: string;
    }>;
  } | null;
  customerPersonas: Array<{
    name: string;
    type: string;
    description?: string | null;
    painPoints?: string[];
    goals?: string[];
    commonQuestions?: string[];
    objections?: string[];
  }>;
  products: Array<{
    name: string;
    category?: string;
    features?: string[];
    benefits?: string[];
    useCases?: string[];
    isHero?: boolean;
  }>;
  claimLocker?: {
    claims: Array<{
      claimText: string;
      claimType: string;
    }>;
  } | null;
  riskFactors?: {
    negativeKeywords?: string[];
    commonMisconceptions?: string[];
  } | null;
}

export class PromptGeneratorAgent {
  private brandName: string = '';
  private industry: string = '';

  /**
   * Generate prompts from Brand360 profile data
   */
  async generate(
    brand360: Brand360WithRelations,
    brandName: string,
    options: PromptGeneratorOptions = {}
  ): Promise<AgentResult<PromptGeneratorResult>> {
    const startTime = Date.now();
    this.brandName = brandName;

    try {
      const categories = options.categories || [
        'navigational',
        'functional',
        'comparative',
        'voice',
        'adversarial',
      ];
      const maxPerCategory = options.maxPerCategory || 15;

      const allPrompts: GeneratedPromptData[] = [];
      const categoryBreakdown: Record<PromptCategory, number> = {
        navigational: 0,
        functional: 0,
        comparative: 0,
        voice: 0,
        adversarial: 0,
      };

      const personasCovered: string[] = [];
      const competitorsCovered: string[] = [];
      const productsCovered: string[] = [];
      const reviewWebsitesCovered: string[] = [];

      // Generate prompts for each category
      for (const category of categories) {
        let categoryPrompts: GeneratedPromptData[] = [];

        switch (category) {
          case 'navigational':
            categoryPrompts = this.generateNavigationalPrompts(brand360, brandName);
            break;
          case 'functional':
            categoryPrompts = this.generateFunctionalPrompts(brand360, brandName);
            break;
          case 'comparative':
            categoryPrompts = this.generateComparativePrompts(brand360, brandName);
            break;
          case 'voice':
            categoryPrompts = this.generateVoicePrompts(brand360, brandName);
            break;
          case 'adversarial':
            categoryPrompts = this.generateAdversarialPrompts(brand360, brandName);
            break;
        }

        // Limit prompts per category
        categoryPrompts = categoryPrompts.slice(0, maxPerCategory);
        categoryBreakdown[category] = categoryPrompts.length;
        allPrompts.push(...categoryPrompts);

        // Track coverage
        categoryPrompts.forEach((p) => {
          if (p.targetPersona && !personasCovered.includes(p.targetPersona)) {
            personasCovered.push(p.targetPersona);
          }
          if (p.targetCompetitor && !competitorsCovered.includes(p.targetCompetitor)) {
            competitorsCovered.push(p.targetCompetitor);
          }
          if (p.targetProduct && !productsCovered.includes(p.targetProduct)) {
            productsCovered.push(p.targetProduct);
          }
        });
      }

      // Generate review website prompts if enabled
      if (options.includeReviewWebsites) {
        const reviewWebsitePrompts = await this.generateReviewWebsitePrompts(
          brand360,
          brandName,
          options
        );
        allPrompts.push(...reviewWebsitePrompts);

        // Track review websites covered
        reviewWebsitePrompts.forEach((p) => {
          if (p.targetReviewWebsite && !reviewWebsitesCovered.includes(p.targetReviewWebsite)) {
            reviewWebsitesCovered.push(p.targetReviewWebsite);
          }
        });
      }

      const duration = Date.now() - startTime;

      return {
        success: true,
        data: {
          prompts: allPrompts,
          categoryBreakdown,
          totalGenerated: allPrompts.length,
          personasCovered,
          competitorsCovered,
          productsCovered,
          reviewWebsitesCovered,
        },
        confidence: 0.95,
        source: 'prompt_generator_agent',
        duration,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        confidence: 0,
        source: 'prompt_generator_agent',
        errors: [errorMessage],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Generate navigational prompts (The Who)
   */
  private generateNavigationalPrompts(
    brand360: Brand360WithRelations,
    brandName: string
  ): GeneratedPromptData[] {
    const prompts: GeneratedPromptData[] = [];
    const templates = PROMPT_TEMPLATES.navigational.templates;
    const categoryLabel = CATEGORY_LABELS.navigational;
    const industry = brand360.industry || 'technology';

    // Brand-level queries (excluding product and industry templates)
    for (const template of templates.filter(
      (t) => !t.id.includes('product') && !t.id.includes('industry')
    )) {
      const rendered = this.renderTemplate(template.template, { brandName });
      prompts.push(this.createPromptData('navigational', categoryLabel, template, rendered, brandName));
    }

    // Industry-specific queries
    for (const template of templates.filter((t) => t.id.includes('industry'))) {
      const rendered = this.renderTemplate(template.template, {
        brandName,
        industry,
      });
      prompts.push(this.createPromptData('navigational', categoryLabel, template, rendered, brandName));
    }

    // Product-specific queries
    const heroProducts = brand360.products.filter((p) => p.isHero);
    const productsToUse = heroProducts.length > 0 ? heroProducts : brand360.products.slice(0, 3);

    for (const product of productsToUse) {
      for (const template of templates.filter((t) => t.id.includes('product'))) {
        const rendered = this.renderTemplate(template.template, {
          brandName,
          productName: product.name,
        });
        const promptData = this.createPromptData(
          'navigational',
          categoryLabel,
          template,
          rendered,
          brandName
        );
        promptData.targetProduct = product.name;
        prompts.push(promptData);
      }
    }

    return prompts.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Generate functional prompts (The How)
   */
  private generateFunctionalPrompts(
    brand360: Brand360WithRelations,
    brandName: string
  ): GeneratedPromptData[] {
    const prompts: GeneratedPromptData[] = [];
    const templates = PROMPT_TEMPLATES.functional.templates;
    const categoryLabel = CATEGORY_LABELS.functional;

    // Get primary product category
    const primaryProduct = brand360.products.find((p) => p.isHero) || brand360.products[0];
    const productCategory = primaryProduct?.category || 'software';

    // Pain point and goal queries from personas
    for (const persona of brand360.customerPersonas) {
      const priorityMultiplier =
        PERSONA_PRIORITY_MULTIPLIERS[persona.type] || 1.0;

      // Pain point queries - increased from 2 to 3
      const painPoints = persona.painPoints || [];
      for (const painPoint of painPoints.slice(0, 3)) {
        for (const template of templates.filter((t) => t.id.includes('pain'))) {
          const rendered = this.renderTemplate(template.template, {
            brandName,
            painPoint,
            productCategory,
          });
          const promptData = this.createPromptData(
            'functional',
            categoryLabel,
            template,
            rendered,
            brandName
          );
          promptData.targetPersona = persona.name;
          promptData.priority = Math.round(template.priority * priorityMultiplier);
          prompts.push(promptData);
        }
      }

      // Goal queries - increased from 2 to 3
      const goals = persona.goals || [];
      for (const goal of goals.slice(0, 3)) {
        for (const template of templates.filter((t) => t.id.includes('goal'))) {
          const rendered = this.renderTemplate(template.template, {
            brandName,
            goal,
            productCategory,
          });
          const promptData = this.createPromptData(
            'functional',
            categoryLabel,
            template,
            rendered,
            brandName
          );
          promptData.targetPersona = persona.name;
          promptData.priority = Math.round(template.priority * priorityMultiplier);
          prompts.push(promptData);
        }
      }

      // Common questions - increased from 1 to 2
      const questions = persona.commonQuestions || [];
      for (const question of questions.slice(0, 2)) {
        const template = templates.find((t) => t.id === 'func_question_1');
        if (template) {
          const promptData = this.createPromptData(
            'functional',
            categoryLabel,
            template,
            question,
            brandName
          );
          promptData.targetPersona = persona.name;
          promptData.priority = Math.round(template.priority * priorityMultiplier);
          prompts.push(promptData);
        }
      }

      // Decision journey queries for personas
      const personaDescription = persona.description || persona.name;
      for (const template of templates.filter((t) => t.id.includes('journey'))) {
        const rendered = this.renderTemplate(template.template, {
          brandName,
          personaDescription,
          productName: primaryProduct?.name || brandName,
        });
        const promptData = this.createPromptData(
          'functional',
          categoryLabel,
          template,
          rendered,
          brandName
        );
        promptData.targetPersona = persona.name;
        promptData.priority = Math.round(template.priority * priorityMultiplier);
        prompts.push(promptData);
      }
    }

    // Use case queries - increased from 3 to 4
    const useCases: string[] = [];
    brand360.products.forEach((p) => {
      if (p.useCases) useCases.push(...p.useCases);
    });

    for (const useCase of [...new Set(useCases)].slice(0, 4)) {
      for (const template of templates.filter((t) => t.id.includes('usecase'))) {
        const rendered = this.renderTemplate(template.template, {
          brandName,
          useCase,
          productCategory,
        });
        prompts.push(
          this.createPromptData('functional', categoryLabel, template, rendered, brandName)
        );
      }
    }

    // Feature-specific queries (NEW)
    for (const product of brand360.products.slice(0, 2)) {
      const features = product.features || [];
      for (const feature of features.slice(0, 2)) {
        for (const template of templates.filter((t) => t.id.includes('feature'))) {
          const rendered = this.renderTemplate(template.template, {
            brandName,
            productName: product.name,
            feature,
          });
          const promptData = this.createPromptData(
            'functional',
            categoryLabel,
            template,
            rendered,
            brandName
          );
          promptData.targetProduct = product.name;
          prompts.push(promptData);
        }
      }
    }

    // Benefit-specific queries (NEW)
    for (const product of brand360.products.slice(0, 2)) {
      const benefits = product.benefits || [];
      for (const benefit of benefits.slice(0, 2)) {
        for (const template of templates.filter((t) => t.id.includes('benefit'))) {
          const rendered = this.renderTemplate(template.template, {
            brandName,
            productName: product.name,
            benefit,
          });
          const promptData = this.createPromptData(
            'functional',
            categoryLabel,
            template,
            rendered,
            brandName
          );
          promptData.targetProduct = product.name;
          prompts.push(promptData);
        }
      }
    }

    // Deduplicate by rendered prompt
    const seen = new Set<string>();
    const deduplicated = prompts.filter((p) => {
      if (seen.has(p.renderedPrompt)) return false;
      seen.add(p.renderedPrompt);
      return true;
    });

    return deduplicated.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Generate comparative prompts (The Which)
   */
  private generateComparativePrompts(
    brand360: Brand360WithRelations,
    brandName: string
  ): GeneratedPromptData[] {
    const prompts: GeneratedPromptData[] = [];
    const templates = PROMPT_TEMPLATES.comparative.templates;
    const categoryLabel = CATEGORY_LABELS.comparative;

    const competitors = brand360.competitorGraph?.competitors || [];
    const primaryProduct = brand360.products.find((p) => p.isHero) || brand360.products[0];
    const productCategory = primaryProduct?.category || 'software';

    // Direct comparison with top competitors
    const sortedCompetitors = [...competitors].sort((a, b) => {
      const aMultiplier = COMPETITOR_PRIORITY_MULTIPLIERS[a.threatLevel] || 1.0;
      const bMultiplier = COMPETITOR_PRIORITY_MULTIPLIERS[b.threatLevel] || 1.0;
      return bMultiplier - aMultiplier;
    });

    for (const competitor of sortedCompetitors.slice(0, 5)) {
      const priorityMultiplier =
        COMPETITOR_PRIORITY_MULTIPLIERS[competitor.threatLevel] || 1.0;

      // Direct comparison templates
      for (const template of templates.filter(
        (t) => t.id.includes('comp_') && !t.id.includes('alt') && !t.id.includes('claim')
      )) {
        const rendered = this.renderTemplate(template.template, {
          brandName,
          competitorName: competitor.name,
          productCategory,
          useCase: primaryProduct?.useCases?.[0] || 'business needs',
        });
        const promptData = this.createPromptData(
          'comparative',
          categoryLabel,
          template,
          rendered,
          brandName
        );
        promptData.targetCompetitor = competitor.name;
        promptData.priority = Math.round(template.priority * priorityMultiplier);
        prompts.push(promptData);
      }

      // Alternative seeking templates
      for (const template of templates.filter((t) => t.id.includes('alt'))) {
        const rendered = this.renderTemplate(template.template, {
          brandName,
          competitorName: competitor.name,
          productCategory,
        });
        const promptData = this.createPromptData(
          'comparative',
          categoryLabel,
          template,
          rendered,
          brandName
        );
        promptData.targetCompetitor = competitor.name;
        promptData.priority = Math.round(template.priority * priorityMultiplier);
        prompts.push(promptData);
      }
    }

    // Claim-based comparisons
    const claims = brand360.claimLocker?.claims || [];
    for (const claim of claims.slice(0, 2)) {
      for (const template of templates.filter((t) => t.id.includes('claim'))) {
        const rendered = this.renderTemplate(template.template, {
          brandName,
          claim: claim.claimText,
          productCategory,
          competitorName: sortedCompetitors[0]?.name || 'competitors',
        });
        const promptData = this.createPromptData(
          'comparative',
          categoryLabel,
          template,
          rendered,
          brandName
        );
        promptData.targetClaim = claim.claimText;
        prompts.push(promptData);
      }
    }

    // Deduplicate
    const seen = new Set<string>();
    const deduplicated = prompts.filter((p) => {
      if (seen.has(p.renderedPrompt)) return false;
      seen.add(p.renderedPrompt);
      return true;
    });

    return deduplicated.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Generate voice prompts (The Vibe)
   */
  private generateVoicePrompts(
    brand360: Brand360WithRelations,
    brandName: string
  ): GeneratedPromptData[] {
    const prompts: GeneratedPromptData[] = [];
    const templates = PROMPT_TEMPLATES.voice.templates;
    const categoryLabel = CATEGORY_LABELS.voice;

    const primaryArchetype = brand360.brandArchetype?.primaryArchetype || 'innovative';
    const secondaryArchetype = brand360.brandArchetype?.secondaryArchetype || 'expert';
    const expectedTone = brand360.brandVoiceProfile?.primaryTone;
    const vocabularyLevel = brand360.brandVoiceProfile?.vocabularyLevel || 'professional';

    for (const template of templates) {
      // Skip archetype comparison template if no secondary archetype
      if (template.id === 'voice_arch_3' && !brand360.brandArchetype?.secondaryArchetype) {
        continue;
      }

      const rendered = this.renderTemplate(template.template, {
        brandName,
        archetype: primaryArchetype, // backwards compatibility
        primaryArchetype,
        secondaryArchetype,
      });
      const promptData = this.createPromptData(
        'voice',
        categoryLabel,
        template,
        rendered,
        brandName
      );
      if (expectedTone) {
        promptData.expectedTone = expectedTone;
      }
      // Add vocabulary level for voice matching evaluation
      if (template.id.includes('vocab')) {
        promptData.expectedVocabulary = vocabularyLevel;
      }
      prompts.push(promptData);
    }

    return prompts.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Generate adversarial prompts (The Risk)
   */
  private generateAdversarialPrompts(
    brand360: Brand360WithRelations,
    brandName: string
  ): GeneratedPromptData[] {
    const prompts: GeneratedPromptData[] = [];
    const templates = PROMPT_TEMPLATES.adversarial.templates;
    const categoryLabel = CATEGORY_LABELS.adversarial;

    const competitors = brand360.competitorGraph?.competitors || [];
    const topCompetitor = competitors[0]?.name || 'competitors';
    const misconceptions = brand360.riskFactors?.commonMisconceptions || [];
    const negativeKeywords = brand360.riskFactors?.negativeKeywords || [];
    const objections: string[] = [];
    brand360.customerPersonas.forEach((p) => {
      if (p.objections) objections.push(...p.objections);
    });

    // Negative sentiment probes (basic neg_ templates only, not neg_keyword)
    for (const template of templates.filter(
      (t) => t.id.startsWith('adv_neg_') && !t.id.includes('keyword')
    )) {
      const rendered = this.renderTemplate(template.template, { brandName });
      prompts.push(
        this.createPromptData('adversarial', categoryLabel, template, rendered, brandName)
      );
    }

    // Negative keyword probes (NEW) - test if LLMs associate brand with negative terms
    for (const keyword of negativeKeywords.slice(0, 3)) {
      for (const template of templates.filter((t) => t.id.includes('neg_keyword'))) {
        const rendered = this.renderTemplate(template.template, {
          brandName,
          negativeKeyword: keyword,
        });
        prompts.push(
          this.createPromptData('adversarial', categoryLabel, template, rendered, brandName)
        );
      }
    }

    // Objection handling - increased from 2 to 4
    for (const objection of [...new Set(objections)].slice(0, 4)) {
      for (const template of templates.filter((t) => t.id.includes('obj'))) {
        const rendered = this.renderTemplate(template.template, {
          brandName,
          objection,
        });
        const promptData = this.createPromptData(
          'adversarial',
          categoryLabel,
          template,
          rendered,
          brandName
        );
        prompts.push(promptData);
      }
    }

    // Misconception probes - increased from 2 to 3 and use all misc templates
    for (const misconception of misconceptions.slice(0, 3)) {
      for (const template of templates.filter((t) => t.id.includes('misc'))) {
        const rendered = this.renderTemplate(template.template, {
          brandName,
          misconception,
        });
        prompts.push(
          this.createPromptData('adversarial', categoryLabel, template, rendered, brandName)
        );
      }
    }

    // Trust probes (NEW)
    for (const template of templates.filter((t) => t.id.includes('trust'))) {
      const rendered = this.renderTemplate(template.template, { brandName });
      prompts.push(
        this.createPromptData('adversarial', categoryLabel, template, rendered, brandName)
      );
    }

    // Competitor attack probes
    for (const competitor of competitors.slice(0, 2)) {
      for (const template of templates.filter((t) => t.id.includes('attack'))) {
        const rendered = this.renderTemplate(template.template, {
          brandName,
          competitorName: competitor.name,
        });
        const promptData = this.createPromptData(
          'adversarial',
          categoryLabel,
          template,
          rendered,
          brandName
        );
        promptData.targetCompetitor = competitor.name;
        prompts.push(promptData);
      }
    }

    // Hallucination traps - non-existent features
    for (const feature of HALLUCINATION_TRAP_FEATURES.slice(0, 2)) {
      for (const template of templates.filter(
        (t) => t.id.includes('hall') && t.id.includes('1')
      )) {
        const rendered = this.renderTemplate(template.template, {
          brandName,
          nonExistentFeature: feature,
        });
        prompts.push(
          this.createPromptData('adversarial', categoryLabel, template, rendered, brandName)
        );
      }
    }

    // Hallucination traps - fake awards
    for (const award of HALLUCINATION_TRAP_AWARDS.slice(0, 1)) {
      const template = templates.find((t) => t.id === 'adv_hall_3');
      if (template) {
        const rendered = this.renderTemplate(template.template, {
          brandName,
          nonExistentFeature: award,
        });
        prompts.push(
          this.createPromptData('adversarial', categoryLabel, template, rendered, brandName)
        );
      }
    }

    // Deduplicate
    const seen = new Set<string>();
    const deduplicated = prompts.filter((p) => {
      if (seen.has(p.renderedPrompt)) return false;
      seen.add(p.renderedPrompt);
      return true;
    });

    return deduplicated.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Generate review website prompts (The Trust)
   * Generates prompts that reference industry-specific review platforms
   */
  private async generateReviewWebsitePrompts(
    brand360: Brand360WithRelations,
    brandName: string,
    options: PromptGeneratorOptions
  ): Promise<GeneratedPromptData[]> {
    const prompts: GeneratedPromptData[] = [];
    const templates = REVIEW_WEBSITE_TEMPLATES;
    const categoryLabel = 'The Trust';
    const citationStyle = options.preferredCitationStyle || 'inline';

    // Get review websites - either from options or auto-detect from brand
    let reviewWebsites: ReviewWebsiteWithCategory[] = [];

    if (options.reviewWebsiteIds && options.reviewWebsiteIds.length > 0) {
      // Fetch specific websites by ID
      const allWebsites = await reviewWebsiteService.getAllActiveWebsites();
      reviewWebsites = allWebsites.filter((w) =>
        options.reviewWebsiteIds!.includes(w.id)
      );
    } else {
      // Auto-detect based on brand's category mappings
      reviewWebsites = await reviewWebsiteService.getRelevantWebsites(brand360.id);

      // If no mappings exist, try to auto-detect and get top 5 websites
      if (reviewWebsites.length === 0) {
        const detected = await reviewWebsiteService.autoDetectCategories(brand360.id, {
          category: brand360.products[0]?.category,
          industry: brand360.industry,
          description: brand360.products[0]?.name,
        });

        if (detected.length > 0) {
          // Get websites from top detected category
          const topCategory = detected[0];
          const categoryWebsites = await reviewWebsiteService.getWebsitesByCategory(
            topCategory.categoryId
          );
          const allWebsites = await reviewWebsiteService.getAllActiveWebsites();
          reviewWebsites = allWebsites.filter((w) =>
            categoryWebsites.some((cw) => cw.id === w.id)
          );
        }
      }
    }

    // Limit to top 5 review websites
    reviewWebsites = reviewWebsites.slice(0, 5);

    if (reviewWebsites.length === 0) {
      return prompts; // No review websites to generate prompts for
    }

    const competitors = brand360.competitorGraph?.competitors || [];
    const topCompetitor = competitors[0]?.name || '';
    const primaryProduct = brand360.products.find((p) => p.isHero) || brand360.products[0];
    const useCase = primaryProduct?.useCases?.[0] || 'business needs';

    // Generate prompts for each review website
    for (const website of reviewWebsites) {
      for (const template of templates) {
        // Skip competitor templates if no competitors
        if (template.id.includes('comp_review') && !topCompetitor) {
          continue;
        }

        const rendered = this.renderTemplate(template.template, {
          brandName,
          reviewSite: website.name,
          competitorName: topCompetitor,
          useCase,
        });

        const promptData: GeneratedPromptData = {
          category: template.id.includes('nav_') ? 'navigational' :
                    template.id.includes('func_') ? 'functional' : 'comparative',
          categoryLabel,
          intent: template.intent,
          template: template.template,
          renderedPrompt: rendered,
          expectedThemes: template.expectedThemes,
          expectedEntities: [brandName, website.name],
          expectedCitations: template.expectedCitations,
          adversarialTwist: template.adversarialTwist,
          hallucinationTest: template.hallucinationTest || false,
          priority: template.priority,
          isCustom: false,
          targetReviewWebsite: website.name,
          reviewSiteCitationStyle: citationStyle,
        };

        // Add competitor if present
        if (template.id.includes('comp_review') && topCompetitor) {
          promptData.targetCompetitor = topCompetitor;
          promptData.expectedEntities.push(topCompetitor);
        }

        prompts.push(promptData);
      }
    }

    // Deduplicate by rendered prompt
    const seen = new Set<string>();
    const deduplicated = prompts.filter((p) => {
      if (seen.has(p.renderedPrompt)) return false;
      seen.add(p.renderedPrompt);
      return true;
    });

    return deduplicated.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Render a template string with variables
   */
  private renderTemplate(
    template: string,
    variables: Record<string, string>
  ): string {
    let rendered = template;
    for (const [key, value] of Object.entries(variables)) {
      rendered = rendered.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return rendered;
  }

  /**
   * Create a GeneratedPromptData object from a template
   */
  private createPromptData(
    category: PromptCategory,
    categoryLabel: string,
    template: PromptTemplate,
    renderedPrompt: string,
    brandName: string
  ): GeneratedPromptData {
    return {
      category,
      categoryLabel,
      intent: template.intent,
      template: template.template,
      renderedPrompt,
      expectedThemes: template.expectedThemes,
      expectedEntities: [brandName],
      expectedCitations: template.expectedCitations,
      adversarialTwist: template.adversarialTwist,
      hallucinationTest: template.hallucinationTest || false,
      priority: template.priority,
      isCustom: false,
    };
  }
}
