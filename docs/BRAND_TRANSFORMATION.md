# VistralAI Brand-Centric Transformation Prompts
## For Use with Antigravity + Gemini 3 Pro

---

## 🎯 MASTER CONTEXT PROMPT

Copy this context prompt at the start of every session:

```
You are redesigning VistralAI, an AI Visibility Optimization Platform, to be radically brand-centric. 

CURRENT STATE: VistralAI is a technical SaaS tool that monitors how AI chatbots (ChatGPT, Gemini, Claude, Perplexity) represent brands. It shows metrics like "AI Visibility Score," "Crawler Activity," and "Share of Voice."

PROBLEM: The current UI feels like a technical monitoring dashboard for engineers, not a strategic command center for Brand Managers and CMOs.

DESIRED STATE: Transform every screen, metric, and interaction to reflect THE BRAND'S STORY as the hero. Brand managers should feel like they're looking at their brand's presence in the AI universe, not at technical crawler logs.

DESIGN PHILOSOPHY:
- The brand is the protagonist, AI platforms are the stage
- Metrics should feel like brand health indicators, not server logs  
- Language should be aspirational and strategic, not technical
- Every insight should connect to brand equity and market position
- The experience should feel like a "Brand War Room" not a "Monitoring Dashboard"

TECH STACK: Next.js 14, React 18, TypeScript, Tailwind CSS
DEPLOYMENT: Google Cloud Run
```

---

## PROMPT SET 1: DASHBOARD TRANSFORMATION

### Prompt 1.1: Hero Section Redesign

```
TASK: Redesign the VistralAI main dashboard hero section to be brand-centric.

CURRENT STATE:
- Shows "AI Visibility Score: 73/100" as a number
- Generic greeting "Welcome back, [User]"
- Technical metrics displayed in grid cards

TRANSFORM TO:
Create a "Brand Presence Hero" section that answers: "How is my brand showing up in the AI-powered world today?"

REQUIREMENTS:
1. Brand Identity Display
   - Large brand logo/name prominently displayed
   - Brand tagline or mission statement visible
   - Industry positioning label (e.g., "Leading Sustainable Fashion Brand")

2. "Brand Pulse" Metric (replaces AI Visibility Score)
   - Circular or radial visualization showing brand health
   - Three concentric rings: Recognition (outer), Accuracy (middle), Sentiment (inner)
   - Animated pulse effect suggesting "living" brand presence
   - Contextual label: "Your brand pulse across AI platforms"

3. Quick Narrative Summary
   - Single sentence: "Today, [Brand] is being recommended in 73% of relevant AI conversations, up 12% from last week"
   - Trend indicator with human-readable context

4. Platform Presence Strip
   - Horizontal bar showing brand presence on each AI platform
   - Visual: ChatGPT [████████░░] 80% | Gemini [██████░░░░] 60% | Claude [███████░░░] 70%
   - Each platform with its icon/color

Generate React/TypeScript component code with Tailwind CSS styling.
Include micro-animations for the pulse effect.
Mobile-responsive design required.
```

### Prompt 1.2: Metrics Cards Transformation

```
TASK: Transform technical metric cards into "Brand Health Indicators"

CURRENT METRICS (Technical):
- AI Visibility Score: 73
- Factual Accuracy: 89%
- Sentiment Score: 0.72
- Crawler Visits: 1,247
- Share of Voice: 34%

TRANSFORM TO BRAND-CENTRIC:

1. "Brand Recognition" (was AI Visibility)
   - Label: "How often AI recommends you"
   - Visualization: Spotlight/stage metaphor
   - Context: "When customers ask about [industry], you appear in 73% of AI responses"

2. "Story Accuracy" (was Factual Accuracy)  
   - Label: "How accurately AI tells your story"
   - Visualization: Alignment meter (brand truth vs AI perception)
   - Context: "AI platforms correctly represent your brand values 89% of the time"

3. "Brand Sentiment" (was Sentiment Score)
   - Label: "How positively AI speaks about you"
   - Visualization: Emotional spectrum (negative ← neutral → positive)
   - Context: "AI conversations about your brand are predominantly positive"

4. "Digital Footprint" (was Crawler Visits)
   - Label: "How actively AI learns about you"
   - Visualization: Ripple effect showing reach
   - Context: "AI platforms refreshed your brand knowledge 1,247 times this month"

5. "Market Voice" (was Share of Voice)
   - Label: "Your share of AI conversations"
   - Visualization: Pie/donut showing brand vs competitors
   - Context: "You own 34% of AI recommendations in your category"

Generate a React component for each card.
Include hover states that reveal deeper context.
Use brand-appropriate color theming (allow brand color customization).
```

