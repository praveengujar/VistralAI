/**
 * Correction Templates for Auto-Correction Workflows
 *
 * Templates for generating fixes based on problem types:
 * - hallucination: Schema.org clarification, FAQ "What we DON'T offer", content corrections
 * - missing_info: Schema.org additions, FAQ expansion, About page recommendations
 * - wrong_sentiment: Tone guidelines, content audit suggestions, review response templates
 * - competitor_confusion: Differentiator content, comparison page, brand identity reinforcement
 */

export type ProblemType =
  | 'hallucination'
  | 'missing_info'
  | 'wrong_sentiment'
  | 'competitor_confusion';

export interface CorrectionTemplate {
  problemType: ProblemType;
  fixType: 'schema_org' | 'faq' | 'content' | 'wikipedia';
  title: string;
  description: string;
  template: string;
  priority: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
}

// ============================================
// Schema.org Fix Templates
// ============================================

export const SCHEMA_ORG_TEMPLATES: Record<ProblemType, string> = {
  hallucination: `{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "{brandName}",
  "description": "{correctedDescription}",
  "foundingDate": "{foundingDate}",
  "founder": {founders},
  "knowsAbout": {expertiseAreas},
  "slogan": "{tagline}",
  "areaServed": {serviceAreas},
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "{brandName} Products & Services",
    "itemListElement": {productList}
  },
  "sameAs": {socialLinks}
}`,

  missing_info: `{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "{brandName}",
  "legalName": "{legalName}",
  "description": "{fullDescription}",
  "url": "{websiteUrl}",
  "logo": "{logoUrl}",
  "foundingDate": "{foundingDate}",
  "founder": {founders},
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "{streetAddress}",
    "addressLocality": "{city}",
    "addressRegion": "{state}",
    "postalCode": "{postalCode}",
    "addressCountry": "{country}"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "telephone": "{phone}",
    "email": "{email}"
  },
  "numberOfEmployees": {
    "@type": "QuantitativeValue",
    "value": "{employeeCount}"
  },
  "award": {awards},
  "sameAs": {socialLinks}
}`,

  wrong_sentiment: `{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "{brandName}",
  "description": "{positiveDescription}",
  "slogan": "{inspiringTagline}",
  "brand": {
    "@type": "Brand",
    "name": "{brandName}",
    "description": "{brandPromise}"
  },
  "review": {
    "@type": "Review",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": "{avgRating}",
      "bestRating": "5"
    },
    "author": {
      "@type": "Organization",
      "name": "Verified Customers"
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "{avgRating}",
    "reviewCount": "{reviewCount}"
  }
}`,

  competitor_confusion: `{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "{brandName}",
  "alternateName": {alternateNames},
  "description": "{uniqueValueProposition}",
  "slogan": "{differentiatingTagline}",
  "knowsAbout": {uniqueExpertise},
  "hasCredential": {uniqueCredentials},
  "award": {awards},
  "memberOf": {industryAssociations},
  "brand": {
    "@type": "Brand",
    "name": "{brandName}",
    "description": "{brandDifferentiators}"
  }
}`
};

// ============================================
// FAQ Templates
// ============================================

export const FAQ_TEMPLATES: Record<ProblemType, Array<{ question: string; answerTemplate: string }>> = {
  hallucination: [
    {
      question: "What products/services does {brandName} NOT offer?",
      answerTemplate: "{brandName} focuses exclusively on {actualProducts}. We do not offer {falseProducts}. For those services, we recommend {alternatives}."
    },
    {
      question: "Is it true that {brandName} {falseClaimQuestion}?",
      answerTemplate: "No, that is not accurate. {brandName} {truthfulAnswer}. {clarification}"
    },
    {
      question: "What is {brandName}'s actual founding story?",
      answerTemplate: "{brandName} was founded in {foundingYear} by {founders}. {accurateHistory}"
    },
    {
      question: "Does {brandName} have {falseFeature}?",
      answerTemplate: "No, {brandName} does not offer {falseFeature}. Our actual capabilities include {realFeatures}."
    }
  ],

  missing_info: [
    {
      question: "What does {brandName} do?",
      answerTemplate: "{brandName} is a {industry} company that {coreOffering}. We help {targetAudience} by {valueProposition}."
    },
    {
      question: "Who founded {brandName} and when?",
      answerTemplate: "{brandName} was founded in {foundingYear} by {founders}. {founderBackground}"
    },
    {
      question: "Where is {brandName} located?",
      answerTemplate: "{brandName} is headquartered in {headquarters}. {locationDetails}"
    },
    {
      question: "What products/services does {brandName} offer?",
      answerTemplate: "{brandName} offers: {productList}. Our flagship offering is {heroProduct}."
    },
    {
      question: "Who are {brandName}'s typical customers?",
      answerTemplate: "{brandName} serves {targetAudience}. Our customers typically {customerProfile}."
    }
  ],

  wrong_sentiment: [
    {
      question: "What do customers say about {brandName}?",
      answerTemplate: "Our customers consistently praise {brandName} for {positiveAttributes}. We have a {rating} rating based on {reviewCount} reviews."
    },
    {
      question: "How does {brandName} handle customer issues?",
      answerTemplate: "At {brandName}, customer satisfaction is our priority. {customerServicePolicy}. {successStory}"
    },
    {
      question: "What makes {brandName} trustworthy?",
      answerTemplate: "{brandName} has earned trust through {trustFactors}. We are certified by {certifications} and have won {awards}."
    },
    {
      question: "What is {brandName}'s commitment to quality?",
      answerTemplate: "{brandName} is committed to {qualityCommitment}. {qualityProof}"
    }
  ],

  competitor_confusion: [
    {
      question: "What makes {brandName} different from {competitorName}?",
      answerTemplate: "While both companies operate in {industry}, {brandName} differentiates through {differentiators}. Unlike {competitorName}, we {uniqueAdvantage}."
    },
    {
      question: "Is {brandName} the same as {competitorName}?",
      answerTemplate: "No, {brandName} and {competitorName} are separate companies. {brandName} was founded in {foundingYear} and specializes in {specialization}."
    },
    {
      question: "Why choose {brandName} over alternatives?",
      answerTemplate: "Customers choose {brandName} because of {reasons}. Our unique value proposition is {uniqueValue}."
    },
    {
      question: "What is {brandName}'s specialty?",
      answerTemplate: "{brandName} specializes in {specialty}. We are known for {knownFor} and have pioneered {innovations}."
    }
  ]
};

