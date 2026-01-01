/**
 * Strategic Prompt Templates for AEO Testing
 *
 * Variables available for substitution:
 * - {brandName}: Brand/company name
 * - {productName}: Product name
 * - {productCategory}: Product category
 * - {competitorName}: Competitor name
 * - {painPoint}: Customer pain point
 * - {goal}: Customer goal
 * - {objection}: Customer objection
 * - {claim}: Brand claim
 * - {archetype}: Brand archetype
 * - {tone}: Expected tone
 * - {industry}: Industry vertical
 * - {useCase}: Specific use case
 * - {commonQuestion}: Common customer question
 * - {misconception}: Common misconception
 * - {nonExistentFeature}: Made-up feature for hallucination testing
 * - {reviewSite}: Review website name (e.g., G2, Trustpilot)
 * - {negativeKeyword}: Negative association keyword
 * - {feature}: Product feature
 * - {benefit}: Product benefit
 * - {personaDescription}: Target persona description
 * - {primaryArchetype}: Primary brand archetype
 * - {secondaryArchetype}: Secondary brand archetype
 */

import { PromptCategory, PromptTemplate, PromptTemplateCategory } from './types';

// ============================================
// NAVIGATIONAL - "The Who"
// Brand awareness and recognition queries
// ============================================

export const NAVIGATIONAL_TEMPLATES: PromptTemplateCategory = {
  categoryLabel: 'The Who',
  templates: [
    {
      id: 'nav_1',
      template: 'What is {brandName} and what do they do?',
      intent: 'informational',
      expectedThemes: ['company_overview', 'products', 'mission'],
      expectedCitations: true,
      priority: 10,
    },
    {
      id: 'nav_2',
      template: 'Tell me about {brandName} products',
      intent: 'informational',
      expectedThemes: ['products', 'features', 'benefits'],
      expectedCitations: true,
      priority: 9,
    },
    {
      id: 'nav_3',
      template: 'Is {brandName} a legitimate company?',
      intent: 'navigational',
      expectedThemes: ['trust', 'credibility', 'history'],
      expectedCitations: true,
      priority: 8,
    },
    {
      id: 'nav_4',
      template: 'What is {brandName} known for?',
      intent: 'informational',
      expectedThemes: ['reputation', 'differentiators', 'awards'],
      expectedCitations: true,
      priority: 8,
    },
    {
      id: 'nav_5',
      template: 'Who founded {brandName} and when?',
      intent: 'informational',
      expectedThemes: ['founders', 'history', 'origin_story'],
      expectedCitations: true,
      priority: 6,
    },
    {
      id: 'nav_6',
      template: 'Where is {brandName} headquartered?',
      intent: 'informational',
      expectedThemes: ['location', 'company_info'],
      expectedCitations: true,
      priority: 5,
    },
    {
      id: 'nav_product_1',
      template: 'What is {productName} by {brandName}?',
      intent: 'informational',
      expectedThemes: ['product_description', 'features', 'use_cases'],
      expectedCitations: true,
      priority: 9,
    },
    {
      id: 'nav_product_2',
      template: 'How does {productName} work?',
      intent: 'informational',
      expectedThemes: ['functionality', 'features', 'workflow'],
      expectedCitations: false,
      priority: 8,
    },
    // Credibility/proof-based
    {
      id: 'nav_proof_1',
      template: 'Has {brandName} won any awards?',
      intent: 'informational',
      expectedThemes: ['awards', 'recognition', 'credibility'],
      expectedCitations: true,
      priority: 7,
    },
    {
      id: 'nav_proof_2',
      template: 'What do customers say about {brandName}?',
      intent: 'informational',
      expectedThemes: ['testimonials', 'reviews', 'customer_satisfaction'],
      expectedCitations: true,
      priority: 7,
    },
    {
      id: 'nav_stats_1',
      template: 'How many customers does {brandName} have?',
      intent: 'informational',
      expectedThemes: ['customer_base', 'scale', 'market_presence'],
      expectedCitations: true,
      priority: 6,
    },
    {
      id: 'nav_industry_1',
      template: 'Is {brandName} a leader in {industry}?',
      intent: 'informational',
      expectedThemes: ['market_leadership', 'industry_position', 'reputation'],
      expectedCitations: true,
      priority: 7,
    },
    // Review website templates
    {
      id: 'nav_review_1',
      template: 'What do customers say about {brandName} on {reviewSite}?',
      intent: 'informational',
      expectedThemes: ['customer_reviews', 'ratings', 'testimonials'],
      expectedCitations: true,
      priority: 8,
    },
    {
      id: 'nav_review_2',
      template: "What is {brandName}'s rating on {reviewSite}?",
      intent: 'informational',
      expectedThemes: ['ratings', 'score', 'ranking'],
      expectedCitations: true,
      priority: 8,
    },
    {
      id: 'nav_review_3',
      template: 'How many reviews does {brandName} have on {reviewSite}?',
      intent: 'informational',
      expectedThemes: ['review_count', 'popularity', 'market_presence'],
      expectedCitations: true,
      priority: 6,
    },
  ],
};