### Prompt 1.3: Competitor Section as "Market Landscape"

```
TASK: Transform competitor analysis into a "Brand Market Landscape" view

CURRENT STATE:
- Table listing competitors with metrics
- Bar chart showing Share of Voice comparison
- Technical competitor tracking

TRANSFORM TO:

1. "Your Market Universe" Visualization
   - Center: User's brand (large, prominent)
   - Orbital rings: Competitors positioned by threat level
   - Inner orbit: Direct competitors
   - Outer orbit: Indirect/aspirational competitors
   - Size of competitor nodes = their AI presence strength
   - Connecting lines show competitive overlap areas

2. "Brand Battlecard" for Each Competitor
   - Side-by-side brand comparison
   - "Where you win": Areas where brand outperforms
   - "Opportunity zones": Areas to improve
   - "Their story vs Your story": How AI describes each brand

3. "Conversation Share" (was Share of Voice)
   - Visualization: Conversation bubbles sized by frequency
   - "When customers ask about [category], here's who AI recommends..."
   - Show actual example AI responses (anonymized)

4. "Competitive Moments"
   - Timeline of when competitors gained/lost AI visibility
   - Alerts: "Nike just increased their AI presence by 15% this week"
   - Opportunities: "Gap in AI coverage for [product category] - you could own this"

Generate interactive React components.
Include click-to-expand competitor details.
Support drag-to-reposition in market universe view.
```

---

## PROMPT SET 2: BRAND 360° PROFILE TRANSFORMATION

### Prompt 2.1: Brand Identity Section

```
TASK: Redesign the Brand 360° Profile to feel like a "Brand Story Canvas"

CURRENT STATE:
- Form fields: Vision, Mission, Values
- Text inputs with labels
- Static display of entered information

TRANSFORM TO:

1. "Brand Story Canvas" Layout
   - Full-width immersive header with brand imagery
   - Sections feel like chapters of a brand book, not form fields
   
2. "Brand Essence" Section
   Structure as narrative blocks:
   
   ┌─────────────────────────────────────────────┐
   │  WHY WE EXIST                               │
   │  ─────────────                              │
   │  [Vision statement displayed as quote]      │
   │                                             │
   │  "To make sustainable fashion accessible    │
   │   to everyone, everywhere."                 │
   │                                             │
   │  This is how AI should introduce us.   [✓] │
   └─────────────────────────────────────────────┘
   
   ┌─────────────────────────────────────────────┐
   │  WHAT WE DO                                 │
   │  ──────────                                 │
   │  [Mission displayed as action statement]    │
   │                                             │
   │  We create clothing that looks good,        │
   │  feels good, and does good.                 │
   │                                             │
   │  AI Alignment: 92% accurate            [●●●●○]
   └─────────────────────────────────────────────┘

3. "Brand Voice" Section
   - Visual representation of brand tone
   - Slider spectrum: Playful ←→ Serious, Casual ←→ Formal
   - "How we sound" with example phrases
   - AI comparison: "How AI describes you" vs "How you want to be described"

4. "Brand Values" as Visual Pillars
   - Each value as a pillar/card with icon
   - Click to expand: "What this means" + "How AI should reflect this"
   - Alignment indicator for each value

Generate React components with edit-in-place capability.
Include "AI Alignment Score" for each section.
Add "Teach AI" buttons that generate optimization suggestions.
```

### Prompt 2.2: Product Portfolio as "Brand Offerings"