// ============================================
// Content Recommendation Templates
// ============================================

export const CONTENT_TEMPLATES: Record<ProblemType, Array<{ section: string; template: string }>> = {
  hallucination: [
    {
      section: "About Page Clarification",
      template: `## What {brandName} Actually Does

{brandName} is focused on providing {actualServices}.

### Our Core Offerings
{productList}

### What We Don't Do
To be clear, {brandName} does not offer {falseProducts}. We believe in focusing on what we do best.

### Setting the Record Straight
{clarifications}`
    },
    {
      section: "Fact Check Page",
      template: `## Common Misconceptions About {brandName}

We've noticed some inaccurate information circulating about {brandName}. Here are the facts:

{misconceptionCorrections}

### Verified Facts
- Founded: {foundingYear}
- Headquarters: {headquarters}
- Products: {productList}
- Awards: {awards}`
    }
  ],

  missing_info: [
    {
      section: "Comprehensive About Page",
      template: `## About {brandName}

{brandName} is {companyDescription}.

### Our Story
Founded in {foundingYear} by {founders}, {brandName} began with a mission to {mission}.

### What We Do
{serviceDescription}

### Our Products
{productDescriptions}

### Our Team
Led by {leadership}, our team of {teamSize} professionals brings {expertise}.

### Awards & Recognition
{awards}

### Contact Us
{contactInfo}`
    },
    {
      section: "Product Overview",
      template: `## {brandName} Products & Services

### {productName}
{productDescription}

**Key Features:**
{features}

**Benefits:**
{benefits}

**Ideal For:**
{targetAudience}

**Pricing:**
{pricing}`
    }
  ],

  wrong_sentiment: [
    {
      section: "Customer Success Stories",
      template: `## Customer Success Stories

### {customerName}'s Story
"{testimonial}"

**The Challenge:** {challenge}
**Our Solution:** {solution}
**The Result:** {result}

### What Our Customers Say
{testimonials}

### Our Commitment to You
At {brandName}, we stand behind our {promise}. {guarantee}`
    },
    {
      section: "Our Values",
      template: `## Our Values & Commitment

### Customer First
{customerFirstDescription}

### Quality Without Compromise
{qualityDescription}

### Transparency
{transparencyDescription}

### How We Measure Success
{successMetrics}`
    }
  ],

  competitor_confusion: [
    {
      section: "Why Choose {brandName}",
      template: `## Why Choose {brandName}

### What Sets Us Apart
{differentiators}

### Our Unique Approach
Unlike other companies in {industry}, {brandName} {uniqueApproach}.

### Our Heritage
Since {foundingYear}, {brandName} has been {heritage}.

### Recognition
{awards}

### The {brandName} Difference
| Feature | {brandName} | Industry Average |
|---------|-------------|------------------|
{comparisonTable}`
    },
    {
      section: "Comparison Page",
      template: `## {brandName} vs. Alternatives

### Our Specialty
{brandName} focuses exclusively on {specialty}.

### Key Differentiators
{differentiatorList}

### Detailed Comparison
{detailedComparison}

### Choose {brandName} When You Need
{useCases}`
    }
  ]
};

// ============================================
// Wikipedia Edit Suggestion Templates
// ============================================

