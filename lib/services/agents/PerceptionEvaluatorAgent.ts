/**
 * PerceptionEvaluatorAgent - LLM-as-a-Judge evaluation
 *
 * Scores LLM responses on 5 metrics:
 * 1. Faithfulness/Accuracy
 * 2. Completeness (Share of Voice)
 * 3. Sentiment
 * 4. Voice Alignment
 * 5. Hallucination Detection
 */

import OpenAI from 'openai';
import {
  AgentResult,
  EvaluationMetrics,
  LLMPlatform,
  PerceptionEvaluatorResult,
  Brand360GroundTruth,
} from './types';
import {
  EVALUATION_PROMPTS,
  formatGroundTruth,
  formatVoiceProfile,
} from './evaluationPrompts';

interface QueryResult {
  response: string;
  responseTime: number;
  tokensUsed?: number;
  model: string;
}

interface PromptContext {
  renderedPrompt: string;
  hallucinationTest?: boolean;
  adversarialTwist?: string;
  expectedThemes?: string[];
  expectedTone?: string;
}

export class PerceptionEvaluatorAgent {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  /**
   * Query an LLM platform and get response
   * Note: For Phase 3-4, only OpenAI/ChatGPT is implemented; others are mocked
   */
  async queryPlatform(
    prompt: string,
    platform: LLMPlatform,
    options: { mock?: boolean } = {}
  ): Promise<QueryResult> {
    const startTime = Date.now();
    console.log(`[PerceptionEvaluator] queryPlatform called for ${platform}, mock=${options.mock}`);

    // For non-OpenAI platforms, return mock response
    if (platform !== 'chatgpt' || options.mock) {
      console.log(`[PerceptionEvaluator] Returning mock response for ${platform}`);
      return this.getMockResponse(prompt, platform, startTime);
    }

    try {
      console.log(`[PerceptionEvaluator] Calling OpenAI API with gpt-4o...`);
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const responseTime = Date.now() - startTime;
      const content = response.choices[0].message.content || '';
      console.log(`[PerceptionEvaluator] OpenAI response received in ${responseTime}ms (${response.usage?.total_tokens} tokens)`);

      return {
        response: content,
        responseTime,
        tokensUsed: response.usage?.total_tokens,
        model: 'gpt-4o',
      };
    } catch (error) {
      console.error('[PerceptionEvaluator] OpenAI API error:', error);
      throw error;
    }
  }

  /**
   * Generate mock response for non-implemented platforms
   */
  private getMockResponse(
    prompt: string,
    platform: LLMPlatform,
    startTime: number
  ): QueryResult {
    const mockResponses: Record<LLMPlatform, string> = {
      claude: `[Mock Claude Response] Based on my analysis of your query "${prompt.substring(0, 50)}...", I would provide a thoughtful and balanced response. This is a placeholder for actual Claude API integration.`,
      chatgpt: `[Mock ChatGPT Response] Regarding "${prompt.substring(0, 50)}...", this is a simulated response for testing purposes.`,
      gemini: `[Mock Gemini Response] Let me help you with "${prompt.substring(0, 50)}...". This represents how Google's Gemini might respond.`,
      perplexity: `[Mock Perplexity Response] According to my search about "${prompt.substring(0, 50)}...", here are the key findings. This is a placeholder response.`,
      google_aio: `[Mock Google AI Overview] For the query "${prompt.substring(0, 50)}...", Google's AI Overview would display summarized information from search results.`,
    };

    // Simulate network latency
    const simulatedLatency = 500 + Math.random() * 1000;

    return {
      response: mockResponses[platform],
      responseTime: Date.now() - startTime + simulatedLatency,
      model: `${platform}-mock`,
    };
  }

  /**
   * Evaluate a response using LLM-as-a-Judge (comprehensive evaluation)
   */
  async evaluate(
    promptContext: PromptContext,
    response: string,
    groundTruth: Brand360GroundTruth
  ): Promise<AgentResult<EvaluationMetrics>> {
    const startTime = Date.now();

    try {
      // Build comprehensive evaluation prompt
      const evaluationPrompt = this.buildComprehensivePrompt(
        promptContext,
        response,
        groundTruth
      );

      // Call GPT-4o-mini for evaluation (cost-effective)
      const evalResponse = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert AI response evaluator. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: evaluationPrompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      });

      const evalContent = evalResponse.choices[0].message.content;
      if (!evalContent) {
        throw new Error('Empty evaluation response');
      }

      const evaluation = JSON.parse(evalContent);
      const metrics = this.parseEvaluationToMetrics(evaluation, promptContext);