```
TASK: Transform product catalog display into "Brand Offerings Showcase"

CURRENT STATE:
- Product list/grid
- Category filters
- Technical product details

TRANSFORM TO:

1. "What We Offer" Hero Section
   - Brand-styled product category overview
   - Visual: Product categories as lifestyle imagery, not SKU lists
   - Tagline: "Our products, as AI should present them"

2. "Product Stories" Grid
   Each product displayed as:
   ┌─────────────────────────────────────────────┐
   │  [Product Image]                            │
   │                                             │
   │  SUSTAINABLE COTTON TEE                     │
   │  ──────────────────────                     │
   │  Our Story: "Crafted from 100% organic      │
   │  cotton, designed for everyday comfort"     │
   │                                             │
   │  AI's Story: "Popular sustainable basic,    │
   │  frequently recommended for eco-conscious   │
   │  shoppers"                                  │
   │                                             │
   │  AI Mentions: 847 this month    [Trending ↑]│
   │  Accuracy: 94%                              │
   └─────────────────────────────────────────────┘

3. "Product Positioning Map"
   - 2D scatter plot: Price vs AI Recommendation Frequency
   - Bubble size = accuracy of AI description
   - Quadrants labeled: "Hero Products", "Hidden Gems", "Needs Attention", "Opportunities"

4. "Category Leadership"
   - For each product category, show brand's position
   - "In Sustainable Basics, you're #2 in AI recommendations"
   - Gap analysis: "To reach #1, focus on [specific attribute]"

Generate interactive product grid with filtering.
Include "Optimize This Product" CTA for each item.
Support bulk actions for product story updates.
```

---

## PROMPT SET 3: INSIGHTS AS "BRAND OPPORTUNITIES"

### Prompt 3.1: Insights Page Transformation

```
TASK: Transform "Optimization Insights" into "Brand Growth Opportunities"

CURRENT STATE:
- List of technical recommendations
- Priority labels (High/Medium/Low)
- Technical action items

TRANSFORM TO:

1. "Your Brand Opportunities" Header
   - Inspirational framing: "Ways to strengthen your AI presence"
   - Summary: "We've identified 12 opportunities to amplify your brand story"
   - Potential impact meter: "Implementing these could increase your Brand Pulse by 18%"

2. Opportunity Cards (not task lists)
   
   ┌─────────────────────────────────────────────────┐
   │  🎯 BRAND STORY OPPORTUNITY                     │
   │  ━━━━━━━━━━━━━━━━━━━━━━━━━                      │
   │                                                 │
   │  "Own the Sustainability Conversation"          │
   │                                                 │
   │  AI platforms are discussing sustainable        │
   │  fashion 340% more than last quarter, but       │
   │  your brand is mentioned in only 23% of         │
   │  these conversations.                           │
   │                                                 │
   │  THE OPPORTUNITY:                               │
   │  Update your website's sustainability page      │
   │  to include specific certifications and         │
   │  impact metrics that AI can reference.          │
   │                                                 │
   │  POTENTIAL IMPACT: +15% Brand Recognition       │
   │  EFFORT: Medium (2-3 hours)                     │
   │                                                 │
   │  [Start This Opportunity →]                     │
   └─────────────────────────────────────────────────┘

3. Opportunity Categories (Brand-Centric)
   - "Strengthen Your Story" (content/messaging)
   - "Expand Your Reach" (new AI platforms/topics)
   - "Protect Your Reputation" (accuracy/sentiment)
   - "Outpace Competitors" (competitive positioning)

4. "Brand Growth Path"
   - Visual roadmap showing recommended sequence
   - "Complete these 3 opportunities to reach 'Brand Leader' status"
   - Progress tracker with celebrations

Generate opportunity cards with expand/collapse.
Include "Quick Win" badges for easy opportunities.
Add estimated time and impact for each.
```

### Prompt 3.2: Alerts as "Brand Moments"