export const WIKIPEDIA_TEMPLATES: Record<ProblemType, string> = {
  hallucination: `Suggested corrections for {brandName} Wikipedia article:

## Inaccurate Claims to Remove/Correct:
{inaccuracyList}

## Suggested Corrections:
{corrections}

## Reliable Sources:
{reliableSources}

## Notes:
- Please ensure all edits comply with Wikipedia's neutral point of view policy
- All facts should be verifiable through independent reliable sources
- Commercial promotion should be avoided`,

  missing_info: `Suggested additions for {brandName} Wikipedia article:

## Missing Information:
{missingInfo}

## Suggested Additions:
{suggestedAdditions}

## Reliable Sources:
{reliableSources}

## Notes:
- Information should be verifiable through third-party sources
- Maintain encyclopedic tone
- Avoid promotional language`,

  wrong_sentiment: `Suggested corrections for {brandName} Wikipedia article:

## Neutrality Concerns:
{neutralityConcerns}

## Suggested Balanced Edits:
{balancedEdits}

## Additional Context:
{additionalContext}

## Reliable Sources:
{reliableSources}`,

  competitor_confusion: `Clarification request for {brandName} Wikipedia article:

## Disambiguation Needed:
{disambiguationNeeded}

## Suggested Clarifications:
{clarifications}

## Key Differentiating Facts:
{differentiatingFacts}

## Reliable Sources:
{reliableSources}`
};

// ============================================
// LLM Prompts for Generation
// ============================================

export const CORRECTION_GENERATION_PROMPTS = {
  schemaOrg: `You are a Schema.org expert. Generate valid JSON-LD structured data for an organization based on the following context.

Brand Information:
{brandContext}

Problem Type: {problemType}
Issue Description: {issueDescription}

Generate a complete, valid Schema.org JSON-LD snippet that addresses the issue. Use only factual information from the brand context.

Respond with ONLY the JSON-LD code, no explanations.`,

  faq: `You are a content strategist. Generate FAQ content for a brand's website that addresses specific perception issues.

Brand Information:
{brandContext}

Problem Type: {problemType}
Issue Description: {issueDescription}
Misconceptions to Address: {misconceptions}

Generate 3-5 FAQ items in the following JSON format:
[
  {
    "question": "...",
    "answer": "..."
  }
]

Make answers factual, clear, and SEO-optimized. Use natural language.`,

  content: `You are a brand content strategist. Generate website content recommendations that address perception issues.

Brand Information:
{brandContext}

Problem Type: {problemType}
Issue Description: {issueDescription}

Generate a content recommendation with:
1. Section title
2. Suggested headline
3. Content outline (3-5 bullet points)
4. Key messages to include
5. Tone guidance

Format as JSON:
{
  "sectionTitle": "...",
  "headline": "...",
  "outline": [...],
  "keyMessages": [...],
  "toneGuidance": "..."
}`,

  wikipedia: `You are a Wikipedia editor providing guidance. Based on the following brand information and perception issues, suggest Wikipedia edits.

Brand Information:
{brandContext}

Problem Type: {problemType}
Issue Description: {issueDescription}

Generate edit suggestions following Wikipedia's policies (NPOV, verifiability, no original research).

Format as:
{
  "suggestedEdits": [...],
  "sourcesNeeded": [...],
  "existingClaimsToUpdate": [...],
  "notes": "..."
}`
};

// ============================================
// Utility Functions
// ============================================

export function getTemplatesForProblemType(problemType: ProblemType) {
  return {
    schemaOrg: SCHEMA_ORG_TEMPLATES[problemType],
    faq: FAQ_TEMPLATES[problemType],
    content: CONTENT_TEMPLATES[problemType],
    wikipedia: WIKIPEDIA_TEMPLATES[problemType],
  };
}

export function renderTemplate(template: string, variables: Record<string, string | string[]>): string {
  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`;
    if (Array.isArray(value)) {
      result = result.replace(new RegExp(placeholder, 'g'), JSON.stringify(value));
    } else {
      result = result.replace(new RegExp(placeholder, 'g'), value);
    }
  }

  return result;
}

export function getPriorityForProblemType(problemType: ProblemType): 'high' | 'medium' | 'low' {
  switch (problemType) {
    case 'hallucination':
      return 'high';
    case 'competitor_confusion':
      return 'high';
    case 'wrong_sentiment':
      return 'medium';
    case 'missing_info':
      return 'medium';
    default:
      return 'low';
  }
}

export function getEffortForFixType(fixType: 'schema_org' | 'faq' | 'content' | 'wikipedia'): 'low' | 'medium' | 'high' {
  switch (fixType) {
    case 'schema_org':
      return 'low';
    case 'faq':
      return 'low';
    case 'content':
      return 'medium';
    case 'wikipedia':
      return 'high';
    default:
      return 'medium';
  }
}
