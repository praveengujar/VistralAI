/**
 * CorrectionGeneratorAgent
 *
 * Generates fix suggestions for AI perception issues based on insights.
 * Uses LLM to create context-aware corrections for:
 * - Schema.org JSON-LD markup
 * - FAQ page content
 * - Website content recommendations
 * - Wikipedia edit suggestions
 */

import OpenAI from 'openai';
import {
  ProblemType,
  CORRECTION_GENERATION_PROMPTS,
  getTemplatesForProblemType,
  getPriorityForProblemType,
  getEffortForFixType,
} from './correctionTemplates';
import { AgentResult, Brand360GroundTruth } from './types';

// Lazy-initialized OpenAI client to avoid build-time errors
let openaiInstance: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiInstance;
}

// ============================================
// Types
// ============================================

export interface PerceptionInsightInput {
  id: string;
  category: string;
  priority: string;
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  platforms: string[];
  affectedPromptCategories: string[];
}

export interface CorrectionSuggestion {
  fixType: 'schema_org' | 'faq' | 'content' | 'wikipedia';
  title: string;
  description: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  estimatedImpact: string;
}

export interface CorrectionGeneratorResult {
  problemType: ProblemType;
  problemDescription: string;
  affectedPlatforms: string[];
  suggestions: CorrectionSuggestion[];
  schemaOrgFix?: string;
  faqPageSuggestion?: string;
  contentRecommendation?: string;
  wikipediaEditSuggestion?: string;
}

// ============================================
// CorrectionGeneratorAgent
// ============================================

export class CorrectionGeneratorAgent {
  /**
   * Map insight category to problem type
   */
  private mapCategoryToProblemType(category: string): ProblemType {
    switch (category.toLowerCase()) {
      case 'hallucination':
        return 'hallucination';
      case 'accuracy':
      case 'missing_info':
      case 'visibility':
        return 'missing_info';
      case 'sentiment':
      case 'voice':
        return 'wrong_sentiment';
      case 'competitive':
      case 'competitor_confusion':
        return 'competitor_confusion';
      default:
        return 'missing_info';
    }
  }

  /**
   * Generate corrections from an insight
   */
  async generateFromInsight(
    insight: PerceptionInsightInput,
    groundTruth: Brand360GroundTruth
  ): Promise<AgentResult<CorrectionGeneratorResult>> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      const problemType = this.mapCategoryToProblemType(insight.category);
      const suggestions: CorrectionSuggestion[] = [];

      // Build brand context for LLM
      const brandContext = this.buildBrandContext(groundTruth);

      // Generate Schema.org fix
      const schemaOrgFix = await this.generateSchemaOrgFix(
        problemType,
        insight.description,
        brandContext
      );
      if (schemaOrgFix) {
        suggestions.push({
          fixType: 'schema_org',
          title: 'Schema.org Structured Data Update',
          description: `Update your website's JSON-LD structured data to address ${insight.title.toLowerCase()}`,
          content: schemaOrgFix,
          priority: getPriorityForProblemType(problemType),
          effort: getEffortForFixType('schema_org'),
          estimatedImpact: 'High - Improves AI understanding of your brand',
        });
      }

      // Generate FAQ suggestions
      const faqSuggestion = await this.generateFAQSuggestion(
        problemType,
        insight.description,
        brandContext
      );
      if (faqSuggestion) {
        suggestions.push({
          fixType: 'faq',
          title: 'FAQ Page Addition',
          description: `Add FAQ entries to address common misconceptions and missing information`,
          content: faqSuggestion,
          priority: getPriorityForProblemType(problemType),
          effort: getEffortForFixType('faq'),
          estimatedImpact: 'Medium - Provides clear answers for AI to reference',
        });
      }

      // Generate content recommendation
      const contentRec = await this.generateContentRecommendation(
        problemType,
        insight.description,
        brandContext
      );
      if (contentRec) {
        suggestions.push({
          fixType: 'content',
          title: 'Content Update Recommendation',
          description: `Update website content to improve AI perception`,
          content: contentRec,
          priority: getPriorityForProblemType(problemType),
          effort: getEffortForFixType('content'),
          estimatedImpact: 'High - Creates authoritative content for AI training',
        });
      }