```
TASK: Transform "Alerts" into "Brand Moments That Matter"

CURRENT STATE:
- Alert list with severity indicators
- Technical alert types (crawler activity, visibility drops)
- Dismiss/resolve actions

TRANSFORM TO:

1. "Brand Moments" Dashboard Section
   - Framing: "Important moments in your brand's AI journey"
   - Not alarms, but noteworthy events requiring attention

2. Moment Types (Brand-Centric Language)

   Instead of "Competitor Visibility Spike":
   ┌─────────────────────────────────────────────┐
   │  📊 MARKET SHIFT                            │
   │  ──────────────                             │
   │  "Nike is gaining ground"                   │
   │                                             │
   │  Nike's AI presence increased 23% this      │
   │  week, primarily in athletic sustainability │
   │  conversations.                             │
   │                                             │
   │  YOUR RESPONSE OPTIONS:                     │
   │  • Review your sustainability messaging     │
   │  • Highlight your athletic credentials      │
   │  • Monitor for 1 more week                  │
   └─────────────────────────────────────────────┘

   Instead of "Hallucination Detected":
   ┌─────────────────────────────────────────────┐
   │  ⚠️ STORY CORRECTION NEEDED                 │
   │  ─────────────────────────                  │
   │  "AI is telling an outdated story"          │
   │                                             │
   │  ChatGPT is still describing your brand     │
   │  using 2022 messaging. Your sustainability  │
   │  certification isn't being mentioned.       │
   │                                             │
   │  SUGGESTED ACTION:                          │
   │  Update your About page with current        │
   │  certifications to help AI learn your       │
   │  latest story.                              │
   │                                             │
   │  [Fix This Story →] [Remind Me Later]       │
   └─────────────────────────────────────────────┘

   Instead of "Visibility Drop":
   ┌─────────────────────────────────────────────┐
   │  📉 ATTENTION NEEDED                        │
   │  ────────────────                           │
   │  "Your brand voice is fading"               │
   │                                             │
   │  In "eco-friendly basics" conversations,    │
   │  your recommendations dropped from 45%      │
   │  to 28% over the past 2 weeks.              │
   │                                             │
   │  LIKELY CAUSE:                              │
   │  Competitor "Everlane" published new        │
   │  sustainability content that AI is          │
   │  prioritizing.                              │
   │                                             │
   │  [See Recommended Actions →]                │
   └─────────────────────────────────────────────┘

3. "Brand Health Timeline"
   - Chronological view of all brand moments
   - Filter by: Wins, Challenges, Opportunities, Competitive
   - "Your brand story this month" narrative summary

Generate components with action-oriented CTAs.
Include "What This Means" explanations for each moment.
Add celebration moments for positive brand events.
```

---

## PROMPT SET 4: NAVIGATION & INFORMATION ARCHITECTURE

### Prompt 4.1: Navigation Restructure

```
TASK: Restructure VistralAI navigation to be brand-journey-centric

CURRENT NAVIGATION:
- Dashboard
- Insights  
- Analytics
- Alerts
- Brand Profile
- Settings

TRANSFORM TO:

1. Primary Navigation (Brand Journey)
   
   ┌─────────────────────────────────────────────┐
   │  [Brand Logo]                               │
   │                                             │
   │  🏠 Brand Command Center     (was Dashboard)│
   │     Your brand's AI presence at a glance    │
   │                                             │
   │  📖 Brand Story              (was Profile)  │
   │     Define how AI should know you           │
   │                                             │
   │  🎯 Growth Opportunities     (was Insights) │
   │     Actions to strengthen your presence     │
   │                                             │
   │  🌍 Market Landscape         (was Analytics)│
   │     Your position vs competitors            │
   │                                             │
   │  ⚡ Brand Moments             (was Alerts)  │
   │     Events that need your attention         │
   │                                             │
   │  ─────────────────────────────              │
   │                                             │
   │  ⚙️ Brand Settings                          │
   │  🔌 Integrations                            │
   │  👥 Team (Agency accounts)                  │
   └─────────────────────────────────────────────┘

2. Contextual Sub-Navigation
   
   Brand Story →
   ├── Brand Essence (vision, mission, values)
   ├── Brand Voice (tone, personality)
   ├── Our Offerings (products/services)
   ├── Our Audience (target customers)
   └── Our Competitors (who we compete with)

   Market Landscape →
   ├── Competitive Overview
   ├── Category Leadership
   ├── Trending Conversations
   └── Market Opportunities

3. Quick Actions Bar (Persistent)
   - "Check Brand Pulse" (instant score refresh)
   - "View Latest Moment" (most recent alert)
   - "Quick Optimize" (highest impact opportunity)

Generate sidebar navigation component.
Include active state indicators.
Add notification badges for pending moments.
Mobile: Convert to bottom tab navigation.
```

### Prompt 4.2: Onboarding Flow Reframe

