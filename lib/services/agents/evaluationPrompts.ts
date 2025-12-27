/**
 * LLM-as-a-Judge Evaluation Prompts
 *
 * These prompts are used by the PerceptionEvaluatorAgent to score
 * AI responses on 5 key metrics:
 * 1. Faithfulness/Accuracy
 * 2. Share of Voice
 * 3. Sentiment
 * 4. Voice Alignment
 * 5. Hallucination Detection
 */

export const EVALUATION_PROMPTS = {
  /**
   * Evaluate factual accuracy against ground truth
   */
  FAITHFULNESS: `You are an expert fact-checker evaluating an AI response for accuracy.

GROUND TRUTH (verified facts about the brand):
{groundTruth}

AI RESPONSE TO EVALUATE:
---
{response}
---

PROMPT THAT GENERATED THIS RESPONSE:
{prompt}

Evaluate the response for factual accuracy. Return JSON:
{
  "score": 0-100,
  "errors": [
    {
      "claim": "what the AI said",
      "truth": "what is actually true",
      "severity": "minor|moderate|major"
    }
  ],
  "unsupportedClaims": ["claims made without ground truth support"],
  "correctClaims": ["accurate claims found"],
  "rationale": "brief explanation"
}

Be strict. Only mark claims as correct if they are explicitly supported by ground truth.
Claims that are reasonable inferences but not explicitly stated should be noted as unsupportedClaims.`,

  /**
   * Evaluate brand visibility and share of voice
   */
  SHARE_OF_VOICE: `Analyze this AI response for brand visibility and share of voice.

BRAND NAME: {brandName}
KNOWN COMPETITORS: {competitors}

AI RESPONSE:
---
{response}
---

Return JSON:
{
  "brandMentioned": true|false,
  "brandMentionCount": number,
  "brandPosition": number|null,
  "brandContext": "positive|neutral|negative|not_mentioned",
  "competitorsMentioned": [
    {
      "name": "competitor name",
      "position": number,
      "context": "positive|neutral|negative"
    }
  ],
  "shareOfVoice": 0-100,
  "isRecommended": true|false,
  "rationale": "brief explanation"
}

Position = order in which brand/competitor is mentioned (1 = first).
shareOfVoice = percentage of response devoted to brand vs competitors.
isRecommended = whether the brand is explicitly recommended.`,

  /**
   * Evaluate sentiment toward the brand
   */
  SENTIMENT: `Analyze the sentiment of this AI response about a brand.

BRAND NAME: {brandName}

AI RESPONSE:
---
{response}
---

Return JSON:
{
  "overallSentiment": -1 to 1,
  "sentimentLabel": "very_negative|negative|neutral|positive|very_positive",
  "aspectSentiments": {
    "products": -1 to 1,
    "pricing": -1 to 1,
    "quality": -1 to 1,
    "support": -1 to 1,
    "innovation": -1 to 1,
    "trust": -1 to 1
  },
  "positiveIndicators": ["words/phrases indicating positive sentiment"],
  "negativeIndicators": ["words/phrases indicating negative sentiment"],
  "neutralIndicators": ["balanced or factual statements"],
  "rationale": "brief explanation"
}

Scoring: -1 = very negative, 0 = neutral, 1 = very positive
Only include aspect sentiments if that aspect is mentioned in the response.`,

  /**
   * Evaluate alignment with brand voice profile
   */
  VOICE_ALIGNMENT: `Compare this AI response to the brand's expected voice and tone.

BRAND VOICE PROFILE:
- Primary Tone: {primaryTone}
- Vocabulary Level: {vocabularyLevel} (simple|moderate|technical|academic)
- Sentence Style: {sentenceStyle}
- Approved Phrases: {approvedPhrases}
- Banned Phrases: {bannedPhrases}
- Expected Tone Keywords: {expectedTone}

AI RESPONSE:
---
{response}
---

Return JSON:
{
  "alignmentScore": 0-100,
  "toneMatch": true|false,
  "detectedTone": "inferred tone of response",
  "vocabularyMatch": true|false,
  "detectedVocabularyLevel": "simple|moderate|technical|academic",
  "approvedPhrasesUsed": ["found approved phrases"],
  "bannedPhrasesUsed": ["found banned phrases - these are bad"],
  "deviations": [
    {
      "type": "tone|vocabulary|banned_phrase|style",
      "description": "what was wrong",
      "severity": "minor|moderate|major"
    }
  ],
  "rationale": "brief explanation"
}

Note: The response doesn't need to USE the brand's voice, but it should DESCRIBE the brand in a way consistent with the brand's identity.`,

  /**
   * Detect hallucinations (made-up information)
   */
  HALLUCINATION: `Detect hallucinations (made-up information) in this AI response.

KNOWN FACTS (ground truth):
{groundTruth}

PROMPT (what was asked):
{prompt}

IS THIS A HALLUCINATION TRAP? {isHallucinationTrap}
TRAP DETAILS: {trapDetails}

AI RESPONSE:
---
{response}
---

Return JSON:
{
  "hallucinationScore": 0-100,
  "hallucinations": [
    {
      "claim": "the made-up claim",
      "type": "invented_feature|wrong_fact|fabricated_statistic|nonexistent_product|fake_award|other",
      "severity": "minor|moderate|major|critical",
      "context": "how it appeared in response"
    }
  ],
  "passedTrapTest": true|false,
  "trapTestDetails": "explanation if trap test",
  "verifiableClaims": ["claims that could be verified"],
  "speculativeClaims": ["claims marked as opinions/possibilities - these are OK"],
  "rationale": "brief explanation"
}

hallucinationScore: 100 = no hallucinations, 0 = entirely made up

IMPORTANT:
- Hallucinations are ONLY claims presented as facts that contradict ground truth or are unverifiable
- Opinions, generalizations, and appropriately hedged statements are NOT hallucinations
- If the AI says "I don't have information about..." that's GOOD, not a hallucination
- For trap tests, check if AI correctly said the feature/award doesn't exist`,

  /**
   * Comprehensive evaluation combining all metrics
   */
  COMPREHENSIVE: `You are an expert AI response evaluator. Analyze this response comprehensively.

BRAND: {brandName}
COMPETITORS: {competitors}

GROUND TRUTH:
{groundTruth}

BRAND VOICE PROFILE:
{voiceProfile}

PROMPT:
{prompt}

RESPONSE TO EVALUATE:
---
{response}
---

IS HALLUCINATION TRAP: {isHallucinationTrap}

Return a comprehensive JSON evaluation:
{
  "faithfulness": {
    "score": 0-100,
    "errors": [],
    "rationale": ""
  },
  "shareOfVoice": {
    "score": 0-100,
    "brandMentioned": true|false,
    "brandPosition": number|null,
    "competitorsMentioned": [],
    "rationale": ""
  },
  "sentiment": {
    "overall": -1 to 1,
    "label": "very_negative|negative|neutral|positive|very_positive",
    "aspects": {},
    "rationale": ""
  },
  "voiceAlignment": {
    "score": 0-100,
    "deviations": [],
    "rationale": ""
  },
  "hallucination": {
    "score": 0-100,
    "detected": [],
    "passedTrapTest": true|false,
    "rationale": ""
  },
  "overallScore": 0-100,
  "keyThemes": [],
  "missingInformation": [],
  "opportunities": [],
  "summary": "2-3 sentence summary"
}

Overall score = weighted average:
- Faithfulness: 25%
- Share of Voice: 25%
- Sentiment: 15%
- Voice Alignment: 15%
- Hallucination: 20%`,
};

