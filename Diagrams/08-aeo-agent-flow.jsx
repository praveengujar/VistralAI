import React from 'react';

const AEOAgentFlowDiagram = () => {
  const agents = [
    {
      step: 1,
      name: 'CrawlerAgent',
      color: '#3B82F6',
      input: 'Website URL',
      process: 'Web crawling + Schema.org extraction',
      output: 'Raw website data'
    },
    {
      step: 2,
      name: 'BrandIntelligence',
      color: '#8B5CF6',
      badge: 'GPT-4o-mini',
      input: 'Raw website data',
      process: 'Extract brand information',
      output: 'Structured brand data'
    },
    {
      step: 3,
      name: 'VibeCheckAgent',
      color: '#EC4899',
      input: 'Brand data',
      process: 'Infer brand personality',
      output: 'Personality traits, archetypes'
    },
    {
      step: 4,
      name: 'CompetitorAgent',
      color: '#F59E0B',
      input: 'Brand data',
      process: 'Discover competitors',
      output: 'Competitor list with analysis'
    },
    {
      step: 5,
      name: 'Create Brand360Profile',
      color: '#10B981',
      input: 'All extracted data',
      process: 'Combine & structure',
      output: 'Complete Brand360 profile'
    },
    {
      step: 6,
      name: 'Generate Prompts',
      color: '#6366F1',
      input: 'Brand360 profile',
      process: 'Create test prompts by category',
      output: 'Navigational, Functional, Comparative, Voice, Adversarial'
    },
    {
      step: 7,
      name: 'PerceptionEvaluatorAgent',
      color: '#14B8A6',
      badge: 'LLM-as-a-Judge',
      input: 'Generated prompts',
      process: 'Query AI platforms, score responses',
      output: 'Perception metrics'
    }
  ];

  const metrics = [
    { name: 'Faithfulness Score', range: '0-100', desc: 'Accuracy to ground truth', color: '#10B981' },
    { name: 'Share of Voice', range: '0-100', desc: 'Brand visibility', color: '#3B82F6' },
    { name: 'Sentiment', range: '-1 to 1', desc: 'Overall sentiment', color: '#F59E0B' },
    { name: 'Voice Alignment', range: '0-100', desc: 'Matches brand tone', color: '#8B5CF6' },
    { name: 'Hallucination Score', range: '0-100', desc: '100 = no hallucinations', color: '#EF4444' }
  ];

  const quadrants = [
    { name: 'DOMINANT', position: 'High Accuracy + High Visibility', color: '#10B981', bg: '#10B98120' },
    { name: 'VULNERABLE', position: 'Low Accuracy + High Visibility', color: '#F59E0B', bg: '#F59E0B20' },
    { name: 'NICHE', position: 'High Accuracy + Low Visibility', color: '#3B82F6', bg: '#3B82F620' },
    { name: 'INVISIBLE', position: 'Low Accuracy + Low Visibility', color: '#EF4444', bg: '#EF444420' }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0A0A12 0%, #12121F 50%, #0A0A12 100%)',
      padding: '40px 24px',
      fontFamily: "'Inter', -apple-system, sans-serif"
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#F8FAFC',
          margin: '0 0 8px 0'
        }}>
          AEO Agent Workflow
        </h1>
        <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
          AI Engine Optimization pipeline from URL to perception metrics
        </p>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Input */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '24px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            borderRadius: '16px',
            padding: '20px 40px',
            textAlign: 'center',
            boxShadow: '0 4px 24px rgba(99, 102, 241, 0.4)'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🌐</div>
            <div style={{ color: 'white', fontWeight: '600', fontSize: '16px' }}>Website URL</div>
            <div style={{ color: '#C7D2FE', fontSize: '12px' }}>User input</div>
          </div>
        </div>

        {/* Orchestrator Badge */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '24px'
        }}>
          <div style={{
            background: '#1E293B',
            borderRadius: '20px',
            padding: '8px 20px',
            border: '1px solid #475569'
          }}>
            <span style={{ color: '#94A3B8', fontSize: '12px' }}>
              Coordinated by <strong style={{ color: '#F8FAFC' }}>MagicImportOrchestrator</strong>
            </span>
          </div>
        </div>

        {/* Vertical Flow Arrow */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '16px'
        }}>
          <div style={{
            width: '2px',
            height: '24px',
            background: 'linear-gradient(to bottom, #6366F1, #3B82F6)'
          }} />
        </div>

        {/* Agent Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {agents.map((agent, idx) => (
            <React.Fragment key={agent.step}>
              <div style={{
                background: '#1A1F2E',
                borderRadius: '16px',
                border: `2px solid ${agent.color}`,
                overflow: 'hidden',
                boxShadow: `0 4px 16px ${agent.color}20`
              }}>
                {/* Agent Header */}
                <div style={{
                  background: `${agent.color}20`,
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: `1px solid ${agent.color}40`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: agent.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '700',
                      fontSize: '14px'
                    }}>
                      {agent.step}
                    </div>
                    <span style={{ color: agent.color, fontWeight: '700', fontSize: '16px' }}>
                      {agent.name}
                    </span>
                    {agent.badge && (
                      <span style={{
                        background: '#0F172A',
                        color: '#94A3B8',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        border: '1px solid #334155'
                      }}>
                        {agent.badge}
                      </span>
                    )}
                  </div>
                </div>

                {/* Agent Details */}
                <div style={{
                  padding: '16px 20px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1.5fr 1fr',
                  gap: '16px'
                }}>
                  <div>
                    <div style={{ color: '#64748B', fontSize: '10px', fontWeight: '600', marginBottom: '4px' }}>
                      INPUT
                    </div>
                    <div style={{ color: '#E2E8F0', fontSize: '12px' }}>{agent.input}</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748B', fontSize: '10px', fontWeight: '600', marginBottom: '4px' }}>
                      PROCESS
                    </div>
                    <div style={{ color: '#E2E8F0', fontSize: '12px' }}>{agent.process}</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748B', fontSize: '10px', fontWeight: '600', marginBottom: '4px' }}>
                      OUTPUT
                    </div>
                    <div style={{ color: agent.color, fontSize: '12px', fontWeight: '500' }}>{agent.output}</div>
                  </div>
                </div>
              </div>

              {/* Connector */}
              {idx < agents.length - 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    width: '2px',
                    height: '24px',
                    background: `linear-gradient(to bottom, ${agent.color}, ${agents[idx + 1].color})`
                  }} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Output Section */}
        <div style={{ marginTop: '40px' }}>
          {/* Metrics */}
          <div style={{
            background: '#1A1F2E',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            border: '1px solid #334155'
          }}>
            <div style={{
              color: '#94A3B8',
              fontSize: '11px',
              fontWeight: '600',
              letterSpacing: '1px',
              marginBottom: '16px'
            }}>
              PERCEPTION METRICS OUTPUT
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '12px'
            }}>
              {metrics.map((metric) => (
                <div key={metric.name} style={{
                  background: '#0F172A',
                  borderRadius: '12px',
                  padding: '16px',
                  borderTop: `3px solid ${metric.color}`,
                  textAlign: 'center'
                }}>
                  <div style={{ color: metric.color, fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
                    {metric.name}
                  </div>
                  <div style={{ color: '#E2E8F0', fontSize: '14px', fontWeight: '700', marginBottom: '4px' }}>
                    {metric.range}
                  </div>
                  <div style={{ color: '#64748B', fontSize: '10px' }}>{metric.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quadrant Classification */}
          <div style={{
            background: '#1A1F2E',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #334155'
          }}>
            <div style={{
              color: '#94A3B8',
              fontSize: '11px',
              fontWeight: '600',
              letterSpacing: '1px',
              marginBottom: '16px'
            }}>
              QUADRANT CLASSIFICATION
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px'
            }}>
              {quadrants.map((q) => (
                <div key={q.name} style={{
                  background: q.bg,
                  borderRadius: '12px',
                  padding: '16px',
                  border: `1px solid ${q.color}40`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: q.color,
                    boxShadow: `0 0 12px ${q.color}`
                  }} />
                  <div>
                    <div style={{ color: q.color, fontSize: '13px', fontWeight: '700' }}>{q.name}</div>
                    <div style={{ color: '#94A3B8', fontSize: '11px' }}>{q.position}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AEOAgentFlowDiagram;