```
TASK: Reframe onboarding as "Tell Us Your Brand Story"

CURRENT ONBOARDING:
- Step 1: Enter website URL
- Step 2: Upload products
- Step 3: Add competitors
- Step 4: Review profile

TRANSFORM TO:

1. Welcome Screen
   
   ┌─────────────────────────────────────────────┐
   │                                             │
   │        Welcome to Your Brand's              │
   │           AI Command Center                 │
   │                                             │
   │  In the next few minutes, we'll help you    │
   │  understand how AI platforms see your       │
   │  brand—and how to shape that narrative.     │
   │                                             │
   │  Let's start by learning your story.        │
   │                                             │
   │           [Begin Your Journey →]            │
   │                                             │
   └─────────────────────────────────────────────┘

2. Step 1: "Where Does Your Brand Live?"
   - Friendly prompt: "Share your website so we can learn your story"
   - Progress message: "Reading your brand story..."
   - Completion: "We found a lot to love about your brand!"

3. Step 2: "What Do You Offer the World?"
   - Framing: "Help us understand your products and services"
   - Options presented as:
     - "We found these on your website" (auto-extracted)
     - "I have a product catalog" (upload)
     - "Connect my store" (Shopify)
   - Progress: "Organizing your offerings..."

4. Step 3: "Who Shares Your Stage?"
   - Framing: "Who are you competing with for customer attention?"
   - AI suggestions: "Based on your story, these brands might be your competitors"
   - Easy add/remove with rationale shown
   - Market positioning preview

5. Step 4: "Your Brand Story, Verified"
   - Display AI-generated profile as a "Brand Story Card"
   - Frame edits as: "Does this sound like you?"
   - Confidence highlights: "We're confident about this" vs "Help us understand this better"
   - Final CTA: "Launch My Brand Command Center"

6. Post-Onboarding Celebration
   - "Your Brand Command Center is ready!"
   - First insight preview: "Here's your first opportunity to strengthen your AI presence"
   - Quick tour offer

Generate onboarding wizard with brand-storytelling narrative.
Include encouraging micro-copy throughout.
Add progress celebration animations between steps.
```

---

## PROMPT SET 5: TERMINOLOGY TRANSFORMATION GUIDE

### Prompt 5.1: Complete Terminology Mapping

```
TASK: Create a comprehensive terminology transformation for VistralAI

Generate a mapping document and component that enforces brand-centric language throughout the application.

TERMINOLOGY TRANSFORMATIONS:

| Technical Term | Brand-Centric Term | Context/Usage |
|----------------|-------------------|---------------|
| AI Visibility Score | Brand Pulse | "Your Brand Pulse is 73" |
| Crawler Activity | AI Learning | "AI platforms are actively learning about you" |
| Share of Voice | Conversation Share | "You own 34% of the conversation" |
| Hallucination | Story Mismatch | "We found a story mismatch to correct" |
| Optimization | Opportunity | "Growth opportunity identified" |
| Factual Accuracy | Story Accuracy | "Your story is being told accurately" |
| Sentiment Score | Brand Feeling | "How customers feel when AI mentions you" |
| Competitor Tracking | Market Awareness | "Staying aware of your market" |
| Alert | Brand Moment | "An important brand moment needs attention" |
| Dashboard | Command Center | "Your Brand Command Center" |
| Analytics | Market Insights | "Insights into your market position" |
| Data Source | Brand Input | "Connect a brand input" |
| Crawl/Scrape | Learn/Discover | "AI is learning your story" |
| API | Connection | "Establish a connection" |
| Webhook | Notification | "Set up notifications" |
| Query | Conversation | "Customer conversations" |
| Ranking | Position | "Your position in the category" |
| Traffic | Attention | "AI attention to your brand" |
| Conversion | Recommendation | "AI recommendations" |
| Bounce Rate | Missed Opportunity | "Conversations that missed you" |
| Session | Interaction | "AI interactions about you" |
| User | Brand Manager | "Welcome, Brand Manager" |
| Admin | Brand Owner | "Brand Owner settings" |

VOICE GUIDELINES:
1. Active voice: "Your brand is being recommended" not "Recommendations are being made"
2. Empowering: "You can improve" not "Needs improvement"
3. Partnership: "We found" not "System detected"
4. Narrative: "Your story" not "Your data"
5. Aspirational: "Opportunity" not "Problem"

Generate:
1. TypeScript constants file with all terminology
2. React hook: useTerminology() for consistent usage
3. Component wrapper that auto-transforms strings
4. Documentation for team reference
```