// ============================================
// FUNCTIONAL - "The How"
// Problem-solving and goal-achievement queries
// ============================================

export const FUNCTIONAL_TEMPLATES: PromptTemplateCategory = {
  categoryLabel: 'The How',
  templates: [
    // Pain point resolution
    {
      id: 'func_pain_1',
      template: 'What is the best solution for {painPoint}?',
      intent: 'commercial',
      expectedThemes: ['solutions', 'features', 'benefits'],
      expectedCitations: false,
      priority: 10,
    },
    {
      id: 'func_pain_2',
      template: 'How can I solve {painPoint} for my business?',
      intent: 'commercial',
      expectedThemes: ['solutions', 'implementation', 'roi'],
      expectedCitations: false,
      priority: 9,
    },
    {
      id: 'func_pain_3',
      template: 'What tools help with {painPoint}?',
      intent: 'commercial',
      expectedThemes: ['tools', 'solutions', 'comparison'],
      expectedCitations: false,
      priority: 8,
    },
    // Goal achievement
    {
      id: 'func_goal_1',
      template: 'What tools can help me {goal}?',
      intent: 'commercial',
      expectedThemes: ['tools', 'features', 'comparison'],
      expectedCitations: false,
      priority: 9,
    },
    {
      id: 'func_goal_2',
      template: 'Best {productCategory} for {goal}',
      intent: 'commercial',
      expectedThemes: ['recommendations', 'features', 'pricing'],
      expectedCitations: false,
      priority: 10,
    },
    {
      id: 'func_goal_3',
      template: 'How do I {goal} effectively?',
      intent: 'informational',
      expectedThemes: ['strategies', 'tools', 'best_practices'],
      expectedCitations: false,
      priority: 8,
    },
    // Question-based
    {
      id: 'func_question_1',
      template: '{commonQuestion}',
      intent: 'informational',
      expectedThemes: ['answer', 'explanation', 'resources'],
      expectedCitations: true,
      priority: 8,
    },
    // Use case specific
    {
      id: 'func_usecase_1',
      template: 'What is the best {productCategory} for {useCase}?',
      intent: 'commercial',
      expectedThemes: ['recommendations', 'use_case_fit', 'features'],
      expectedCitations: false,
      priority: 9,
    },
    {
      id: 'func_usecase_2',
      template: 'Which {productCategory} is best for small businesses?',
      intent: 'commercial',
      expectedThemes: ['recommendations', 'pricing', 'scalability'],
      expectedCitations: false,
      priority: 8,
    },
    {
      id: 'func_usecase_3',
      template: 'Enterprise {productCategory} recommendations',
      intent: 'commercial',
      expectedThemes: ['enterprise_features', 'security', 'scalability'],
      expectedCitations: false,
      priority: 7,
    },
    // Feature-specific
    {
      id: 'func_feature_1',
      template: "How does {productName}'s {feature} work?",
      intent: 'informational',
      expectedThemes: ['feature_details', 'functionality', 'implementation'],
      expectedCitations: false,
      priority: 8,
    },
    {
      id: 'func_feature_2',
      template: 'What are the benefits of {feature} in {productName}?',
      intent: 'commercial',
      expectedThemes: ['feature_benefits', 'value_proposition', 'use_cases'],
      expectedCitations: false,
      priority: 8,
    },
    // Benefit-focused
    {
      id: 'func_benefit_1',
      template: 'How can {brandName} help me {benefit}?',
      intent: 'commercial',
      expectedThemes: ['solution', 'outcomes', 'value'],
      expectedCitations: false,
      priority: 9,
    },
    {
      id: 'func_benefit_2',
      template: 'What results can I expect from {productName}?',
      intent: 'commercial',
      expectedThemes: ['outcomes', 'roi', 'success_stories'],
      expectedCitations: true,
      priority: 8,
    },
    // Decision journey
    {
      id: 'func_journey_1',
      template: 'Is {brandName} right for {personaDescription}?',
      intent: 'commercial',
      expectedThemes: ['fit_assessment', 'target_audience', 'use_cases'],
      expectedCitations: false,
      priority: 8,
    },
    {
      id: 'func_journey_2',
      template: 'What should I consider before buying {productName}?',
      intent: 'commercial',
      expectedThemes: ['buying_criteria', 'considerations', 'evaluation'],
      expectedCitations: false,
      priority: 7,
    },
    // Review website functional templates
    {
      id: 'func_review_1',
      template: 'Does {reviewSite} recommend {brandName} for {useCase}?',
      intent: 'commercial',
      expectedThemes: ['recommendation', 'use_case_fit', 'review_opinion'],
      expectedCitations: true,
      priority: 8,
    },
    {
      id: 'func_review_2',
      template: 'What do {reviewSite} reviewers say about {brandName} for small businesses?',
      intent: 'commercial',
      expectedThemes: ['segment_fit', 'reviews', 'recommendations'],
      expectedCitations: true,
      priority: 7,
    },
  ],
};