      // Generate Wikipedia edit suggestion (only for high priority issues)
      if (insight.priority === 'critical' || insight.priority === 'high') {
        const wikiSuggestion = await this.generateWikipediaEditSuggestion(
          problemType,
          insight.description,
          brandContext
        );
        if (wikiSuggestion) {
          suggestions.push({
            fixType: 'wikipedia',
            title: 'Wikipedia Edit Suggestion',
            description: `Suggested edits for your Wikipedia article (if applicable)`,
            content: wikiSuggestion,
            priority: getPriorityForProblemType(problemType),
            effort: getEffortForFixType('wikipedia'),
            estimatedImpact: 'Very High - Wikipedia is a primary AI training source',
          });
        }
      }

      const result: CorrectionGeneratorResult = {
        problemType,
        problemDescription: insight.description,
        affectedPlatforms: insight.platforms,
        suggestions,
        schemaOrgFix: suggestions.find((s) => s.fixType === 'schema_org')?.content,
        faqPageSuggestion: suggestions.find((s) => s.fixType === 'faq')?.content,
        contentRecommendation: suggestions.find((s) => s.fixType === 'content')?.content,
        wikipediaEditSuggestion: suggestions.find((s) => s.fixType === 'wikipedia')?.content,
      };

      return {
        success: true,
        data: result,
        confidence: 0.8,
        source: 'CorrectionGeneratorAgent',
        duration: Date.now() - startTime,
      };
    } catch (error) {
      console.error('[CorrectionGeneratorAgent] Error:', error);
      errors.push(error instanceof Error ? error.message : 'Unknown error');

      return {
        success: false,
        errors,
        confidence: 0,
        source: 'CorrectionGeneratorAgent',
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Build brand context string for LLM prompts
   */
  private buildBrandContext(groundTruth: Brand360GroundTruth): string {
    const parts: string[] = [];

    parts.push(`Brand Name: ${groundTruth.brandName}`);

    if (groundTruth.products.length > 0) {
      parts.push(`Products: ${groundTruth.products.map((p) => p.name).join(', ')}`);
    }

    if (groundTruth.claims.length > 0) {
      parts.push(`Key Claims: ${groundTruth.claims.map((c) => c.claimText).join('; ')}`);
    }

    if (groundTruth.competitors.length > 0) {
      parts.push(`Competitors: ${groundTruth.competitors.map((c) => c.name).join(', ')}`);
    }

    if (groundTruth.foundingYear) {
      parts.push(`Founded: ${groundTruth.foundingYear}`);
    }

    if (groundTruth.founders && groundTruth.founders.length > 0) {
      parts.push(`Founders: ${groundTruth.founders.join(', ')}`);
    }

    if (groundTruth.values.length > 0) {
      parts.push(`Values: ${groundTruth.values.join(', ')}`);
    }

    if (groundTruth.voiceProfile) {
      parts.push(`Brand Tone: ${groundTruth.voiceProfile.primaryTone}`);
    }

    return parts.join('\n');
  }

  /**
   * Generate Schema.org JSON-LD fix
   */
  private async generateSchemaOrgFix(
    problemType: ProblemType,
    issueDescription: string,
    brandContext: string
  ): Promise<string | null> {
    try {
      const prompt = CORRECTION_GENERATION_PROMPTS.schemaOrg
        .replace('{brandContext}', brandContext)
        .replace('{problemType}', problemType)
        .replace('{issueDescription}', issueDescription);

      const response = await getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a Schema.org expert. Generate valid, well-formed JSON-LD structured data.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return null;

      // Extract JSON from response if wrapped in markdown
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      return jsonMatch ? jsonMatch[1].trim() : content.trim();
    } catch (error) {
      console.error('[CorrectionGeneratorAgent] Schema.org generation error:', error);
      return null;
    }
  }

  /**
   * Generate FAQ page suggestion
   */
  private async generateFAQSuggestion(
    problemType: ProblemType,
    issueDescription: string,
    brandContext: string
  ): Promise<string | null> {
    try {
      const templates = getTemplatesForProblemType(problemType);
      const misconceptions = templates.faq
        .map((f) => f.question)
        .slice(0, 3)
        .join('\n');

      const prompt = CORRECTION_GENERATION_PROMPTS.faq
        .replace('{brandContext}', brandContext)
        .replace('{problemType}', problemType)
        .replace('{issueDescription}', issueDescription)
        .replace('{misconceptions}', misconceptions);

      const response = await getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a content strategist specializing in FAQ optimization for SEO and AI readability.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return null;

      // Try to extract JSON array from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const faqItems = JSON.parse(jsonMatch[0]) as Array<{
            question: string;
            answer: string;
          }>;
          // Format as readable FAQ
          return faqItems
            .map((item) => `Q: ${item.question}\nA: ${item.answer}`)
            .join('\n\n');
        } catch {
          return content.trim();
        }
      }

      return content.trim();
    } catch (error) {
      console.error('[CorrectionGeneratorAgent] FAQ generation error:', error);
      return null;
    }
  }

  /**
   * Generate content recommendation
   */
  private async generateContentRecommendation(
    problemType: ProblemType,
    issueDescription: string,
    brandContext: string
  ): Promise<string | null> {
    try {
      const prompt = CORRECTION_GENERATION_PROMPTS.content
        .replace('{brandContext}', brandContext)
        .replace('{problemType}', problemType)
        .replace('{issueDescription}', issueDescription);

      const response = await getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a brand content strategist. Create actionable content recommendations.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return null;

      // Try to parse JSON response
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const rec = JSON.parse(jsonMatch[0]) as {
            sectionTitle: string;
            headline: string;
            outline: string[];
            keyMessages: string[];
            toneGuidance: string;
          };

          // Format as readable recommendation
          const parts = [
            `## ${rec.sectionTitle}`,
            `### Headline: ${rec.headline}`,
            '',
            '### Content Outline:',
            ...rec.outline.map((item) => `- ${item}`),
            '',
            '### Key Messages:',
            ...rec.keyMessages.map((msg) => `- ${msg}`),
            '',
            `### Tone Guidance: ${rec.toneGuidance}`,
          ];

          return parts.join('\n');
        }
      } catch {
        // Fall through to return raw content
      }

      return content.trim();
    } catch (error) {
      console.error('[CorrectionGeneratorAgent] Content recommendation error:', error);
      return null;
    }
  }

  /**
   * Generate Wikipedia edit suggestion
   */
  private async generateWikipediaEditSuggestion(
    problemType: ProblemType,
    issueDescription: string,
    brandContext: string
  ): Promise<string | null> {
    try {
      const prompt = CORRECTION_GENERATION_PROMPTS.wikipedia
        .replace('{brandContext}', brandContext)
        .replace('{problemType}', problemType)
        .replace('{issueDescription}', issueDescription);

      const response = await getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a Wikipedia editor. Suggest edits that comply with Wikipedia policies (NPOV, verifiability, no original research).',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return null;

      // Try to parse JSON response
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const wiki = JSON.parse(jsonMatch[0]) as {
            suggestedEdits: string[];
            sourcesNeeded: string[];
            existingClaimsToUpdate: string[];
            notes: string;
          };

          // Format as readable suggestion
          const parts = [
            '## Wikipedia Edit Suggestions',
            '',
            '### Suggested Edits:',
            ...wiki.suggestedEdits.map((edit) => `- ${edit}`),
            '',
            '### Sources Needed:',
            ...wiki.sourcesNeeded.map((src) => `- ${src}`),
            '',
            '### Existing Claims to Update:',
            ...wiki.existingClaimsToUpdate.map((claim) => `- ${claim}`),
            '',
            `### Notes: ${wiki.notes}`,
          ];

          return parts.join('\n');
        }
      } catch {
        // Fall through to return raw content
      }

      return content.trim();
    } catch (error) {
      console.error('[CorrectionGeneratorAgent] Wikipedia suggestion error:', error);
      return null;
    }
  }

  /**
   * Batch generate corrections for multiple insights
   */
  async batchGenerate(
    insights: PerceptionInsightInput[],
    groundTruth: Brand360GroundTruth
  ): Promise<AgentResult<CorrectionGeneratorResult[]>> {
    const startTime = Date.now();
    const results: CorrectionGeneratorResult[] = [];
    const errors: string[] = [];

    for (const insight of insights) {
      const result = await this.generateFromInsight(insight, groundTruth);
      if (result.success && result.data) {
        results.push(result.data);
      } else if (result.errors) {
        errors.push(...result.errors);
      }

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return {
      success: results.length > 0,
      data: results,
      confidence: 0.8,
      source: 'CorrectionGeneratorAgent',
      errors: errors.length > 0 ? errors : undefined,
      duration: Date.now() - startTime,
    };
  }
}