---

## PROMPT SET 6: VISUAL DESIGN SYSTEM

### Prompt 6.1: Brand-Centric Design Tokens

```
TASK: Create a design system that feels like a "Brand War Room" not a "Technical Dashboard"

DESIGN PRINCIPLES:
1. Premium & Strategic - Like a CMO's executive dashboard
2. Warm & Human - Not cold data visualization
3. Brand-Customizable - Adapts to user's brand colors
4. Story-Focused - Data tells narratives, not just numbers

COLOR SYSTEM:

1. Primary Palette (Default - User can override with brand colors)
   - Brand Primary: Deep Navy (#1a365d) - Authority, trust
   - Brand Accent: Warm Gold (#d69e2e) - Premium, achievement
   - Success: Sage Green (#48bb78) - Growth, positive
   - Warning: Amber (#ed8936) - Attention, opportunity
   - Danger: Rose (#e53e3e) - Urgent, needs action

2. Semantic Colors for Brand Metrics
   - Brand Pulse High (>80): Vibrant Teal
   - Brand Pulse Medium (50-80): Steady Blue
   - Brand Pulse Low (<50): Warm Amber (not red - opportunity, not failure)

3. AI Platform Colors (Consistent identification)
   - ChatGPT: #10a37f (OpenAI green)
   - Gemini: #4285f4 (Google blue)
   - Claude: #cc785c (Anthropic orange)
   - Perplexity: #1fb8cd (Perplexity teal)
   - Meta AI: #0668E1 (Meta blue)

TYPOGRAPHY:
1. Headlines: "Inter" or "Plus Jakarta Sans" - Modern, confident
2. Body: "Inter" - Clean, readable
3. Data: "JetBrains Mono" or "IBM Plex Mono" - For metrics only
4. Brand Quotes: Serif accent for vision/mission display

COMPONENT STYLING:
1. Cards: Subtle shadows, rounded corners (12px), generous padding
2. Metrics: Large numbers, contextual labels below
3. Charts: Soft gradients, no harsh lines
4. Icons: Lucide or Heroicons, 2px stroke, rounded caps

MICRO-INTERACTIONS:
1. Brand Pulse: Subtle breathing animation
2. Metrics: Count-up animation on load
3. Cards: Gentle lift on hover
4. Success: Confetti for achievements
5. Transitions: Smooth 300ms ease-out

Generate:
1. Tailwind CSS config with design tokens
2. CSS variables for brand customization
3. Component library with styled variants
4. Dark mode support (for those late-night strategy sessions)
```

### Prompt 6.2: Data Visualization Transformation

```
TASK: Transform technical charts into "Brand Story Visualizations"

CURRENT VISUALIZATIONS:
- Line charts showing metrics over time
- Bar charts comparing competitors
- Pie charts for share of voice
- Tables with data

TRANSFORM TO:

1. "Brand Journey" (was Line Chart)
   - Visualization: Flowing river or path metaphor
   - Y-axis: Brand strength (not just numbers)
   - Annotations: Key brand moments marked on timeline
   - Story: "Your brand's AI journey over time"

2. "Market Stage" (was Competitor Bar Chart)
   - Visualization: Stage/spotlight metaphor
   - Your brand in center spotlight
   - Competitors in wings, sized by presence
   - Interactive: Click competitor to compare stories

3. "Conversation Pie" (was Share of Voice Pie)
   - Visualization: Conversation bubbles, not pie slices
   - Your brand's bubble prominently colored
   - Competitors in neutral tones
   - Label: "When customers ask, who gets mentioned?"

4. "Brand Health Radar" (New)
   - Spider/radar chart showing brand dimensions
   - Dimensions: Recognition, Accuracy, Sentiment, Reach, Growth
   - Overlay: Industry average for comparison
   - Story: "Your brand's strengths and opportunities"

5. "AI Platform Galaxy" (New)
   - Visualization: Solar system / galaxy view
   - Your brand as sun in center
   - AI platforms as orbiting planets
   - Size/distance = strength of presence on each
   - Animated: Planets pulse when recent activity

6. "Opportunity Landscape" (New)
   - Visualization: Terrain/topography map
   - Peaks = strong presence areas
   - Valleys = opportunity zones
   - Color gradient: Current strength to potential

Generate React components using Recharts or D3.
Include accessibility features (screen reader descriptions).
Support brand color theming.
Add export capability for presentations.
```