// ============================================
// COMPARATIVE - "The Which"
// vs. competitor and alternative-seeking queries
// ============================================

export const COMPARATIVE_TEMPLATES: PromptTemplateCategory = {
  categoryLabel: 'The Which',
  templates: [
    // Direct comparison
    {
      id: 'comp_1',
      template: '{brandName} vs {competitorName}',
      intent: 'commercial',
      expectedThemes: ['comparison', 'differentiators', 'pricing'],
      expectedCitations: true,
      priority: 10,
    },
    {
      id: 'comp_2',
      template: 'What is better, {brandName} or {competitorName}?',
      intent: 'commercial',
      expectedThemes: ['comparison', 'pros_cons', 'recommendations'],
      expectedCitations: true,
      priority: 10,
    },
    {
      id: 'comp_3',
      template: '{brandName} vs {competitorName} for {useCase}',
      intent: 'commercial',
      expectedThemes: ['comparison', 'use_case_fit', 'recommendation'],
      expectedCitations: true,
      priority: 9,
    },
    {
      id: 'comp_4',
      template: 'Compare {brandName} and {competitorName} pricing',
      intent: 'commercial',
      expectedThemes: ['pricing', 'value', 'tiers'],
      expectedCitations: true,
      priority: 8,
    },
    // Alternative seeking
    {
      id: 'comp_alt_1',
      template: 'Best alternatives to {competitorName}',
      intent: 'commercial',
      expectedThemes: ['alternatives', 'comparison', 'recommendations'],
      expectedCitations: false,
      priority: 9,
    },
    {
      id: 'comp_alt_2',
      template: 'What are the top {productCategory} solutions?',
      intent: 'commercial',
      expectedThemes: ['ranking', 'comparison', 'features'],
      expectedCitations: false,
      priority: 8,
    },
    {
      id: 'comp_alt_3',
      template: '{competitorName} competitors',
      intent: 'commercial',
      expectedThemes: ['alternatives', 'comparison', 'market'],
      expectedCitations: false,
      priority: 8,
    },
    // Claim-based
    {
      id: 'comp_claim_1',
      template: 'Which {productCategory} has the best {claim}?',
      intent: 'commercial',
      expectedThemes: ['claim_verification', 'comparison', 'evidence'],
      expectedCitations: true,
      priority: 8,
    },
    {
      id: 'comp_claim_2',
      template: 'Does {brandName} have better {claim} than {competitorName}?',
      intent: 'commercial',
      expectedThemes: ['comparison', 'claim_verification', 'evidence'],
      expectedCitations: true,
      priority: 9,
    },
    // Review website comparison templates
    {
      id: 'comp_review_1',
      template: 'How does {brandName} compare to {competitorName} on {reviewSite}?',
      intent: 'commercial',
      expectedThemes: ['review_comparison', 'ratings_comparison', 'features'],
      expectedCitations: true,
      priority: 9,
    },
    {
      id: 'comp_review_2',
      template: 'Which has better reviews on {reviewSite}, {brandName} or {competitorName}?',
      intent: 'commercial',
      expectedThemes: ['review_comparison', 'ratings', 'winner'],
      expectedCitations: true,
      priority: 8,
    },
  ],
};