/**
 * Format ground truth for evaluation prompts
 */
export function formatGroundTruth(groundTruth: {
  brandName: string;
  products?: Array<{ name: string; features?: string[]; benefits?: string[] }>;
  claims?: Array<{ claimText: string }>;
  competitors?: Array<{ name: string }>;
  foundingYear?: string;
  founders?: string[];
  values?: string[];
}): string {
  const lines: string[] = [];

  lines.push(`Brand Name: ${groundTruth.brandName}`);

  if (groundTruth.foundingYear) {
    lines.push(`Founded: ${groundTruth.foundingYear}`);
  }

  if (groundTruth.founders && groundTruth.founders.length > 0) {
    lines.push(`Founders: ${groundTruth.founders.join(', ')}`);
  }

  if (groundTruth.values && groundTruth.values.length > 0) {
    lines.push(`Core Values: ${groundTruth.values.join(', ')}`);
  }

  if (groundTruth.products && groundTruth.products.length > 0) {
    lines.push('\nProducts:');
    for (const product of groundTruth.products) {
      lines.push(`- ${product.name}`);
      if (product.features && product.features.length > 0) {
        lines.push(`  Features: ${product.features.join(', ')}`);
      }
      if (product.benefits && product.benefits.length > 0) {
        lines.push(`  Benefits: ${product.benefits.join(', ')}`);
      }
    }
  }

  if (groundTruth.claims && groundTruth.claims.length > 0) {
    lines.push('\nVerified Claims:');
    for (const claim of groundTruth.claims) {
      lines.push(`- ${claim.claimText}`);
    }
  }

  if (groundTruth.competitors && groundTruth.competitors.length > 0) {
    lines.push(`\nKnown Competitors: ${groundTruth.competitors.map((c) => c.name).join(', ')}`);
  }

  return lines.join('\n');
}

/**
 * Format voice profile for evaluation prompts
 */
export function formatVoiceProfile(voiceProfile: {
  primaryTone?: string;
  vocabularyLevel?: string;
  approvedPhrases?: string[];
  bannedPhrases?: string[];
}): string {
  const lines: string[] = [];

  if (voiceProfile.primaryTone) {
    lines.push(`Primary Tone: ${voiceProfile.primaryTone}`);
  }

  if (voiceProfile.vocabularyLevel) {
    lines.push(`Vocabulary Level: ${voiceProfile.vocabularyLevel}`);
  }

  if (voiceProfile.approvedPhrases && voiceProfile.approvedPhrases.length > 0) {
    lines.push(`Approved Phrases: ${voiceProfile.approvedPhrases.join(', ')}`);
  }

  if (voiceProfile.bannedPhrases && voiceProfile.bannedPhrases.length > 0) {
    lines.push(`Banned Phrases: ${voiceProfile.bannedPhrases.join(', ')}`);
  }

  return lines.join('\n') || 'No specific voice profile defined';
}

/**
 * Build a complete evaluation prompt
 */
export function buildEvaluationPrompt(
  type: keyof typeof EVALUATION_PROMPTS,
  variables: Record<string, string>
): string {
  let prompt = EVALUATION_PROMPTS[type];

  for (const [key, value] of Object.entries(variables)) {
    prompt = prompt.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }

  return prompt;
}
