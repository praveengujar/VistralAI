/**
 * VibeCheckAgent - Infer brand identity from website content
 *
 * Uses GPT-4o to analyze website content and extract:
 * 1. Kapferer Brand Identity Prism (6 dimensions)
 * 2. Jung Brand Archetypes (12 archetypes with scores)
 * 3. Brand Voice Profile
 */

import OpenAI from 'openai';
import {
  AgentResult,
  VibeCheckAgentResult,
  BrandIdentityPrismData,
  BrandArchetypeData,
  BrandVoiceData,
  PersonalityScores,
  ArchetypeType,
  ArchetypeScores,
  VoiceSpectrums,
} from './types';

const ARCHETYPES: ArchetypeType[] = [
  'innocent',
  'sage',
  'explorer',
  'outlaw',
  'magician',
  'hero',
  'lover',
  'jester',
  'everyman',
  'caregiver',
  'ruler',
  'creator',
];

export class VibeCheckAgent {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  /**
   * Analyze website content to infer brand identity
   */
  async analyze(
    websiteContent: string,
    brandName: string
  ): Promise<AgentResult<VibeCheckAgentResult>> {
    const startTime = Date.now();

    try {
      // Limit content to avoid token limits
      const truncatedContent = websiteContent.substring(0, 15000);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(brandName),
          },
          {
            role: 'user',
            content: truncatedContent,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      const analysis = JSON.parse(content);
      const duration = Date.now() - startTime;

      // Build result
      const brandIdentityPrism = this.buildPrismData(analysis);
      const brandArchetype = this.buildArchetypeData(analysis);
      const brandVoice = this.buildVoiceData(analysis);

      return {
        success: true,
        data: {
          brandIdentityPrism,
          brandArchetype,
          brandVoice,
          inferredTone: analysis.voice?.primaryTone || 'professional',
          inferredPersonality: analysis.kapfererPrism?.personalityScores || this.getDefaultPersonality(),
        },
        confidence: analysis.confidence || 0.7,
        source: 'vibe_check_agent',
        duration,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        confidence: 0,
        source: 'vibe_check_agent',
        errors: [errorMessage],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Generate voice embedding for similarity comparison
   */
  async generateVoiceEmbedding(voiceSamples: string[]): Promise<number[]> {
    try {
      const combinedText = voiceSamples.join('\n\n');

      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: combinedText,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Voice embedding error:', error);
      return [];
    }
  }

  /**
   * Get system prompt for brand analysis
   */
  private getSystemPrompt(brandName: string): string {
    return `You are a brand strategist expert. Analyze the following website content for "${brandName}" and extract brand identity information.

Return a JSON object with:

1. "kapfererPrism": {
   "physique": {"attributes": [strings], "description": string},
   "personalityScores": {"sincerity": 0-100, "excitement": 0-100, "competence": 0-100, "sophistication": 0-100, "ruggedness": 0-100},
   "cultureValues": [strings],
   "cultureDescription": string,
   "relationshipType": string (e.g., "Trusted Advisor", "Partner", "Friend"),
   "relationshipDescription": string,
   "reflection": {"demographics": string, "psychographics": string, "lifestyle": string},
   "selfImage": string
}

2. "archetype": {
   "primary": one of [innocent, sage, explorer, outlaw, magician, hero, lover, jester, everyman, caregiver, ruler, creator],
   "primaryScore": 0-100,
   "secondary": optional archetype,
   "secondaryScore": 0-100,
   "allScores": {archetype: score for all 12}
}

3. "voice": {
   "spectrums": {"formal_casual": 1-10, "serious_playful": 1-10, "respectful_irreverent": 1-10, "enthusiastic_matter_of_fact": 1-10},
   "primaryTone": string,
   "secondaryTones": [strings],
   "vocabularyLevel": "simple"|"moderate"|"technical"|"academic",
   "sentenceStyle": "short_punchy"|"moderate"|"complex_nuanced",
   "signaturePhrases": [strings found in content],
   "wordsToAvoid": [strings to avoid based on brand]
}

4. "confidence": 0-1 overall confidence in analysis

Be specific and base analysis on actual content, not assumptions. If you can't determine something, provide reasonable defaults.`;
  }

  /**
   * Build Brand Identity Prism data
   */
  private buildPrismData(analysis: Record<string, unknown>): Partial<BrandIdentityPrismData> {
    const prism = analysis.kapfererPrism as Record<string, unknown> | undefined;

    if (!prism) {
      return {
        physique: { attributes: [], description: '' },
        personalityScores: this.getDefaultPersonality(),
        personalityTraits: [],
        cultureValues: [],
        inferredByAgent: true,
        confidence: 0.5,
      };
    }

    const physique = prism.physique as { attributes?: string[]; description?: string } | undefined;
    const personalityScores = prism.personalityScores as PersonalityScores | undefined;
    const reflection = prism.reflection as { demographics?: string; psychographics?: string; lifestyle?: string } | undefined;

    return {
      physique: {
        attributes: physique?.attributes || [],
        description: physique?.description,
      },
      personalityScores: personalityScores || this.getDefaultPersonality(),
      personalityTraits: this.extractTraits(personalityScores),
      cultureValues: (prism.cultureValues as string[]) || [],
      cultureDescription: prism.cultureDescription as string,
      relationshipType: prism.relationshipType as string,
      relationshipDescription: prism.relationshipDescription as string,
      reflectionProfile: reflection || {},
      selfImage: prism.selfImage as string,
      inferredByAgent: true,
      confidence: (analysis.confidence as number) || 0.7,
    };
  }

  /**
   * Build Brand Archetype data
   */
  private buildArchetypeData(analysis: Record<string, unknown>): Partial<BrandArchetypeData> {
    const archetype = analysis.archetype as Record<string, unknown> | undefined;

    if (!archetype) {
      return {
        primaryArchetype: 'sage',
        primaryScore: 50,
        expectedTone: ['professional'],
        expectedDepth: 'moderate',
        expectedCitations: false,
        expectedHumor: 'none',
        archetypeScores: this.getDefaultArchetypeScores(),
      };
    }

    const primary = (archetype.primary as ArchetypeType) || 'sage';
    const allScores = archetype.allScores as ArchetypeScores | undefined;

    return {
      primaryArchetype: primary,
      primaryScore: (archetype.primaryScore as number) || 70,
      secondaryArchetype: archetype.secondary as ArchetypeType,
      secondaryScore: archetype.secondaryScore as number,
      archetypeScores: allScores || this.getDefaultArchetypeScores(),
      ...this.getArchetypePromptParams(primary),
    };
  }

  /**
   * Build Brand Voice data
   */
  private buildVoiceData(analysis: Record<string, unknown>): Partial<BrandVoiceData> {
    const voice = analysis.voice as Record<string, unknown> | undefined;

    if (!voice) {
      return {
        voiceSpectrums: this.getDefaultVoiceSpectrums(),
        primaryTone: 'professional',
        secondaryTones: [],
        vocabularyLevel: 'moderate',
        sentenceStyle: 'moderate',
        approvedPhrases: [],
        bannedPhrases: [],
        bannedTopics: [],
        voiceSamples: [],
      };
    }

    const spectrums = voice.spectrums as VoiceSpectrums | undefined;

    return {
      voiceSpectrums: spectrums || this.getDefaultVoiceSpectrums(),
      primaryTone: voice.primaryTone as string,
      secondaryTones: (voice.secondaryTones as string[]) || [],
      vocabularyLevel: (voice.vocabularyLevel as BrandVoiceData['vocabularyLevel']) || 'moderate',
      sentenceStyle: (voice.sentenceStyle as BrandVoiceData['sentenceStyle']) || 'moderate',
      approvedPhrases: (voice.signaturePhrases as string[]) || [],
      bannedPhrases: (voice.wordsToAvoid as string[]) || [],
      bannedTopics: [],
      voiceSamples: [],
    };
  }

  /**
   * Extract personality traits from scores
   */
  private extractTraits(scores?: PersonalityScores): string[] {
    if (!scores) return [];

    const traits: string[] = [];

    if (scores.sincerity > 70) traits.push('honest', 'genuine', 'cheerful');
    if (scores.excitement > 70) traits.push('daring', 'spirited', 'imaginative');
    if (scores.competence > 70) traits.push('reliable', 'intelligent', 'successful');
    if (scores.sophistication > 70) traits.push('upper-class', 'charming', 'elegant');
    if (scores.ruggedness > 70) traits.push('outdoorsy', 'tough', 'rugged');

    return traits;
  }

  /**
   * Get archetype-specific prompt parameters
   */
  private getArchetypePromptParams(
    archetype: ArchetypeType
  ): Pick<BrandArchetypeData, 'expectedTone' | 'expectedDepth' | 'expectedCitations' | 'expectedHumor'> {
    const archetypeParams: Record<
      ArchetypeType,
      Pick<BrandArchetypeData, 'expectedTone' | 'expectedDepth' | 'expectedCitations' | 'expectedHumor'>
    > = {
      innocent: {
        expectedTone: ['optimistic', 'simple', 'honest'],
        expectedDepth: 'surface',
        expectedCitations: false,
        expectedHumor: 'none',
      },
      sage: {
        expectedTone: ['analytical', 'educational', 'thoughtful'],
        expectedDepth: 'deep',
        expectedCitations: true,
        expectedHumor: 'none',
      },
      explorer: {
        expectedTone: ['adventurous', 'independent', 'ambitious'],
        expectedDepth: 'moderate',
        expectedCitations: false,
        expectedHumor: 'subtle',
      },
      outlaw: {
        expectedTone: ['rebellious', 'disruptive', 'bold'],
        expectedDepth: 'moderate',
        expectedCitations: false,
        expectedHumor: 'subtle',
      },
      magician: {
        expectedTone: ['visionary', 'transformative', 'charismatic'],
        expectedDepth: 'deep',
        expectedCitations: false,
        expectedHumor: 'subtle',
      },
      hero: {
        expectedTone: ['confident', 'inspiring', 'bold'],
        expectedDepth: 'moderate',
        expectedCitations: false,
        expectedHumor: 'none',
      },
      lover: {
        expectedTone: ['passionate', 'intimate', 'sensual'],
        expectedDepth: 'moderate',
        expectedCitations: false,
        expectedHumor: 'subtle',
      },
      jester: {
        expectedTone: ['witty', 'playful', 'irreverent'],
        expectedDepth: 'surface',
        expectedCitations: false,
        expectedHumor: 'prominent',
      },
      everyman: {
        expectedTone: ['friendly', 'humble', 'relatable'],
        expectedDepth: 'surface',
        expectedCitations: false,
        expectedHumor: 'subtle',
      },
      caregiver: {
        expectedTone: ['nurturing', 'supportive', 'empathetic'],
        expectedDepth: 'moderate',
        expectedCitations: false,
        expectedHumor: 'none',
      },
      ruler: {
        expectedTone: ['authoritative', 'commanding', 'premium'],
        expectedDepth: 'moderate',
        expectedCitations: true,
        expectedHumor: 'none',
      },
      creator: {
        expectedTone: ['innovative', 'visionary', 'artistic'],
        expectedDepth: 'deep',
        expectedCitations: false,
        expectedHumor: 'subtle',
      },
    };

    return archetypeParams[archetype] || archetypeParams.sage;
  }

  /**
   * Get default personality scores
   */
  private getDefaultPersonality(): PersonalityScores {
    return {
      sincerity: 50,
      excitement: 50,
      competence: 50,
      sophistication: 50,
      ruggedness: 50,
    };
  }

  /**
   * Get default archetype scores
   */
  private getDefaultArchetypeScores(): ArchetypeScores {
    return {
      innocent: 30,
      sage: 50,
      explorer: 40,
      outlaw: 20,
      magician: 35,
      hero: 45,
      lover: 25,
      jester: 20,
      everyman: 40,
      caregiver: 35,
      ruler: 30,
      creator: 45,
    };
  }

  /**
   * Get default voice spectrums
   */
  private getDefaultVoiceSpectrums(): VoiceSpectrums {
    return {
      formal_casual: 5,
      serious_playful: 5,
      respectful_irreverent: 3,
      enthusiastic_matter_of_fact: 5,
    };
  }
}