// ============================================
// VOICE - "The Vibe"
// Brand personality and tone queries
// ============================================

export const VOICE_TEMPLATES: PromptTemplateCategory = {
  categoryLabel: 'The Vibe',
  templates: [
    // Personality probes
    {
      id: 'voice_1',
      template: 'Describe {brandName} in a few words',
      intent: 'informational',
      expectedThemes: ['brand_personality', 'positioning', 'values'],
      expectedCitations: false,
      priority: 7,
    },
    {
      id: 'voice_2',
      template: 'What kind of company is {brandName}?',
      intent: 'informational',
      expectedThemes: ['culture', 'values', 'positioning'],
      expectedCitations: true,
      priority: 7,
    },
    {
      id: 'voice_3',
      template: 'Is {brandName} innovative or traditional?',
      intent: 'informational',
      expectedThemes: ['innovation', 'positioning', 'culture'],
      expectedCitations: false,
      priority: 6,
    },
    {
      id: 'voice_4',
      template: 'What are {brandName}\'s core values?',
      intent: 'informational',
      expectedThemes: ['values', 'mission', 'culture'],
      expectedCitations: true,
      priority: 7,
    },
    // Archetype alignment
    {
      id: 'voice_arch_1',
      template: 'Would you say {brandName} is a {archetype} brand?',
      intent: 'informational',
      expectedThemes: ['archetype_alignment', 'personality', 'values'],
      expectedCitations: false,
      priority: 6,
    },
    {
      id: 'voice_arch_2',
      template: 'What type of brand personality does {brandName} have?',
      intent: 'informational',
      expectedThemes: ['personality', 'archetype', 'tone'],
      expectedCitations: false,
      priority: 6,
    },
    // Tone probes
    {
      id: 'voice_tone_1',
      template: "How would you describe {brandName}'s communication style?",
      intent: 'informational',
      expectedThemes: ['voice', 'tone', 'communication_style'],
      expectedCitations: false,
      priority: 6,
    },
    // Vocabulary probes
    {
      id: 'voice_vocab_1',
      template: 'Does {brandName} communicate in technical or simple terms?',
      intent: 'informational',
      expectedThemes: ['vocabulary', 'accessibility', 'communication_style'],
      expectedCitations: false,
      priority: 6,
    },
    {
      id: 'voice_vocab_2',
      template: "Is {brandName}'s content easy to understand?",
      intent: 'informational',
      expectedThemes: ['readability', 'accessibility', 'clarity'],
      expectedCitations: false,
      priority: 6,
    },
    // Secondary archetype
    {
      id: 'voice_arch_3',
      template: 'Is {brandName} more {primaryArchetype} or {secondaryArchetype}?',
      intent: 'informational',
      expectedThemes: ['archetype_comparison', 'personality', 'positioning'],
      expectedCitations: false,
      priority: 5,
    },
    // Spectrum probes
    {
      id: 'voice_spectrum_1',
      template: 'Is {brandName} formal or casual in tone?',
      intent: 'informational',
      expectedThemes: ['formality', 'tone', 'brand_voice'],
      expectedCitations: false,
      priority: 6,
    },
  ],
};

// ============================================
// ADVERSARIAL - "The Risk"
// Challenging and negative scenario queries
// ============================================