      return {
        success: true,
        data: metrics,
        confidence: 0.85,
        source: 'perception_evaluator_agent',
        duration: Date.now() - startTime,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[PerceptionEvaluator] Evaluation error:', error);

      return {
        success: false,
        confidence: 0,
        source: 'perception_evaluator_agent',
        errors: [errorMessage],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Build comprehensive evaluation prompt
   */
  private buildComprehensivePrompt(
    promptContext: PromptContext,
    response: string,
    groundTruth: Brand360GroundTruth
  ): string {
    const formattedGroundTruth = formatGroundTruth(groundTruth);
    const formattedVoiceProfile = formatVoiceProfile(groundTruth.voiceProfile);
    const competitors = groundTruth.competitors.map((c) => c.name).join(', ');

    let prompt = EVALUATION_PROMPTS.COMPREHENSIVE;

    prompt = prompt.replace('{brandName}', groundTruth.brandName);
    prompt = prompt.replace('{competitors}', competitors || 'None specified');
    prompt = prompt.replace('{groundTruth}', formattedGroundTruth);
    prompt = prompt.replace('{voiceProfile}', formattedVoiceProfile);
    prompt = prompt.replace('{prompt}', promptContext.renderedPrompt);
    prompt = prompt.replace('{response}', response);
    prompt = prompt.replace(
      '{isHallucinationTrap}',
      promptContext.hallucinationTest ? 'YES' : 'NO'
    );

    return prompt;
  }

  /**
   * Parse evaluation response to EvaluationMetrics
   */
  private parseEvaluationToMetrics(
    evaluation: Record<string, unknown>,
    promptContext: PromptContext
  ): EvaluationMetrics {
    // Extract faithfulness
    const faithfulness = evaluation.faithfulness as Record<string, unknown> || {};
    const faithfulnessScore = (faithfulness.score as number) || 50;
    const faithfulnessErrors = (faithfulness.errors as string[]) || [];

    // Extract share of voice
    const sov = evaluation.shareOfVoice as Record<string, unknown> || {};
    const shareOfVoice = (sov.score as number) || 0;
    const brandMentioned = (sov.brandMentioned as boolean) || false;
    const brandPosition = (sov.brandPosition as number) || null;
    const competitorsMentioned = (sov.competitorsMentioned as string[]) || [];

    // Extract sentiment
    const sentiment = evaluation.sentiment as Record<string, unknown> || {};
    const overallSentiment = (sentiment.overall as number) || 0;
    const aspectSentiments = (sentiment.aspects as Record<string, number>) || {};

    // Extract voice alignment
    const voice = evaluation.voiceAlignment as Record<string, unknown> || {};
    const voiceAlignmentScore = (voice.score as number) || 50;
    const voiceDeviations = (voice.deviations as string[]) || [];

    // Extract hallucination
    const hallucination = evaluation.hallucination as Record<string, unknown> || {};
    const hallucinationScore = (hallucination.score as number) || 100;
    const hallucinations = (hallucination.detected as string[]) || [];

    // Extract additional insights
    const keyThemes = (evaluation.keyThemes as string[]) || [];
    const missingInformation = (evaluation.missingInformation as string[]) || [];
    const opportunities = (evaluation.opportunities as string[]) || [];

    // Build competitor positions map
    const competitorPositions: Record<string, number> = {};
    if (Array.isArray(competitorsMentioned)) {
      competitorsMentioned.forEach((comp, index) => {
        if (typeof comp === 'string') {
          competitorPositions[comp] = index + 1;
        } else if (typeof comp === 'object' && comp !== null) {
          const compObj = comp as Record<string, unknown>;
          if (compObj.name && compObj.position) {
            competitorPositions[compObj.name as string] = compObj.position as number;
          }
        }
      });
    }

    return {
      faithfulnessScore,
      faithfulnessErrors: faithfulnessErrors.map((e) =>
        typeof e === 'string' ? e : JSON.stringify(e)
      ),
      shareOfVoice,
      brandMentioned,
      brandPosition,
      competitorsMentioned: competitorsMentioned.map((c) =>
        typeof c === 'string' ? c : (c as Record<string, unknown>).name as string
      ),
      competitorPositions,
      overallSentiment,
      aspectSentiments,
      voiceAlignmentScore,
      voiceDeviations: voiceDeviations.map((d) =>
        typeof d === 'string' ? d : JSON.stringify(d)
      ),
      hallucinationScore,
      hallucinations: hallucinations.map((h) =>
        typeof h === 'string' ? h : JSON.stringify(h)
      ),
      keyThemes,
      missingInformation,
      opportunities,
    };
  }

  /**
   * Calculate overall score from individual metrics
   */
  calculateOverallScore(metrics: EvaluationMetrics): number {
    // Weighted average
    const weights = {
      faithfulness: 0.25,
      shareOfVoice: 0.25,
      sentiment: 0.15,
      voiceAlignment: 0.15,
      hallucination: 0.2,
    };

    // Normalize sentiment from -1..1 to 0..100
    const normalizedSentiment = ((metrics.overallSentiment + 1) / 2) * 100;

    const score =
      metrics.faithfulnessScore * weights.faithfulness +
      metrics.shareOfVoice * weights.shareOfVoice +
      normalizedSentiment * weights.sentiment +
      metrics.voiceAlignmentScore * weights.voiceAlignment +
      metrics.hallucinationScore * weights.hallucination;

    return Math.round(score);
  }

  /**
   * Execute full evaluation pipeline for a single prompt
   */
  async evaluatePrompt(
    promptId: string,
    promptContext: PromptContext,
    platform: LLMPlatform,
    groundTruth: Brand360GroundTruth,
    options: { mock?: boolean } = {}
  ): Promise<PerceptionEvaluatorResult> {
    // Step 1: Query the platform
    const queryResult = await this.queryPlatform(
      promptContext.renderedPrompt,
      platform,
      options
    );

    // Step 2: Evaluate the response
    const evaluationResult = await this.evaluate(
      promptContext,
      queryResult.response,
      groundTruth
    );

    if (!evaluationResult.success || !evaluationResult.data) {
      throw new Error(
        `Evaluation failed: ${evaluationResult.errors?.join(', ')}`
      );
    }

    return {
      promptId,
      platform,
      model: queryResult.model,
      response: queryResult.response,
      responseTime: queryResult.responseTime,
      tokensUsed: queryResult.tokensUsed,
      metrics: evaluationResult.data,
      rawEvaluation: {},
    };
  }
}