---

## PROMPT SET 7: COPYWRITING & MICROCOPY

### Prompt 7.1: UI Copywriting Transformation

```
TASK: Rewrite all UI copy to be brand-centric and empowering

EMPTY STATES:

Before: "No data available"
After: "Your brand story is waiting to be discovered. Let's get started."

Before: "No competitors added"
After: "Who shares your spotlight? Add competitors to see how you compare."

Before: "No alerts"
After: "All quiet on the brand front. Your story is being told well."

Before: "No products found"
After: "What do you offer the world? Add your products to help AI recommend them."

ERROR STATES:

Before: "Error loading data"
After: "We hit a snag loading your brand insights. Let's try again."

Before: "Invalid URL"
After: "We couldn't find a website at that address. Double-check and try again?"

Before: "Request failed"
After: "Something went wrong on our end. Your brand deserves better—we're on it."

LOADING STATES:

Before: "Loading..."
After: "Gathering your brand insights..."

Before: "Processing..."
After: "Learning your brand story..."

Before: "Analyzing..."
After: "Understanding your market position..."

SUCCESS STATES:

Before: "Saved successfully"
After: "Your brand story has been updated!"

Before: "Profile complete"
After: "Your Brand Command Center is ready!"

Before: "Competitor added"
After: "Market awareness expanded. We're tracking them now."

BUTTON LABELS:

Before: "Submit" → After: "Save My Story"
Before: "Cancel" → After: "Not Yet"
Before: "Delete" → After: "Remove"
Before: "Add" → After: "Add to My Story"
Before: "Edit" → After: "Refine"
Before: "View Details" → After: "See the Full Story"
Before: "Export" → After: "Share This Insight"
Before: "Refresh" → After: "Check for Updates"

TOOLTIPS & HELP TEXT:

Before: "AI Visibility Score measures how often AI chatbots mention your brand"
After: "Your Brand Pulse shows how prominently you appear when customers ask AI for recommendations in your category. Higher is better!"

Before: "Share of Voice is calculated by..."
After: "Conversation Share shows what percentage of relevant AI conversations mention your brand versus competitors. Own more of the conversation!"

Before: "Factual accuracy measures correctness"
After: "Story Accuracy shows how well AI platforms understand and communicate your true brand story. When this is high, customers get the right impression of you."

Generate:
1. Copy constants file organized by feature area
2. React context for copy management
3. Support for A/B testing different copy versions
4. Internationalization-ready structure
```

---

## PROMPT SET 8: FEATURE-SPECIFIC TRANSFORMATIONS

### Prompt 8.1: Agency/Multi-Brand View

```
TASK: Transform agency view from "client management" to "Brand Portfolio Command"

CURRENT STATE:
- Client list with metrics
- Switch between client accounts
- Aggregate reporting

TRANSFORM TO:

1. "Brand Portfolio" Dashboard
   - Visualization: Brand cards arranged as portfolio
   - Each brand as a "Brand Health Card" showing pulse
   - Quick comparison view across brands
   - Header: "Your Brand Portfolio at a Glance"

2. "Portfolio Performance" Summary
   - Aggregate metrics across all brands
   - "Your portfolio's combined AI presence"
   - Top performer highlight
   - Needs attention callouts

3. "Cross-Brand Opportunities"
   - Insights that apply to multiple brands
   - "3 of your brands could benefit from sustainability messaging"
   - Efficiency recommendations

4. "Brand Switching"
   - Not "Switch Account" but "Focus on [Brand Name]"
   - Recent brands for quick access
   - Search by brand name or category

Generate agency dashboard components.
Include portfolio-level analytics.
Support white-label customization for agencies.
```

### Prompt 8.2: Reporting & Exports