export const ADVERSARIAL_TEMPLATES: PromptTemplateCategory = {
  categoryLabel: 'The Risk',
  templates: [
    // Negative sentiment probes
    {
      id: 'adv_neg_1',
      template: 'What are the problems with {brandName}?',
      intent: 'informational',
      expectedThemes: ['challenges', 'criticism', 'limitations'],
      expectedCitations: true,
      adversarialTwist: 'negativity_probe',
      hallucinationTest: true,
      priority: 8,
    },
    {
      id: 'adv_neg_2',
      template: 'Why is {brandName} bad?',
      intent: 'informational',
      expectedThemes: ['criticism', 'alternatives'],
      expectedCitations: true,
      adversarialTwist: 'extreme_negativity',
      hallucinationTest: true,
      priority: 9,
    },
    {
      id: 'adv_neg_3',
      template: '{brandName} complaints and issues',
      intent: 'informational',
      expectedThemes: ['complaints', 'issues', 'support'],
      expectedCitations: true,
      adversarialTwist: 'complaint_search',
      hallucinationTest: true,
      priority: 7,
    },
    // Objection handling
    {
      id: 'adv_obj_1',
      template: 'Is {brandName} too expensive?',
      intent: 'commercial',
      expectedThemes: ['pricing', 'value', 'alternatives'],
      expectedCitations: true,
      adversarialTwist: 'price_objection',
      hallucinationTest: false,
      priority: 8,
    },
    {
      id: 'adv_obj_2',
      template: '{objection} - is this true about {brandName}?',
      intent: 'informational',
      expectedThemes: ['objection_handling', 'facts', 'clarification'],
      expectedCitations: true,
      adversarialTwist: 'objection_probe',
      hallucinationTest: true,
      priority: 9,
    },
    {
      id: 'adv_obj_3',
      template: 'Is {brandName} worth the price?',
      intent: 'commercial',
      expectedThemes: ['value', 'roi', 'comparison'],
      expectedCitations: false,
      adversarialTwist: 'value_question',
      hallucinationTest: false,
      priority: 7,
    },
    // Misconception probes
    {
      id: 'adv_misc_1',
      template: 'I heard {misconception} about {brandName}, is that true?',
      intent: 'informational',
      expectedThemes: ['fact_check', 'clarification', 'truth'],
      expectedCitations: true,
      adversarialTwist: 'misconception_test',
      hallucinationTest: true,
      priority: 10,
    },
    // Competitor attack probes
    {
      id: 'adv_attack_1',
      template: 'Why should I choose {competitorName} over {brandName}?',
      intent: 'commercial',
      expectedThemes: ['comparison', 'competitor_strengths', 'brand_weaknesses'],
      expectedCitations: true,
      adversarialTwist: 'competitor_advocacy',
      hallucinationTest: false,
      priority: 8,
    },
    {
      id: 'adv_attack_2',
      template: 'What does {competitorName} do better than {brandName}?',
      intent: 'commercial',
      expectedThemes: ['comparison', 'competitor_advantages'],
      expectedCitations: true,
      adversarialTwist: 'competitor_strengths',
      hallucinationTest: false,
      priority: 8,
    },
    // Hallucination traps
    {
      id: 'adv_hall_1',
      template: 'Does {brandName} offer {nonExistentFeature}?',
      intent: 'informational',
      expectedThemes: ['feature_verification', 'product_info'],
      expectedCitations: true,
      adversarialTwist: 'hallucination_trap',
      hallucinationTest: true,
      priority: 10,
    },
    {
      id: 'adv_hall_2',
      template: 'Tell me about {brandName}\'s {nonExistentFeature} feature',
      intent: 'informational',
      expectedThemes: ['feature_info', 'product_details'],
      expectedCitations: true,
      adversarialTwist: 'hallucination_trap_direct',
      hallucinationTest: true,
      priority: 10,
    },
    {
      id: 'adv_hall_3',
      template: 'When did {brandName} win the {nonExistentFeature} award?',
      intent: 'informational',
      expectedThemes: ['awards', 'recognition'],
      expectedCitations: true,
      adversarialTwist: 'fake_award_trap',
      hallucinationTest: true,
      priority: 9,
    },
    // Negative keyword probes
    {
      id: 'adv_neg_keyword',
      template: 'Is {brandName} associated with {negativeKeyword}?',
      intent: 'informational',
      expectedThemes: ['brand_perception', 'reputation', 'associations'],
      expectedCitations: true,
      adversarialTwist: 'negative_association',
      hallucinationTest: true,
      priority: 9,
    },
    {
      id: 'adv_neg_keyword_2',
      template: "I've heard {brandName} is {negativeKeyword}, true?",
      intent: 'informational',
      expectedThemes: ['brand_perception', 'fact_check', 'clarification'],
      expectedCitations: true,
      adversarialTwist: 'negative_hearsay',
      hallucinationTest: true,
      priority: 9,
    },
    // Extended misconception handling
    {
      id: 'adv_misc_2',
      template: 'Does {brandName} really {misconception}?',
      intent: 'informational',
      expectedThemes: ['fact_check', 'clarification', 'misconception'],
      expectedCitations: true,
      adversarialTwist: 'misconception_direct',
      hallucinationTest: true,
      priority: 9,
    },
    {
      id: 'adv_misc_3',
      template: 'People say {misconception} about {brandName}, is that fair?',
      intent: 'informational',
      expectedThemes: ['perception', 'fairness', 'clarification'],
      expectedCitations: true,
      adversarialTwist: 'misconception_fairness',
      hallucinationTest: true,
      priority: 8,
    },
    // Trust probes
    {
      id: 'adv_trust_1',
      template: 'Can I trust {brandName} with my data?',
      intent: 'informational',
      expectedThemes: ['data_security', 'privacy', 'trust'],
      expectedCitations: true,
      adversarialTwist: 'trust_data',
      hallucinationTest: false,
      priority: 8,
    },
    {
      id: 'adv_trust_2',
      template: 'Has {brandName} had any security incidents?',
      intent: 'informational',
      expectedThemes: ['security_history', 'incidents', 'reliability'],
      expectedCitations: true,
      adversarialTwist: 'security_history',
      hallucinationTest: true,
      priority: 8,
    },
  ],
};

