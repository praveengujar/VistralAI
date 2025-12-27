export const TERMINOLOGY_MAPPING = {
    // Core Metrics
    "AI Visibility Score": "Brand Pulse",
    "Crawler Activity": "AI Learning",
    "Share of Voice": "Conversation Share",
    "Factual Accuracy": "Story Accuracy",
    "Sentiment Score": "Brand Feeling",

    // Concepts
    "Hallucination": "Story Mismatch",
    "Optimization": "Opportunity",
    "Competitor Tracking": "Market Awareness",
    "Alert": "Brand Moment",
    "Dashboard": "Command Center",
    "Analytics": "Market Insights",
    "Data Source": "Brand Input",
    "Crawl": "Learn",
    "Scrape": "Discover",
    "API": "Connection",
    "Webhook": "Notification",
    "Query": "Conversation",
    "Ranking": "Position",
    "Traffic": "Attention",
    "Conversion": "Recommendation",
    "Bounce Rate": "Missed Opportunity",
    "Session": "Interaction",

    // Roles
    "User": "Brand Manager",
    "Admin": "Brand Owner",
} as const;

export type TerminologyKey = keyof typeof TERMINOLOGY_MAPPING;
export type BrandTerm = typeof TERMINOLOGY_MAPPING[TerminologyKey];

export const getBrandTerm = (term: TerminologyKey | string): string => {
    return TERMINOLOGY_MAPPING[term as TerminologyKey] || term;
};

export const BRAND_CONTEXT = {
    "Brand Pulse": "Your Brand Pulse shows how prominently you appear when customers ask AI for recommendations in your category. Higher is better!",
    "AI Learning": "AI platforms are actively learning about you",
    "Conversation Share": "Conversation Share shows what percentage of relevant AI conversations mention your brand versus competitors. Own more of the conversation!",
    "Story Mismatch": "We found a story mismatch to correct",
    "Opportunity": "Growth opportunity identified",
    "Story Accuracy": "Story Accuracy shows how well AI platforms understand and communicate your true brand story. When this is high, customers get the right impression of you.",
    "Brand Feeling": "How customers feel when AI mentions you",
    "Market Awareness": "Staying aware of your market",
    "Brand Moment": "An important brand moment needs attention",
    "Command Center": "Your Brand Command Center",
    "Market Insights": "Insights into your market position",
    "Brand Input": "Connect a brand input",
    "Learn": "AI is learning your story",
    "Connection": "Establish a connection",
    "Notification": "Set up notifications",
    "Conversation": "Customer conversations",
    "Position": "Your position in the category",
    "Attention": "AI attention to your brand",
    "Recommendation": "AI recommendations",
    "Missed Opportunity": "Conversations that missed you",
    "Interaction": "AI interactions about you",
    "Brand Manager": "Welcome, Brand Manager",
    "Brand Owner": "Brand Owner settings",
} as const;
