import React from 'react';

const DataFlowDiagram = () => {
  const dataSources = [
    { name: 'Website URL', icon: '🌐', color: '#3B82F6' },
    { name: 'CSV Upload', icon: '📊', color: '#10B981' },
    { name: 'Manual Entry', icon: '✏️', color: '#8B5CF6' },
    { name: 'OAuth Providers', icon: '🔐', color: '#F59E0B' }
  ];

  const processingLayers = [
    {
      name: 'Web Crawling',
      color: '#3B82F6',
      items: [
        { name: 'Firecrawl Service', desc: 'Primary crawler', primary: true },
        { name: 'WebCrawler', desc: 'Fallback', primary: false }
      ]
    },
    {
      name: 'AI Processing',
      color: '#8B5CF6',
      items: [
        { name: 'BrandIntelligence', desc: 'GPT-4o-mini' },
        { name: 'VibeCheckAgent', desc: 'Personality inference' },
        { name: 'CompetitorAgent', desc: 'Competitor discovery' },
        { name: 'PerceptionEvaluator', desc: 'LLM-as-a-Judge' }
      ]
    },
    {
      name: 'Job Queue',
      color: '#F59E0B',
      items: [
        { name: 'Bull Queue', desc: 'Task orchestration' },
        { name: 'Redis', desc: 'Queue backend' }
      ]
    }
  ];

  const storageCollections = [
    { name: 'users', color: '#3B82F6' },
    { name: 'brand_profiles', color: '#10B981' },
    { name: 'brand360_profiles', color: '#8B5CF6' },
    { name: 'products', color: '#F59E0B' },
    { name: 'perception_scans', color: '#EC4899' },
    { name: 'ai_perception_results', color: '#14B8A6' }
  ];

  const outputs = [
    { name: 'Dashboard UI', icon: '📈', color: '#3B82F6' },
    { name: 'Reports', icon: '📄', color: '#10B981' },
    { name: 'API Responses', icon: '🔌', color: '#8B5CF6' }
  ];

  const dataFlows = [
    { from: 'Website URL', to: 'Firecrawl', color: '#3B82F6' },
    { from: 'Firecrawl', to: 'BrandIntelligence', color: '#3B82F6' },
    { from: 'BrandIntelligence', to: 'brand360_profiles', color: '#8B5CF6' },
    { from: 'CSV Upload', to: 'products', color: '#10B981' },
    { from: 'Manual Entry', to: 'brand_profiles', color: '#8B5CF6' },
    { from: 'OAuth', to: 'users', color: '#F59E0B' },
    { from: 'VibeCheckAgent', to: 'brand360_profiles', color: '#EC4899' },
    { from: 'CompetitorAgent', to: 'brand360_profiles', color: '#14B8A6' },
    { from: 'PerceptionEvaluator', to: 'ai_perception_results', color: '#8B5CF6' },
    { from: 'ai_perception_results', to: 'perception_scans', color: '#F59E0B' }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0A0E17 0%, #131B2E 50%, #0A0E17 100%)',
      padding: '40px 24px',
      fontFamily: "'Inter', -apple-system, sans-serif"
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#F8FAFC',
          margin: '0 0 8px 0'
        }}>
          Data Flow Architecture
        </h1>
        <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
          How data moves through VistralAI from ingestion to output
        </p>
      </div>

      {/* Main Flow Layout */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '180px 1fr 200px 180px',
        gap: '32px',
        alignItems: 'stretch'
      }}>
        
        {/* Column 1: Data Sources */}
        <div>
          <div style={{
            color: '#64748B',
            fontSize: '11px',
            fontWeight: '600',
            letterSpacing: '1px',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            DATA SOURCES
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {dataSources.map((source) => (
              <div key={source.name} style={{
                background: `${source.color}15`,
                border: `1px solid ${source.color}40`,
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                position: 'relative'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>{source.icon}</div>
                <div style={{ color: source.color, fontSize: '12px', fontWeight: '600' }}>
                  {source.name}
                </div>
                {/* Arrow out */}
                <div style={{
                  position: 'absolute',
                  right: '-24px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '24px',
                  height: '2px',
                  background: `linear-gradient(to right, ${source.color}, ${source.color}40)`
                }}>
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '-4px',
                    width: 0,
                    height: 0,
                    borderTop: '5px solid transparent',
                    borderBottom: '5px solid transparent',
                    borderLeft: `8px solid ${source.color}40`
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Processing Layer */}
        <div>
          <div style={{
            color: '#64748B',
            fontSize: '11px',
            fontWeight: '600',
            letterSpacing: '1px',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            PROCESSING LAYER
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {processingLayers.map((layer) => (
              <div key={layer.name} style={{
                background: '#1A1F2E',
                borderRadius: '12px',
                border: `1px solid ${layer.color}30`,
                overflow: 'hidden'
              }}>
                <div style={{
                  background: `${layer.color}20`,
                  padding: '10px 16px',
                  borderBottom: `1px solid ${layer.color}30`
                }}>
                  <span style={{
                    color: layer.color,
                    fontSize: '12px',
                    fontWeight: '600',
                    letterSpacing: '0.5px'
                  }}>
                    {layer.name}
                  </span>
                </div>
                <div style={{ padding: '12px' }}>
                  {layer.items.map((item, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      marginBottom: idx < layer.items.length - 1 ? '8px' : 0,
                      background: item.primary ? `${layer.color}10` : '#0F172A60',
                      borderRadius: '8px',
                      borderLeft: item.primary ? `3px solid ${layer.color}` : 'none'
                    }}>
                      <span style={{ color: '#E2E8F0', fontSize: '12px', fontWeight: '500' }}>
                        {item.name}
                      </span>
                      <span style={{ color: '#64748B', fontSize: '10px' }}>
                        {item.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Data Storage */}
        <div>
          <div style={{
            color: '#64748B',
            fontSize: '11px',
            fontWeight: '600',
            letterSpacing: '1px',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            DATA STORAGE
          </div>
          <div style={{
            background: '#1A1F2E',
            borderRadius: '12px',
            border: '1px solid #22C55E30',
            padding: '16px'
          }}>
            {/* MongoDB Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '1px solid #334155'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                background: '#22C55E',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px'
              }}>
                🍃
              </div>
              <span style={{ color: '#22C55E', fontSize: '12px', fontWeight: '600' }}>
                MongoDB
              </span>
            </div>
            {/* Collections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {storageCollections.map((col) => (
                <div key={col.name} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  background: '#0F172A60',
                  borderRadius: '6px',
                  position: 'relative'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: col.color
                  }} />
                  <code style={{ color: '#E2E8F0', fontSize: '11px' }}>{col.name}</code>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column 4: Output */}
        <div>
          <div style={{
            color: '#64748B',
            fontSize: '11px',
            fontWeight: '600',
            letterSpacing: '1px',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            OUTPUT
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {outputs.map((output) => (
              <div key={output.name} style={{
                background: `${output.color}15`,
                border: `1px solid ${output.color}40`,
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                position: 'relative'
              }}>
                {/* Arrow in */}
                <div style={{
                  position: 'absolute',
                  left: '-24px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '24px',
                  height: '2px',
                  background: `linear-gradient(to right, ${output.color}40, ${output.color})`
                }} />
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>{output.icon}</div>
                <div style={{ color: output.color, fontSize: '12px', fontWeight: '600' }}>
                  {output.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Data Flow Legend */}
      <div style={{
        maxWidth: '1000px',
        margin: '48px auto 0',
        background: '#1A1F2E',
        borderRadius: '12px',
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
          KEY DATA FLOWS
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px'
        }}>
          {[
            { flow: 'Website URL → Firecrawl → BrandIntelligence → brand360_profiles', color: '#3B82F6' },
            { flow: 'CSV Upload → products collection', color: '#10B981' },
            { flow: 'Manual Entry → brand_profiles', color: '#8B5CF6' },
            { flow: 'OAuth → users collection', color: '#F59E0B' },
            { flow: 'VibeCheckAgent → brand360_profiles (personality)', color: '#EC4899' },
            { flow: 'CompetitorAgent → brand360_profiles (competitors)', color: '#14B8A6' },
            { flow: 'brand360_profiles → PerceptionEvaluator → ai_perception_results', color: '#8B5CF6' },
            { flow: 'MongoDB → Dashboard / Reports / API', color: '#22C55E' }
          ].map((item, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px',
              background: '#0F172A60',
              borderRadius: '6px'
            }}>
              <div style={{
                width: '24px',
                height: '2px',
                background: item.color,
                flexShrink: 0
              }} />
              <span style={{ color: '#94A3B8', fontSize: '11px' }}>{item.flow}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DataFlowDiagram;