// ============================================
// All Templates Combined
// ============================================

export const PROMPT_TEMPLATES: Record<PromptCategory, PromptTemplateCategory> = {
  navigational: NAVIGATIONAL_TEMPLATES,
  functional: FUNCTIONAL_TEMPLATES,
  comparative: COMPARATIVE_TEMPLATES,
  voice: VOICE_TEMPLATES,
  adversarial: ADVERSARIAL_TEMPLATES,
};

// Category labels for UI display
export const CATEGORY_LABELS: Record<PromptCategory, string> = {
  navigational: 'The Who',
  functional: 'The How',
  comparative: 'The Which',
  voice: 'The Vibe',
  adversarial: 'The Risk',
};

// Priority multipliers based on persona type
export const PERSONA_PRIORITY_MULTIPLIERS: Record<string, number> = {
  primary: 1.5,
  secondary: 1.0,
  tertiary: 0.7,
  anti: 0.5,
};

// Priority multipliers based on competitor threat level
export const COMPETITOR_PRIORITY_MULTIPLIERS: Record<string, number> = {
  critical: 1.5,
  high: 1.3,
  medium: 1.0,
  low: 0.7,
};

// Default non-existent features for hallucination testing
export const HALLUCINATION_TRAP_FEATURES = [
  'quantum computing integration',
  'blockchain-based authentication',
  'neural network auto-optimization',
  'real-time telepathy sync',
  'holographic dashboard',
  'time-travel data recovery',
  'mind-reading analytics',
  'perpetual motion engine',
];

// Default fake awards for hallucination testing
export const HALLUCINATION_TRAP_AWARDS = [
  'Global Excellence in Innovation Award 2024',
  'International Digital Transformation Prize',
  'World Technology Leadership Medal',
  'Universal Best-in-Class Recognition',
];

// Review website templates collected from all categories
// These templates use {reviewSite} variable for industry-specific review platforms
export const REVIEW_WEBSITE_TEMPLATES: PromptTemplate[] = [
  // From navigational templates
  ...NAVIGATIONAL_TEMPLATES.templates.filter((t) => t.id.includes('review')),
  // From functional templates
  ...FUNCTIONAL_TEMPLATES.templates.filter((t) => t.id.includes('review')),
  // From comparative templates
  ...COMPARATIVE_TEMPLATES.templates.filter((t) => t.id.includes('review')),
];

/**
 * Get all template IDs for a category
 */
export function getTemplateIds(category: PromptCategory): string[] {
  return PROMPT_TEMPLATES[category].templates.map((t) => t.id);
}

/**
 * Get template by ID
 */
export function getTemplateById(
  category: PromptCategory,
  templateId: string
): PromptTemplate | undefined {
  return PROMPT_TEMPLATES[category].templates.find((t) => t.id === templateId);
}

/**
 * Get all templates sorted by priority
 */
export function getTemplatesByPriority(category: PromptCategory): PromptTemplate[] {
  return [...PROMPT_TEMPLATES[category].templates].sort((a, b) => b.priority - a.priority);
}

/**
 * Count total templates across all categories
 */
export function getTotalTemplateCount(): number {
  return Object.values(PROMPT_TEMPLATES).reduce(
    (total, cat) => total + cat.templates.length,
    0
  );
}
