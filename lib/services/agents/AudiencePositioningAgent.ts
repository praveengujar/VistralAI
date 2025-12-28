/**
 * AudiencePositioningAgent - Extract Target Audience & Market Positioning
 *
 * This agent handles:
 * 1. Extracting target audience characteristics from website
 * 2. Generating detailed customer personas
 * 3. Extracting market positioning and value propositions
 * 4. Identifying proof points and differentiators
 */

import OpenAI from 'openai';
import {
  AgentResult,
  AudiencePositioningResult,
  ExtractedTargetAudience,
  ExtractedPersona,
  ExtractedPositioning,
  AudiencePositioningOptions,
} from './types';

export class AudiencePositioningAgent {
  private openai: OpenAI;
  private firecrawlUrl: string;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.firecrawlUrl = process.env.FIRECRAWL_INTERNAL_URL || 'http://localhost:3002';
  }

  /**
   * Extract target audience and positioning from website
   */
  async extract(
    websiteUrl: string,
    brandName: string,
    existingContext?: {
      products?: string[];
      competitors?: string[];
      brandValues?: string[];
    },
    options?: AudiencePositioningOptions
  ): Promise<AgentResult<AudiencePositioningResult>> {
    const startTime = Date.now();

    try {
      console.log('[AudiencePositioning] Starting extraction for:', brandName);
      options?.onProgress?.('crawling', 0, 'Crawling audience-relevant pages...');

      // Step 1: Crawl relevant pages
      const pageContents = await this.crawlRelevantPages(websiteUrl);
      console.log(`[AudiencePositioning] Crawled ${pageContents.length} pages`);

      if (pageContents.length === 0) {
        return {
          success: false,
          confidence: 0,
          source: 'audience_positioning_agent',
          errors: ['No content found on website'],
          duration: Date.now() - startTime,
        };
      }

      options?.onProgress?.('extracting_audience', 25, 'Extracting target audience...');

      // Step 2: Extract target audience
      const targetAudience = options?.skipAudience
        ? this.getDefaultTargetAudience()
        : await this.extractTargetAudience(pageContents, brandName, existingContext);

      options?.onProgress?.('generating_personas', 50, 'Generating customer personas...');

      // Step 3: Generate personas
      const personas = options?.skipPersonas
        ? []
        : await this.generatePersonas(
            pageContents,
            brandName,
            targetAudience,
            existingContext,
            options?.maxPersonas || 4
          );

      options?.onProgress?.('extracting_positioning', 75, 'Extracting market positioning...');

      // Step 4: Extract positioning
      const positioning = options?.skipPositioning
        ? this.getDefaultPositioning()
        : await this.extractPositioning(pageContents, brandName, targetAudience, existingContext);

      const overallConfidence = this.calculateConfidence(targetAudience, personas, positioning);

      options?.onProgress?.('complete', 100, 'Extraction complete');

      console.log('[AudiencePositioning] Extraction complete, confidence:', overallConfidence);

      return {
        success: true,
        data: {
          targetAudience,
          personas,
          positioning,
          confidence: overallConfidence,
        },
        confidence: overallConfidence,
        source: 'audience_positioning_agent',
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      console.error('[AudiencePositioning] Error:', error);
      return {
        success: false,
        confidence: 0,
        source: 'audience_positioning_agent',
        errors: [error.message],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Crawl pages relevant to audience and positioning
   */
  private async crawlRelevantPages(
    websiteUrl: string
  ): Promise<{ url: string; content: string }[]> {
    const baseUrl = websiteUrl.replace(/\/$/, '');

    const pagesToCrawl = [
      baseUrl, // Homepage
      `${baseUrl}/about`,
      `${baseUrl}/about-us`,
      `${baseUrl}/company`,
      `${baseUrl}/customers`,
      `${baseUrl}/case-studies`,
      `${baseUrl}/solutions`,
      `${baseUrl}/industries`,
      `${baseUrl}/for-enterprise`,
      `${baseUrl}/for-startups`,
      `${baseUrl}/for-agencies`,
      `${baseUrl}/for-business`,
      `${baseUrl}/pricing`,
      `${baseUrl}/why-us`,
      `${baseUrl}/why`,
      `${baseUrl}/features`,
      `${baseUrl}/product`,
      `${baseUrl}/products`,
    ];

    const contents: { url: string; content: string }[] = [];

    // Crawl pages in parallel with a limit
    const crawlPromises = pagesToCrawl.map(async (url) => {
      try {
        const response = await fetch(`${this.firecrawlUrl}/v1/scrape`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url,
            formats: ['markdown'],
            timeout: 15000,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.data?.markdown && data.data.markdown.length > 200) {
            return { url, content: data.data.markdown };
          }
        }
      } catch (e) {
        // Skip failed pages silently
      }
      return null;
    });

    const results = await Promise.all(crawlPromises);
    results.forEach((result) => {
      if (result) contents.push(result);
    });

    return contents;
  }

  /**
   * Extract target audience characteristics
   */
  private async extractTargetAudience(
    pages: { url: string; content: string }[],
    brandName: string,
    context?: { products?: string[]; competitors?: string[]; brandValues?: string[] }
  ): Promise<ExtractedTargetAudience> {
    const combinedContent = pages
      .map((p) => `### ${p.url}\n${p.content.slice(0, 5000)}`)
      .join('\n\n')
      .substring(0, 30000);

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a market research expert. Analyze the website content for "${brandName}" and extract their target audience characteristics.

Determine:
1. Primary market type (B2B, B2C, B2B2C, D2C)
2. Geographic focus (regions/countries they target)
3. Target industries (for B2B)
4. Target company sizes (Startup, SMB, Mid-Market, Enterprise)
5. Target job titles and departments
6. Consumer demographics if B2C (age range, income level)

Look for signals like:
- "For enterprise teams...", "Built for startups..."
- Customer logos and testimonials
- Case study company types
- Pricing tiers that indicate target (enterprise pricing vs consumer)
- Language and terminology used
- "Industries we serve" sections

${context?.products?.length ? `Known Products: ${context.products.join(', ')}` : ''}
${context?.competitors?.length ? `Known Competitors: ${context.competitors.join(', ')}` : ''}

Return JSON:
{
  "primaryMarket": "B2B" | "B2C" | "B2B2C" | "D2C",
  "geographicFocus": ["North America", "Europe", "APAC", "Global"],
  "targetIndustries": ["Technology", "Healthcare", "Finance"],
  "targetCompanySize": ["Startup", "SMB", "Mid-Market", "Enterprise"],
  "targetJobTitles": ["VP of Marketing", "Developer", "CEO"],
  "targetDepartments": ["Marketing", "Engineering", "Operations"],
  "ageRange": {"min": 25, "max": 45} | null,
  "incomeLevel": "Middle" | "Upper-Middle" | "High" | "Affluent" | null
}`,
        },
        {
          role: 'user',
          content: combinedContent,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    try {
      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        primaryMarket: result.primaryMarket || 'B2B',
        geographicFocus: result.geographicFocus || ['Global'],
        targetIndustries: result.targetIndustries || [],
        targetCompanySize: result.targetCompanySize || [],
        targetJobTitles: result.targetJobTitles || [],
        targetDepartments: result.targetDepartments || [],
        ageRange: result.ageRange,
        incomeLevel: result.incomeLevel,
      };
    } catch (e) {
      console.error('[AudiencePositioning] Failed to parse target audience:', e);
      return this.getDefaultTargetAudience();
    }
  }

  /**
   * Generate customer personas
   */
  private async generatePersonas(
    pages: { url: string; content: string }[],
    brandName: string,
    targetAudience: ExtractedTargetAudience,
    context?: { products?: string[]; competitors?: string[]; brandValues?: string[] },
    maxPersonas: number = 4
  ): Promise<ExtractedPersona[]> {
    const combinedContent = pages
      .map((p) => `### ${p.url}\n${p.content.slice(0, 4000)}`)
      .join('\n\n')
      .substring(0, 25000);

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a customer persona expert. Based on the website content for "${brandName}" and the target audience profile, generate ${maxPersonas} detailed customer personas.

Target Audience Context:
- Primary Market: ${targetAudience.primaryMarket}
- Industries: ${targetAudience.targetIndustries.join(', ') || 'Various'}
- Company Sizes: ${targetAudience.targetCompanySize.join(', ') || 'Various'}
- Job Titles: ${targetAudience.targetJobTitles.join(', ') || 'Various'}

${context?.products?.length ? `Products: ${context.products.join(', ')}` : ''}
${context?.brandValues?.length ? `Brand Values: ${context.brandValues.join(', ')}` : ''}

For each persona, create a rich profile including:
- A memorable alliterative name (e.g., "Marketing Mary", "Developer Dave")
- Job title and archetype (The Innovator, The Pragmatist, The Skeptic, The Champion)
- Demographics and professional context
- Psychographics (personality, values, motivations, frustrations)
- 3-5 specific pain points with severity levels
- Goals and success metrics
- Buying behavior (role, criteria, timeline)
- Information sources they trust
- Common objections
- Key messages that would resonate

Return JSON:
{
  "personas": [
    {
      "name": "Marketing Mary",
      "title": "VP of Marketing",
      "archetype": "The Champion",
      "demographics": {
        "ageRange": "35-44",
        "location": "US Major Metro",
        "companySize": "Mid-Market",
        "industry": "SaaS",
        "seniorityLevel": "Director/VP"
      },
      "psychographics": {
        "personality": "Results-driven, data-oriented, always looking for competitive edge",
        "values": ["Efficiency", "Innovation", "Team Success"],
        "motivations": ["Career advancement", "Proving ROI", "Building high-performing team"],
        "frustrations": ["Too many tools", "Lack of attribution", "Slow processes"]
      },
      "painPoints": [
        {
          "title": "Attribution Complexity",
          "description": "Can't accurately attribute revenue to marketing efforts",
          "severity": "High",
          "category": "Measurement"
        }
      ],
      "goals": ["Increase marketing ROI by 25%", "Reduce CAC", "Improve team productivity"],
      "buyingBehavior": {
        "role": "Decision Maker",
        "criteria": ["ROI proof", "Ease of implementation", "Integration capabilities"],
        "timeline": "1-3 months"
      },
      "informationSources": ["LinkedIn", "Marketing podcasts", "Peer recommendations", "G2"],
      "currentSolution": "Spreadsheets and multiple point solutions",
      "objections": ["Integration complexity", "Team adoption", "Budget justification"],
      "keyMessages": ["Proven ROI in 30 days", "Seamless integration", "Loved by marketing teams"],
      "priority": 1,
      "confidence": 0.85
    }
  ]
}

Create realistic, actionable personas based on evidence from the content. Assign priority 1 to primary personas, 2 to secondary, 3 to tertiary.`,
        },
        {
          role: 'user',
          content: combinedContent,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    try {
      const result = JSON.parse(response.choices[0].message.content || '{"personas": []}');
      return (result.personas || []).slice(0, maxPersonas);
    } catch (e) {
      console.error('[AudiencePositioning] Failed to parse personas:', e);
      return [];
    }
  }

  /**
   * Extract market positioning
   */
  private async extractPositioning(
    pages: { url: string; content: string }[],
    brandName: string,
    targetAudience: ExtractedTargetAudience,
    context?: { products?: string[]; competitors?: string[]; brandValues?: string[] }
  ): Promise<ExtractedPositioning> {
    const combinedContent = pages
      .map((p) => `### ${p.url}\n${p.content.slice(0, 4000)}`)
      .join('\n\n')
      .substring(0, 25000);

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a brand positioning strategist. Analyze the website content for "${brandName}" and extract their market positioning.

Target Audience: ${targetAudience.primaryMarket}
${context?.competitors?.length ? `Known Competitors: ${context.competitors.join(', ')}` : ''}
${context?.brandValues?.length ? `Brand Values: ${context.brandValues.join(', ')}` : ''}

Extract or infer:
1. Positioning statement (construct one if not explicit)
2. Category definition (what space they compete in)
3. Primary benefit and competitive alternative
4. Category position (Leader, Challenger, Niche, Disruptor)
5. Key differentiators
6. Value propositions (2-4 key value props)
7. Elevator pitch
8. Pricing position (Premium, Mid-Market, Value, Freemium)
9. Before/After transformation story
10. Proof points (stats, awards, customer logos, testimonials)

Return JSON:
{
  "positioningStatement": "For [audience] who [need], [brand] is a [category] that [benefit] unlike [alternative] because [reason]",
  "targetAudienceSummary": "B2B marketing teams at mid-market companies",
  "categoryDefinition": "AI-powered marketing analytics platform",
  "primaryBenefit": "Increase marketing ROI with AI-powered attribution",
  "competitiveAlternative": "traditional analytics tools and spreadsheets",
  "reasonToBelieve": "Patented AI that analyzes 10x more touchpoints",
  "categoryPosition": "Challenger",
  "primaryDifferentiator": "AI-powered multi-touch attribution",
  "secondaryDifferentiators": ["Real-time insights", "Easy implementation", "Predictive analytics"],
  "valuePropositions": [
    {
      "headline": "See Your True Marketing ROI",
      "description": "Finally understand which channels drive revenue with AI-powered attribution",
      "type": "Primary"
    },
    {
      "headline": "Predict What Works Before You Spend",
      "description": "Use predictive analytics to optimize budget allocation",
      "type": "Secondary"
    }
  ],
  "elevatorPitch": "We help marketing teams understand their true ROI using AI that analyzes every customer touchpoint, so they can invest in what works.",
  "pricingPosition": "Mid-Market",
  "beforeState": "Marketing teams struggle to prove ROI, waste budget on underperforming channels",
  "afterState": "Marketing teams confidently allocate budget to highest-performing channels",
  "proofPoints": [
    {
      "type": "Statistic",
      "title": "500+ marketing teams trust us",
      "metricValue": "500+"
    },
    {
      "type": "Award",
      "title": "G2 Leader in Marketing Analytics"
    },
    {
      "type": "Testimonial",
      "title": "Increased our ROI by 40%",
      "metricValue": "40%"
    }
  ]
}`,
        },
        {
          role: 'user',
          content: combinedContent,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    try {
      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        positioningStatement: result.positioningStatement || '',
        targetAudienceSummary: result.targetAudienceSummary,
        categoryDefinition: result.categoryDefinition || '',
        primaryBenefit: result.primaryBenefit || '',
        competitiveAlternative: result.competitiveAlternative || '',
        reasonToBelieve: result.reasonToBelieve || '',
        categoryPosition: result.categoryPosition || 'Challenger',
        primaryDifferentiator: result.primaryDifferentiator || '',
        secondaryDifferentiators: result.secondaryDifferentiators || [],
        valuePropositions: result.valuePropositions || [],
        elevatorPitch: result.elevatorPitch || '',
        pricingPosition: result.pricingPosition || 'Mid-Market',
        beforeState: result.beforeState || '',
        afterState: result.afterState || '',
        proofPoints: result.proofPoints || [],
      };
    } catch (e) {
      console.error('[AudiencePositioning] Failed to parse positioning:', e);
      return this.getDefaultPositioning();
    }
  }

  /**
   * Calculate overall extraction confidence
   */
  private calculateConfidence(
    audience: ExtractedTargetAudience,
    personas: ExtractedPersona[],
    positioning: ExtractedPositioning
  ): number {
    let score = 0;
    let total = 0;

    // Audience completeness (25 points)
    if (audience.primaryMarket) score += 10;
    if (audience.geographicFocus?.length) score += 3;
    if (audience.targetIndustries?.length) score += 4;
    if (audience.targetJobTitles?.length) score += 4;
    if (audience.targetCompanySize?.length) score += 4;
    total += 25;

    // Persona quality (35 points)
    if (personas.length >= 2) score += 10;
    if (personas.length >= 3) score += 5;
    if (personas.length >= 4) score += 5;
    // Average confidence from personas
    const avgPersonaConfidence =
      personas.reduce((sum, p) => sum + (p.confidence || 0.5), 0) / Math.max(personas.length, 1);
    score += avgPersonaConfidence * 15;
    total += 35;

    // Positioning completeness (40 points)
    if (positioning.positioningStatement) score += 8;
    if (positioning.primaryDifferentiator) score += 6;
    if (positioning.valuePropositions?.length >= 2) score += 8;
    if (positioning.elevatorPitch) score += 6;
    if (positioning.proofPoints?.length >= 2) score += 6;
    if (positioning.beforeState && positioning.afterState) score += 6;
    total += 40;

    return Math.min((score / total) * 100, 100) / 100;
  }

  /**
   * Default target audience when extraction fails
   */
  private getDefaultTargetAudience(): ExtractedTargetAudience {
    return {
      primaryMarket: 'B2B',
      geographicFocus: ['Global'],
      targetIndustries: [],
      targetCompanySize: [],
      targetJobTitles: [],
      targetDepartments: [],
    };
  }

  /**
   * Default positioning when extraction fails
   */
  private getDefaultPositioning(): ExtractedPositioning {
    return {
      positioningStatement: '',
      categoryDefinition: '',
      primaryBenefit: '',
      competitiveAlternative: '',
      reasonToBelieve: '',
      categoryPosition: 'Challenger',
      primaryDifferentiator: '',
      secondaryDifferentiators: [],
      valuePropositions: [],
      elevatorPitch: '',
      pricingPosition: 'Mid-Market',
      beforeState: '',
      afterState: '',
      proofPoints: [],
    };
  }
}
