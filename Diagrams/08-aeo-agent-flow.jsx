import React from 'react';

const AEOAgentFlowDiagram = () => {
  const agents = [
    {
      step: 1,
      name: 'CrawlerAgent',
      color: '#3B82F6',
      badge: 'Firecrawl',
      input: 'Website URL',
      process: 'Crawl up to 20 pages, extract Schema.org, meta tags, content',
      output: 'CrawlResult {pages[], schemaOrg{}, socialLinks[]}',
      metrics: 'pages_crawled, schema_types_found'
    },
    {
      step: 2,
      name: 'VibeCheckAgent',
      color: '#EC4899',
      badge: 'GPT-4o-mini',
      input: 'CrawlResult',
      process: 'Infer Kapferer prism (6 facets), archetype (12 Jungian), Big 5 traits',
      output: 'BrandVibe {archetype, prism, voice, personality}',
      metrics: 'archetype_confidence (0-100)'
    },
    {
      step: 3,
      name: 'CompetitorAgent',
      color: '#8B5CF6',
      badge: 'GPT-4o',
      input: 'Brand name, industry, domain',
      process: 'Discover direct, indirect, aspirational competitors',
      output: 'Competitor[] {name, type, threatLevel, strengths[], weaknesses[]}',
      metrics: 'competitors_found (by type)'
    },
    {
      step: 4,
      name: 'BrandIntelligence',
      color: '#10B981',
      badge: 'Synthesis',
      input: 'All agent outputs',
      process: 'Synthesize Brand360Profile, generate Organization Schema (JSON-LD)',
      output: 'Complete Brand360Profile + EntityHome',
      metrics: 'completion_score, entity_health_score (0-100)',
      wsEvent: 'brand360:created'
    }
  ];

  const promptCategories = [
    { name: 'Navigational', desc: 'The Who - Brand discovery', color: '#3B82F6' },
    { name: 'Functional', desc: 'The How - Features, capabilities', color: '#10B981' },
    { name: 'Comparative', desc: 'The Which - vs competitors', color: '#8B5CF6' },
    { name: 'Voice', desc: 'The Vibe - Tone, personality', color: '#EC4899' },
    { name: 'Adversarial', desc: 'The Risk - Edge cases, attacks', color: '#EF4444' }
  ];

  const perceptionMetrics = [
    { name: 'Faithfulness', range: '0-100', desc: 'Accuracy to ground truth', color: '#10B981' },
    { name: 'Share of Voice', range: '0-100', desc: 'Brand visibility', color: '#3B82F6' },
    { name: 'Sentiment', range: '-1 to 1', desc: 'Overall sentiment', color: '#F59E0B' },
    { name: 'Voice Alignment', range: '0-100', desc: 'Matches brand tone', color: '#8B5CF6' },
    { name: 'Hallucination', range: '0-100', desc: '100 = no hallucinations', color: '#EF4444' }
  ];

  const quadrants = [
    { name: 'DOMINANT', pos: 'High Acc + High Vis', color: '#10B981' },
    { name: 'VULNERABLE', pos: 'Low Acc + High Vis', color: '#F59E0B' },
    { name: 'NICHE', pos: 'High Acc + Low Vis', color: '#3B82F6' },
    { name: 'INVISIBLE', pos: 'Low Acc + Low Vis', color: '#EF4444' }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0A0A12 0%, #12121F 50%, #0A0A12 100%)',
      padding: '40px 24px',
      fontFamily: "'Inter', -apple-system, sans-serif"
    }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#F8FAFC', margin: '0 0 8px 0' }}>AEO Agent Workflow</h1>
        <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>AI Engine Optimization pipeline with real-time events</p>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* Input */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            borderRadius: '14px',
            padding: '16px 36px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)'
          }}>
            <div style={{ fontSize: '20px', marginBottom: '6px' }}>🌐</div>
            <div style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>Website URL</div>
            <code style={{ color: '#C7D2FE', fontSize: '11px' }}>/api/aeo/magic-import</code>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div style={{ background: '#1E293B', borderRadius: '16px', padding: '6px 16px', border: '1px solid #475569' }}>
            <span style={{ color: '#94A3B8', fontSize: '11px' }}>
              Coordinated by <strong style={{ color: '#F8FAFC' }}>MagicImportOrchestrator</strong>
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
          <div style={{ width: '2px', height: '20px', background: 'linear-gradient(to bottom, #6366F1, #3B82F6)' }} />
        </div>

        {/* Agent Pipeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
          {agents.map((agent, idx) => (
            <React.Fragment key={agent.step}>
              <div style={{
                background: '#1A1F2E',
                borderRadius: '14px',
                border: `2px solid ${agent.color}`,
                overflow: 'hidden',
                boxShadow: `0 4px 16px ${agent.color}15`
              }}>
                <div style={{
                  background: `${agent.color}20`,
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: `1px solid ${agent.color}40`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: agent.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '700',
                      fontSize: '13px'
                    }}>
                      {agent.step}
                    </div>
                    <span style={{ color: agent.color, fontWeight: '700', fontSize: '14px' }}>{agent.name}</span>
                    <span style={{
                      background: '#0F172A',
                      color: '#94A3B8',
                      padding: '3px 8px',
                      borderRadius: '10px',
                      fontSize: '10px',
                      border: '1px solid #334155'
                    }}>
                      {agent.badge}
                    </span>
                  </div>
                  {agent.wsEvent && (
                    <code style={{
                      background: '#8B5CF620',
                      color: '#8B5CF6',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '10px'
                    }}>
                      WS: {agent.wsEvent}
                    </code>
                  )}
                </div>

                <div style={{ padding: '14px 18px', display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 1fr', gap: '14px' }}>
                  <div>
                    <div style={{ color: '#64748B', fontSize: '9px', fontWeight: '600', marginBottom: '3px' }}>INPUT</div>
                    <div style={{ color: '#E2E8F0', fontSize: '11px' }}>{agent.input}</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748B', fontSize: '9px', fontWeight: '600', marginBottom: '3px' }}>PROCESS</div>
                    <div style={{ color: '#E2E8F0', fontSize: '11px' }}>{agent.process}</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748B', fontSize: '9px', fontWeight: '600', marginBottom: '3px' }}>OUTPUT</div>
                    <div style={{ color: agent.color, fontSize: '11px', fontWeight: '500' }}>{agent.output}</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748B', fontSize: '9px', fontWeight: '600', marginBottom: '3px' }}>METRICS</div>
                    <div style={{ color: '#94A3B8', fontSize: '10px' }}>{agent.metrics}</div>
                  </div>
                </div>
              </div>

              {idx < agents.length - 1 && (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{ width: '2px', height: '16px', background: `linear-gradient(to bottom, ${agent.color}, ${agents[idx + 1].color})` }} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Perception Scan Section */}
        <div style={{
          background: '#1A1F2E',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '20px',
          border: '1px solid #6366F1'
        }}>
          <div style={{ color: '#6366F1', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', marginBottom: '16px' }}>
            PERCEPTION SCAN (Separate Trigger)
          </div>

          {/* Prompt Generation */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ color: '#94A3B8', fontSize: '10px', fontWeight: '600', marginBottom: '10px' }}>PROMPT GENERATION (5 Categories)</div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {promptCategories.map((cat) => (
                <div key={cat.name} style={{
                  background: `${cat.color}15`,
                  border: `1px solid ${cat.color}40`,
                  borderRadius: '8px',
                  padding: '10px 14px',
                  flex: '1 1 180px'
                }}>
                  <div style={{ color: cat.color, fontSize: '12px', fontWeight: '600' }}>{cat.name}</div>
                  <div style={{ color: '#94A3B8', fontSize: '10px' }}>{cat.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* PerceptionEvaluator */}
          <div style={{
            background: '#14B8A620',
            border: '1px solid #14B8A640',
            borderRadius: '10px',
            padding: '14px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#14B8A6', fontWeight: '700', fontSize: '13px' }}>PerceptionEvaluatorAgent</span>
                <span style={{
                  background: '#0F172A',
                  color: '#94A3B8',
                  padding: '2px 8px',
                  borderRadius: '8px',
                  fontSize: '9px'
                }}>LLM-as-a-Judge</span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <code style={{ background: '#8B5CF620', color: '#8B5CF6', padding: '2px 6px', borderRadius: '4px', fontSize: '9px' }}>WS: scan:progress</code>
                <code style={{ background: '#8B5CF620', color: '#8B5CF6', padding: '2px 6px', borderRadius: '4px', fontSize: '9px' }}>WS: scan:complete</code>
              </div>
            </div>
            <div style={{ color: '#94A3B8', fontSize: '10px' }}>
              For each prompt × platform (Claude, ChatGPT, Gemini, Perplexity): Query → Capture response → Score with LLM-as-a-Judge
            </div>
          </div>

          {/* Metrics */}
          <div style={{ color: '#94A3B8', fontSize: '10px', fontWeight: '600', marginBottom: '10px' }}>PERCEPTION METRICS OUTPUT</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
            {perceptionMetrics.map((metric) => (
              <div key={metric.name} style={{
                background: '#0F172A',
                borderRadius: '10px',
                padding: '12px',
                borderTop: `3px solid ${metric.color}`,
                textAlign: 'center'
              }}>
                <div style={{ color: metric.color, fontSize: '11px', fontWeight: '600', marginBottom: '3px' }}>{metric.name}</div>
                <div style={{ color: '#E2E8F0', fontSize: '13px', fontWeight: '700', marginBottom: '2px' }}>{metric.range}</div>
                <div style={{ color: '#64748B', fontSize: '9px' }}>{metric.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quadrant Classification */}
        <div style={{
          background: '#1A1F2E',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #334155'
        }}>
          <div style={{ color: '#94A3B8', fontSize: '11px', fontWeight: '600', letterSpacing: '1px', marginBottom: '14px' }}>
            QUADRANT CLASSIFICATION
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {quadrants.map((q) => (
              <div key={q.name} style={{
                background: `${q.color}15`,
                borderRadius: '10px',
                padding: '14px',
                border: `1px solid ${q.color}40`,
                textAlign: 'center'
              }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: q.color,
                  boxShadow: `0 0 12px ${q.color}`,
                  margin: '0 auto 8px'
                }} />
                <div style={{ color: q.color, fontSize: '12px', fontWeight: '700' }}>{q.name}</div>
                <div style={{ color: '#94A3B8', fontSize: '10px' }}>{q.pos}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '14px', textAlign: 'center' }}>
            <code style={{ background: '#8B5CF620', color: '#8B5CF6', padding: '4px 10px', borderRadius: '6px', fontSize: '10px' }}>
              WS: insight:new
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AEOAgentFlowDiagram;
