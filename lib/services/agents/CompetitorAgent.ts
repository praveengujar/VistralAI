/**
 * CompetitorAgent - Discover competitors from website content
 *
 * Uses GPT-4o to:
 * 1. Infer competitors from website content
 * 2. Identify differentiators
 * 3. Determine market positioning
 */

import OpenAI from 'openai';
import {
  AgentResult,
  CompetitorAgentResult,
  CompetitorData,
  MarketPosition,
} from './types';

export class CompetitorAgent {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  /**
   * Discover competitors from various sources
   */
  async discover(
    brandName: string,
    category: string,
    websiteContent: string
  ): Promise<AgentResult<CompetitorAgentResult>> {
    const startTime = Date.now();

    try {
      // Step 1: AI-based competitor inference
      const aiCompetitors = await this.inferCompetitorsFromContent(
        brandName,
        category,
        websiteContent
      );

      // Step 2: Infer differentiators
      const differentiators = await this.inferDifferentiators(
        brandName,
        aiCompetitors,
        websiteContent
      );

      // Step 3: Determine market position
      const marketPosition = this.inferMarketPosition(aiCompetitors);

      const duration = Date.now() - startTime;

      return {
        success: true,
        data: {
          competitors: aiCompetitors,
          differentiators,
          marketPosition,
        },
        confidence: 0.75,
        source: 'competitor_agent',
        duration,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        confidence: 0,
        source: 'competitor_agent',
        errors: [errorMessage],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Infer competitors from website content using AI
   */
  private async inferCompetitorsFromContent(
    brandName: string,
    category: string,
    content: string
  ): Promise<Partial<CompetitorData>[]> {
    // Truncate content to avoid token limits
    const truncatedContent = content.substring(0, 10000);

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a competitive intelligence expert. Based on the website content for "${brandName}" in the "${category}" space, identify likely competitors.

Return a JSON object with:
{
  "competitors": [
    {
      "name": "Competitor Name",
      "website": "https://...",
      "description": "Brief description of what they do",
      "competitorType": "direct" | "indirect" | "aspirational",
      "threatLevel": "low" | "medium" | "high" | "critical",
      "marketPosition": "leader" | "challenger" | "niche" | "emerging",
      "pricingTier": "luxury" | "premium" | "mid" | "value" | "free",
      "strengths": ["strength1", "strength2"],
      "weaknesses": ["weakness1"],
      "rationale": "Why this is a competitor"
    }
  ]
}

Guidelines:
- Identify 5-10 competitors
- Be specific about why each is a competitor
- Include a mix of direct, indirect, and aspirational competitors
- Base analysis on content provided plus your knowledge of the industry
- If mentioned in the content, use that information; otherwise, infer from industry knowledge`,
        },
        {
          role: 'user',
          content: truncatedContent,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content_response = response.choices[0].message.content;
    if (!content_response) {
      return [];
    }

    const result = JSON.parse(content_response);
    const competitors = result.competitors || [];

    return competitors.map((c: Record<string, unknown>) => ({
      name: c.name as string,
      website: c.website as string,
      description: c.description as string,
      competitorType: (c.competitorType as CompetitorData['competitorType']) || 'direct',
      threatLevel: (c.threatLevel as CompetitorData['threatLevel']) || 'medium',
      marketPosition: c.marketPosition as CompetitorData['marketPosition'],
      pricingTier: c.pricingTier as CompetitorData['pricingTier'],
      strengths: (c.strengths as string[]) || [],
      weaknesses: (c.weaknesses as string[]) || [],
      discoveredBy: 'agent' as const,
    }));
  }

  /**
   * Infer differentiators between brand and competitors
   */
  private async inferDifferentiators(
    brandName: string,
    competitors: Partial<CompetitorData>[],
    content: string
  ): Promise<string[]> {
    if (competitors.length === 0) {
      return [];
    }

    const competitorNames = competitors.map((c) => c.name).join(', ');
    const truncatedContent = content.substring(0, 5000);

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `Based on this website content for "${brandName}", what are the key differentiators compared to competitors (${competitorNames})?

Return JSON: {"differentiators": ["diff1", "diff2", ...]}

Content: ${truncatedContent}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content_response = response.choices[0].message.content;
    if (!content_response) {
      return [];
    }

    const result = JSON.parse(content_response);
    return result.differentiators || [];
  }

  /**
   * Infer market position based on competitor analysis
   */
  private inferMarketPosition(competitors: Partial<CompetitorData>[]): MarketPosition {
    if (competitors.length === 0) {
      return 'emerging';
    }

    const positions = competitors.map((c) => c.marketPosition).filter(Boolean);

    // Count position types
    const leaderCount = positions.filter((p) => p === 'leader').length;
    const challengerCount = positions.filter((p) => p === 'challenger').length;
    const nicheCount = positions.filter((p) => p === 'niche').length;
    const emergingCount = positions.filter((p) => p === 'emerging').length;

    // Logic: If many leaders, we're likely a challenger
    // If many emerging players, it's an emerging market
    // If many niche players, we're in a niche market

    if (leaderCount >= 3) {
      return 'challenger'; // Competing against established leaders
    }

    if (emergingCount >= 4) {
      return 'emerging'; // New market with many new players
    }

    if (nicheCount >= 3) {
      return 'niche'; // Specialized market
    }

    if (challengerCount >= 2) {
      return 'challenger'; // Active competitive market
    }

    return 'challenger'; // Default to challenger
  }

  /**
   * Enrich competitor data with additional information
   */
  async enrichCompetitor(
    competitor: Partial<CompetitorData>
  ): Promise<Partial<CompetitorData>> {
    // In the future, this could:
    // 1. Crawl competitor website
    // 2. Look up G2/Capterra reviews
    // 3. Check social media presence
    // For now, return as-is
    return competitor;
  }

  /**
   * Compare brand against a specific competitor
   */
  async compareWithCompetitor(
    brandName: string,
    brandContent: string,
    competitorName: string
  ): Promise<{
    similarities: string[];
    brandAdvantages: string[];
    competitorAdvantages: string[];
  }> {
    const truncatedContent = brandContent.substring(0, 8000);

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `Compare "${brandName}" with "${competitorName}" based on the website content and your knowledge.

Return JSON:
{
  "similarities": ["what they have in common"],
  "brandAdvantages": ["where ${brandName} is stronger"],
  "competitorAdvantages": ["where ${competitorName} is stronger"]
}

Website content for ${brandName}:
${truncatedContent}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content_response = response.choices[0].message.content;
    if (!content_response) {
      return {
        similarities: [],
        brandAdvantages: [],
        competitorAdvantages: [],
      };
    }

    return JSON.parse(content_response);
  }
}