```
TASK: Transform reports from "data exports" to "Brand Story Reports"

CURRENT STATE:
- PDF/CSV exports of metrics
- Date range selection
- Technical formatting

TRANSFORM TO:

1. "Brand Story Report" Generator
   - Template: Executive summary style
   - Opens with brand narrative, not data tables
   - Sections: "Your Brand This Month", "Market Position", "Opportunities Ahead"
   - Visualizations embedded, not just numbers

2. Report Sections:
   
   EXECUTIVE SUMMARY
   "[Brand] strengthened its AI presence this month, with Brand Pulse 
   increasing from 68 to 73. Key wins include improved story accuracy 
   on ChatGPT and expanded reach in sustainability conversations."

   BRAND HEALTH OVERVIEW
   - Brand Pulse trend visualization
   - Key metric highlights with context
   - Month-over-month narrative

   MARKET POSITION
   - Competitive landscape summary
   - Share of conversation changes
   - Competitor movements

   GROWTH OPPORTUNITIES
   - Top 3 recommended actions
   - Potential impact projections
   - Implementation guidance

   LOOKING AHEAD
   - Predicted trends
   - Upcoming focus areas
   - Recommended priorities

3. "Presentation Mode"
   - One-click generate slides for stakeholder meetings
   - Brand-styled with company logo
   - Talking points included

4. "Share with Stakeholders"
   - Email report with summary
   - Secure link to interactive dashboard view
   - Scheduled report delivery

Generate report templates.
Include PDF generation capability.
Support brand styling customization.
Add scheduled delivery settings.
```

---

## EXECUTION CHECKLIST

Use this checklist to track transformation progress:

### Phase 1: Core Brand-Centric Foundations
- [ ] Implement terminology transformation (Prompt 5.1)
- [ ] Update design tokens and color system (Prompt 6.1)
- [ ] Transform navigation structure (Prompt 4.1)
- [ ] Rewrite all UI copy (Prompt 7.1)

### Phase 2: Dashboard Transformation
- [ ] Build Brand Pulse hero section (Prompt 1.1)
- [ ] Create brand health indicator cards (Prompt 1.2)
- [ ] Implement market landscape visualization (Prompt 1.3)

### Phase 3: Brand Story Experience
- [ ] Redesign Brand 360° Profile (Prompt 2.1)
- [ ] Transform product showcase (Prompt 2.2)
- [ ] Rebuild onboarding flow (Prompt 4.2)

### Phase 4: Insights & Engagement
- [ ] Create opportunity cards (Prompt 3.1)
- [ ] Build brand moments system (Prompt 3.2)
- [ ] Implement data visualizations (Prompt 6.2)

### Phase 5: Advanced Features
- [ ] Agency portfolio view (Prompt 8.1)
- [ ] Brand story reports (Prompt 8.2)
- [ ] Cross-brand insights

---

## FINAL VALIDATION PROMPT

```
TASK: Validate the brand-centric transformation is complete

Review the transformed VistralAI application against these criteria:

BRAND-CENTRIC CHECKLIST:

1. LANGUAGE
   □ No technical jargon visible to users
   □ All metrics have brand-context labels
   □ Error messages are empowering, not alarming
   □ Empty states tell a brand story

2. VISUALS
   □ Brand colors are customizable and prominent
   □ Data visualizations tell stories, not just show numbers
   □ Competitors are shown in context, not as threats
   □ Success moments are celebrated

3. NAVIGATION
   □ Menu items reflect brand journey stages
   □ User always knows "where am I in my brand story"
   □ Quick actions relate to brand improvement

4. INSIGHTS
   □ Every data point connects to brand impact
   □ Recommendations frame as opportunities, not problems
   □ Competitor data shows positioning, not just comparison

5. EMOTIONAL EXPERIENCE
   □ User feels empowered, not overwhelmed
   □ Complexity is hidden, clarity is shown
   □ Brand manager feels like a strategist, not a technician

FINAL TEST: 
Show the dashboard to a CMO who has never seen the product.
Ask: "What is this tool for?"
Expected answer: "It helps me understand and improve how AI talks about my brand."
NOT: "It monitors AI crawler activity and visibility metrics."

If the CMO answer is brand-centric, transformation is successful.
```

---

*Generated for VistralAI Brand-Centric Transformation*
*Compatible with Antigravity + Gemini 3 Pro*
