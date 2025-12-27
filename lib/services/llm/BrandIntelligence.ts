import { CrawlResult } from '../crawler/WebCrawler';
import { FEATURES } from '@/lib/config/features';
import { z } from 'zod';
import { BRAND_PROFILE_PROMPTS } from './prompts';
import { Brand360Profile } from './types';

/**
 * Zod schemas for type-safe validation of LLM outputs (Legacy/Internal use)
 */

const BrandIdentitySchema = z.object({
  mission: z.string().describe('Brand mission statement'),
  vision: z.string().describe('Brand vision statement'),
  coreValues: z
    .array(z.string())
    .describe('Core values (3-5 key values)')
    .default([]),
  brandVoiceAttributes: z
    .array(z.string())
    .describe('Brand voice attributes (e.g., Professional, Friendly, Innovative)')
    .default([]),
  uniqueSellingPropositions: z
    .array(z.string())
    .describe('Unique selling propositions')
    .default([]),
  targetAudienceSummary: z.string().describe('Summary of target audience'),
  industryVertical: z.string().describe('Primary industry vertical'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('Overall confidence score (0-1)'),
});

type BrandIdentityExtraction = z.infer<typeof BrandIdentitySchema>;

const CompetitorSchema = z.object({
  name: z.string(),
  website: z.string().optional(),
  competitionType: z.enum(['direct', 'indirect', 'aspirational']),
  rationale: z.string(),
  confidence: z.number().min(0).max(1),
});

type CompetitorSuggestion = z.infer<typeof CompetitorSchema>;

const ProductCategorySchema = z.object({
  name: z.string(),
  description: z.string(),
  keyFeatures: z.array(z.string()),
  targetMarket: z.string(),
});

type ProductCategory = z.infer<typeof ProductCategorySchema>;

/**
 * Mock LLM response generators (unchanged)
 */
function generateMockBrandIdentity(
  domain: string,
  crawlData: CrawlResult,
): BrandIdentityExtraction {
  // Mock logic
  const brandNameFromDomain = domain.split('.')[0];

  return {
    mission: 'To empower businesses with innovative solutions and exceptional service',
    vision: 'To become the global leader in our market',
    coreValues: ['Quality', 'Innovation', 'Customer Success'],
    brandVoiceAttributes: ['Professional', 'Customer-Focused'],
    uniqueSellingPropositions: [`Premium solutions for ${brandNameFromDomain}`],
    targetAudienceSummary: 'Enterprise and mid-market businesses',
    industryVertical: 'Technology',
    confidence: 0.85,
  };
}

function generateMockCompetitors(brandName: string): CompetitorSuggestion[] {
  return [
    {
      name: 'Market Leader Inc',
      competitionType: 'direct',
      rationale: 'Similar product offerings',
      confidence: 0.9,
    },
    {
      name: 'Innovation Systems',
      competitionType: 'direct',
      rationale: 'Competing in same segment',
      confidence: 0.85,
    },
  ];
}

function generateMockProducts(crawlData: CrawlResult): ProductCategory[] {
  return [
    {
      name: 'Premium Solution',
      description: 'Enterprise-grade solution',
      keyFeatures: ['Analytics', 'Reporting'],
      targetMarket: 'Enterprise',
    },
  ];
}

/**
 * Main BrandIntelligence class
 */
export class BrandIntelligence {
  private anthropicApiKey: string;
  private openaiApiKey: string;
  private useOpenAI: boolean;
  private lastCallTime: number = 0;
  private minDelayMs: number = 1000; // Minimum 1 second between calls

  constructor() {
    this.anthropicApiKey = process.env.ANTHROPIC_API_KEY || '';
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
    this.useOpenAI = !!this.openaiApiKey;
  }

  /**
   * Extracts brand identity using new prompts but mapping to legacy schema
   */
  async extractBrandIdentity(
    crawlData: CrawlResult,
    domain: string,
  ): Promise<BrandIdentityExtraction> {
    if (!FEATURES.USE_REAL_API || (!this.openaiApiKey && !this.anthropicApiKey)) {
      return generateMockBrandIdentity(domain, crawlData);
    }

    try {
      console.log('[BrandIntelligence] Calling API for brand identity extraction');
      // Use new modular prompt
      const result = await this.callLLM('extract-brand-identity', {
        firecrawl_markdown_content: crawlData.homepage?.content || crawlData.rawText,
      });

      // Map new detailed response to legacy schema
      const mappedResult: BrandIdentityExtraction = {
        mission: result.mission?.statement || '',
        vision: result.vision?.statement || '',
        coreValues: (result.coreValues || []).map((v: any) => v.value),
        brandVoiceAttributes: [], // Voice is extracted separately in new system
        uniqueSellingPropositions: result.uniqueValueProposition ? [result.uniqueValueProposition] : [],
        targetAudienceSummary: '', // Audience is separate
        industryVertical: result.industry || '',
        confidence: result.sectionConfidence || 0.8,
      };

      // Zod parse might fail if fields are missing, but we mapped safely above with fallbacks
      // However, we need to satisfy the schema types.
      return mappedResult;
    } catch (error) {
      console.warn('[BrandIntelligence] API failed, falling back to mock:', error instanceof Error ? error.message : String(error));
      return generateMockBrandIdentity(domain, crawlData);
    }
  }

  /**
   * Identifies competitors using new prompts
   */
  async identifyCompetitors(
    brandName: string,
    crawlData: CrawlResult,
  ): Promise<CompetitorSuggestion[]> {
    if (!FEATURES.USE_REAL_API || (!this.openaiApiKey && !this.anthropicApiKey)) {
      return generateMockCompetitors(brandName);
    }

    try {
      console.log('[BrandIntelligence] Calling API to identify competitors');
      const result = await this.callLLM('identify-competitors', {
        firecrawl_markdown_content: crawlData.homepage?.content || crawlData.rawText,
        industry: 'Inferred', // In a real flow, pass inferred industry
        category: 'Inferred',
        product_summary: 'Inferred',
        uvp: 'Inferred',
        target_audience: 'Inferred',
      });

      // Map to legacy schema
      const competitors = (result.competitors || []).map((comp: any) => ({
        name: comp.name,
        website: '',
        competitionType: comp.type, // Map 'type' to 'competitionType'
        rationale: comp.overlapArea || 'Competitor in same space',
        confidence: comp.confidence,
      }));

      return z.array(CompetitorSchema).parse(competitors);
    } catch (error) {
      console.warn('[BrandIntelligence] Competitor identification failed:', error instanceof Error ? error.message : String(error));
      return generateMockCompetitors(brandName);
    }
  }

  /**
   * Categorizes products using new prompts
   */
  async categorizeProducts(
    crawlData: CrawlResult,
  ): Promise<ProductCategory[]> {
    if (!FEATURES.USE_REAL_API || (!this.openaiApiKey && !this.anthropicApiKey)) {
      return generateMockProducts(crawlData);
    }

    try {
      console.log('[BrandIntelligence] Calling API to categorize products');
      const result = await this.callLLM('categorize-products', {
        firecrawl_markdown_content: crawlData.homepage?.content || crawlData.rawText,
      });

      // Map to legacy schema
      const products: ProductCategory[] = [];

      // If categories exist
      if (result.categories && result.categories.length > 0) {
        result.categories.forEach((cat: any) => {
          products.push({
            name: cat.name,
            description: cat.description,
            keyFeatures: [],
            targetMarket: '',
          });
        });
      }

      // If heroOfferings exist
      if (result.heroOfferings && result.heroOfferings.length > 0) {
        result.heroOfferings.forEach((hero: any) => {
          products.push({
            name: hero.name,
            description: hero.description,
            keyFeatures: hero.keyBenefits || [],
            targetMarket: '',
          });
        });
      }

      return products;
    } catch (error) {
      console.warn('[BrandIntelligence] Product categorization failed:', error instanceof Error ? error.message : String(error));
      return generateMockProducts(crawlData);
    }
  }

  /**
   * Extracts comprehensive Brand 360° Profile using unified prompt
   */
  async extractComprehensiveBrandProfile(
    crawlData: CrawlResult,
  ): Promise<Brand360Profile | null> {
    console.log('[BrandIntelligence] extractComprehensiveBrandProfile called:', {
      USE_REAL_API: FEATURES.USE_REAL_API,
      hasOpenAIKey: !!this.openaiApiKey,
      hasAnthropicKey: !!this.anthropicApiKey,
    });

    if (!FEATURES.USE_REAL_API || (!this.openaiApiKey && !this.anthropicApiKey)) {
      console.warn('[BrandIntelligence] ⚠️ Returning NULL - USE_REAL_API=false or no API keys');
      return null;
    }

    try {
      console.log('[BrandIntelligence] Calling GPT-4o-mini for comprehensive extraction');
      // Pass empty stubs for additional data if not available
      const result = await this.callLLM('extract-comprehensive-profile', {
        firecrawl_markdown_content: crawlData.homepage?.content || crawlData.rawText,
        product_data: 'None available previously',
        competitor_data: 'None available previously'
      });

      console.log('[BrandIntelligence] Comprehensive extraction successful:', {
        hasBrandIdentity: !!result?.brandIdentity,
        mission: result?.brandIdentity?.mission?.statement?.substring(0, 50) || 'EMPTY',
        vision: result?.brandIdentity?.vision?.statement?.substring(0, 50) || 'EMPTY',
      });
      return result as Brand360Profile;
    } catch (error) {
      console.warn('[BrandIntelligence] Comprehensive extraction failed:', error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  /**
   * Generic LLM Caller (OpenAI preferred)
   */
  private async callLLM(task: string, variables: Record<string, string>): Promise<any> {
    if (this.useOpenAI && this.openaiApiKey) {
      return this.callOpenAI(task, variables);
    }
    throw new Error('OpenAI API Key required for this new prompt system');
  }

  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;

    if (timeSinceLastCall < this.minDelayMs) {
      const waitTime = this.minDelayMs - timeSinceLastCall;
      console.log(`[BrandIntelligence] Rate limiting: waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastCallTime = Date.now();
  }

  private estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  private repairJSON(jsonString: string): any {
    try {
      // Try direct parse first
      return JSON.parse(jsonString);
    } catch (e) {
      console.log('[BrandIntelligence] Initial JSON parse failed, attempting repair...');

      // Attempt repairs
      let repaired = jsonString
        .replace(/,\s*}/g, '}')  // Remove trailing commas before }
        .replace(/,\s*]/g, ']')  // Remove trailing commas before ]
        .trim();

      // Try to balance brackets
      const openBraces = (repaired.match(/{/g) || []).length;
      const closeBraces = (repaired.match(/}/g) || []).length;
      if (openBraces > closeBraces) {
        console.log(`[BrandIntelligence] Adding ${openBraces - closeBraces} closing braces`);
        repaired += '}'.repeat(openBraces - closeBraces);
      }

      const openBrackets = (repaired.match(/\[/g) || []).length;
      const closeBrackets = (repaired.match(/]/g) || []).length;
      if (openBrackets > closeBrackets) {
        console.log(`[BrandIntelligence] Adding ${openBrackets - closeBrackets} closing brackets`);
        repaired += ']'.repeat(openBrackets - closeBrackets);
      }

      return JSON.parse(repaired);
    }
  }

  private async callOpenAI(task: string, variables: Record<string, string>): Promise<any> {
    // Apply rate limiting
    await this.rateLimit();

    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    let systemPrompt = BRAND_PROFILE_PROMPTS.MASTER_SYSTEM;
    let userPromptTemplate = '';

    switch (task) {
      case 'extract-comprehensive-profile':
        userPromptTemplate = BRAND_PROFILE_PROMPTS.UNIFIED_PROFILE;
        break;
      case 'extract-brand-identity':
        userPromptTemplate = BRAND_PROFILE_PROMPTS.BRAND_IDENTITY;
        break;
      case 'identify-competitors':
        userPromptTemplate = BRAND_PROFILE_PROMPTS.COMPETITIVE_LANDSCAPE;
        break;
      case 'categorize-products':
        userPromptTemplate = BRAND_PROFILE_PROMPTS.PRODUCT_SERVICES;
        break;
      default:
        throw new Error(`Unknown task: ${task}`);
    }

    // Interpolate variables
    let userPrompt = userPromptTemplate;
    for (const [key, value] of Object.entries(variables)) {
      // Replace globally
      userPrompt = userPrompt.split(`{${key}}`).join(value || 'N/A');
    }

    // Log estimated token usage
    const estimatedTokens = this.estimateTokens(systemPrompt + userPrompt);
    console.log(`[BrandIntelligence] Task: ${task}, Estimated tokens: ${estimatedTokens}`);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
          max_tokens: 16000,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[BrandIntelligence] OpenAI API error ${response.status}:`, errorBody);
        throw new Error(`OpenAI API error ${response.status}: ${errorBody}`);
      }

      const result = await response.json();
      let content = result.choices[0].message.content;

      // Strip markdown code blocks if present (OpenAI sometimes wraps JSON in ```json...```)
      if (content.startsWith('```')) {
        content = content.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
      }

      // Try to parse JSON with repair logic
      try {
        const parsed = this.repairJSON(content);

        // Debug: Log the actual LLM response structure
        console.log(`[BrandIntelligence] LLM Response for ${task}:`, JSON.stringify(parsed, null, 2).substring(0, 1500));

        return parsed;
      } catch (parseError) {
        console.error('[BrandIntelligence] Failed to parse JSON even after repair attempts');
        console.error('[BrandIntelligence] Raw content (first 500 chars):', content.substring(0, 500));
        console.error('[BrandIntelligence] Parse error:', parseError);
        throw new Error(`JSON parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }

    } catch (error) {
      console.error(`[BrandIntelligence] Error calling OpenAI for ${task}:`, error);
      throw error;
    }
  }
}

export function createBrandIntelligence(): BrandIntelligence {
  return new BrandIntelligence();
}

/**
 * Validators (Legacy)
 */
export function validateBrandIdentity(data: unknown): BrandIdentityExtraction {
  return BrandIdentitySchema.parse(data);
}

export function validateCompetitors(data: unknown): CompetitorSuggestion[] {
  return z.array(CompetitorSchema).parse(data);
}

export function validateProducts(data: unknown): ProductCategory[] {
  return z.array(ProductCategorySchema).parse(data);
}
