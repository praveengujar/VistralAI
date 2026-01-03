import React, { useState } from 'react';

const ArchitectureDiagram = () => {
  const [hoveredAgent, setHoveredAgent] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);

  const aiAgents = [
    { id: 'MIO', name: 'MagicImportOrchestrator', icon: '🎭', desc: 'Coordinates all agents', color: '#8B5CF6' },
    { id: 'CA', name: 'CrawlerAgent', icon: '🕷️', desc: 'Web scraping, Schema.org extraction', color: '#3B82F6' },
    { id: 'VCA', name: 'VibeCheckAgent', icon: '✨', desc: 'Brand personality, Tone analysis', color: '#EC4899' },
    { id: 'CMA', name: 'CompetitorAgent', icon: '🎯', desc: 'Competitor discovery, Market positioning', color: '#F59E0B' },
    { id: 'PEA', name: 'ProductExtractorAgent', icon: '📦', desc: 'Products/Services, Pricing extraction', color: '#10B981' },
    { id: 'APA', name: 'AudiencePositioningAgent', icon: '👥', desc: 'Personas generation, Value propositions', color: '#6366F1' },
    { id: 'PGA', name: 'PromptGeneratorAgent', icon: '📝', desc: 'Test prompt creation, Category coverage', color: '#14B8A6' },
    { id: 'PEvA', name: 'PerceptionEvaluatorAgent', icon: '⚖️', desc: 'LLM-as-Judge, Multi-platform scoring', color: '#EF4444' },
    { id: 'CGA', name: 'CorrectionGeneratorAgent', icon: '🔧', desc: 'Fix suggestions, Schema corrections', color: '#78716C' }
  ];

  const apiRoutes = [
    { name: 'Auth Routes', icon: '🔐', paths: '/auth/[...nextauth], /auth/register', color: '#3B82F6' },
    { name: 'Onboarding Routes', icon: '📋', paths: '/onboarding/session, brand, plan, payment, complete', color: '#14B8A6' },
    { name: 'Brand 360 Routes', icon: '🎯', paths: '/brand-360/*, audience, personas, positioning', color: '#10B981' },
    { name: 'AEO Routes', icon: '📊', paths: '/aeo/magic-import, perception-scan, insights, prompts', color: '#8B5CF6' },
    { name: 'Payment Routes', icon: '💳', paths: '/payments/stripe/*, /webhooks/stripe', color: '#EC4899' }
  ];

  const mongoCollections = [
    { name: 'users', icon: '👤', fields: 'email, password, onboardingCompleted' },
    { name: 'sessions', icon: '🔑', fields: 'NextAuth sessions' },
    { name: 'brand360_profiles', icon: '🎯', fields: 'brandIdentity, competitors, products, personas' },
    { name: 'onboarding_sessions', icon: '📋', fields: 'currentStep, completedSteps, selectedTierId' },
    { name: 'onboarding_events', icon: '📊', fields: 'eventType, step, eventData, errorMessage' },
    { name: 'subscriptions', icon: '💳', fields: 'stripeCustomerId, status, currentPeriodEnd' },
    { name: 'perception_scans', icon: '📈', fields: 'platforms, overallScore, quadrantPosition' },
    { name: 'generated_prompts', icon: '📝', fields: 'category, intent, renderedPrompt' },
    { name: 'perception_insights', icon: '💡', fields: 'issueType, severity, recommendation' }
  ];

  const tierInfo = {
    tier1: { name: 'TIER 1: FRONTEND', desc: 'Browser-based React UI (never directly accesses databases or external APIs)', color: '#3B82F6' },
    tier2: { name: 'TIER 2: MID-TIER / BFF', desc: 'Next.js API Routes (handles auth, validation, orchestration)', color: '#8B5CF6' },
    tier3: { name: 'TIER 3: BACKEND', desc: 'Services, Databases, External APIs', color: '#22C55E' }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0C0F1A 0%, #131825 50%, #0C0F1A 100%)', padding: '16px 10px', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#F8FAFC', margin: '0 0 4px 0' }}>VistralAI System Architecture</h1>
        <p style={{ fontSize: '10px', color: '#64748B', margin: '0 0 10px 0' }}>3-Tier Architecture with BFF (Backend for Frontend) Pattern</p>
        
        {/* Tier Legend */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {Object.entries(tierInfo).map(([key, tier]) => (
            <div key={key} onClick={() => setSelectedTier(selectedTier === key ? null : key)} style={{ background: selectedTier === key ? `${tier.color}25` : '#1A1F2E', border: `1px solid ${tier.color}50`, borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{ color: tier.color, fontSize: '9px', fontWeight: '700' }}>{tier.name}</div>
              <div style={{ color: '#64748B', fontSize: '7px', maxWidth: '200px' }}>{tier.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TIER 1: FRONTEND */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div style={{ background: `linear-gradient(135deg, ${tierInfo.tier1.color}08, transparent)`, borderRadius: '12px', border: `2px solid ${tierInfo.tier1.color}40`, padding: '12px', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{ background: tierInfo.tier1.color, color: 'white', fontSize: '9px', fontWeight: '700', padding: '3px 10px', borderRadius: '4px' }}>TIER 1</div>
            <div style={{ color: tierInfo.tier1.color, fontSize: '12px', fontWeight: '700' }}>FRONTEND (Browser)</div>
            <div style={{ marginLeft: 'auto', background: '#FEF3C7', color: '#92400E', fontSize: '7px', fontWeight: '600', padding: '2px 8px', borderRadius: '4px' }}>⚠️ Never directly accesses Tier 3</div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
            <div style={{ background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)', borderRadius: '10px', padding: '12px 28px', textAlign: 'center', boxShadow: '0 4px 20px rgba(59, 130, 246, 0.25)' }}>
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>🌐</div>
              <div style={{ color: 'white', fontWeight: '700', fontSize: '12px' }}>Browser Client</div>
              <div style={{ color: '#93C5FD', fontSize: '9px' }}>React 18 + React Query v5</div>
              <div style={{ color: '#93C5FD', fontSize: '9px' }}>Tailwind CSS</div>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)', borderRadius: '10px', padding: '12px 28px', textAlign: 'center', boxShadow: '0 4px 20px rgba(139, 92, 246, 0.25)' }}>
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>🔌</div>
              <div style={{ color: 'white', fontWeight: '700', fontSize: '12px' }}>WebSocket Client</div>
              <div style={{ color: '#C4B5FD', fontSize: '9px' }}>Socket.io-client</div>
              <div style={{ color: '#C4B5FD', fontSize: '9px' }}>Real-time events</div>
            </div>
          </div>
        </div>

        {/* Tier 1 → Tier 2 Connection */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="40" height="20"><line x1="20" y1="0" x2="20" y2="20" stroke="#3B82F6" strokeWidth="2" /><polygon points="16,14 20,20 24,14" fill="#3B82F6" /></svg>
            <div style={{ background: '#1E293B', borderRadius: '4px', padding: '3px 10px' }}>
              <span style={{ color: '#3B82F6', fontSize: '8px', fontWeight: '600' }}>HTTPS :3000</span>
              <span style={{ color: '#64748B', fontSize: '7px', marginLeft: '6px' }}>REST API + Page requests</span>
            </div>
            <svg width="40" height="20"><line x1="20" y1="0" x2="20" y2="20" stroke="#8B5CF6" strokeWidth="2" strokeDasharray="3 2" /><polygon points="16,14 20,20 24,14" fill="#8B5CF6" /></svg>
            <div style={{ background: '#1E293B', borderRadius: '4px', padding: '3px 10px' }}>
              <span style={{ color: '#8B5CF6', fontSize: '8px', fontWeight: '600' }}>WS :3000</span>
              <span style={{ color: '#64748B', fontSize: '7px', marginLeft: '6px' }}>Real-time events</span>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TIER 2: MID-TIER / BFF */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div style={{ background: `linear-gradient(135deg, ${tierInfo.tier2.color}08, transparent)`, borderRadius: '12px', border: `2px solid ${tierInfo.tier2.color}40`, padding: '12px', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ background: tierInfo.tier2.color, color: 'white', fontSize: '9px', fontWeight: '700', padding: '3px 10px', borderRadius: '4px' }}>TIER 2</div>
            <div style={{ color: tierInfo.tier2.color, fontSize: '12px', fontWeight: '700' }}>MID-TIER / BFF</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '10px' }}>
              <span style={{ fontSize: '16px' }}>▲</span>
              <span style={{ color: '#F8FAFC', fontSize: '10px', fontWeight: '600' }}>Next.js 14 API Routes</span>
            </div>
            <div style={{ color: '#64748B', fontSize: '9px', marginLeft: 'auto' }}>Port 3000 (dev) / 8080 (prod)</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '0.7fr 1fr 1.5fr 0.6fr', gap: '10px' }}>
            
            {/* Presentation Layer */}
            <div style={{ background: '#0F172A', borderRadius: '8px', padding: '10px', border: '1px solid #334155' }}>
              <div style={{ color: '#94A3B8', fontSize: '8px', fontWeight: '600', letterSpacing: '0.5px', marginBottom: '8px' }}>PRESENTATION LAYER</div>
              <div style={{ background: '#1E293B', borderRadius: '5px', padding: '8px', marginBottom: '6px' }}>
                <div style={{ color: '#E2E8F0', fontSize: '9px', fontWeight: '600' }}>App Router Pages</div>
                <div style={{ color: '#64748B', fontSize: '7px', marginTop: '2px' }}>/dashboard, /onboarding</div>
                <div style={{ color: '#64748B', fontSize: '7px' }}>/brand-360, /aeo, /settings</div>
              </div>
              <div style={{ background: '#1E293B', borderRadius: '5px', padding: '8px' }}>
                <div style={{ color: '#E2E8F0', fontSize: '9px', fontWeight: '600' }}>React Components</div>
                <div style={{ color: '#64748B', fontSize: '7px', marginTop: '2px' }}>UI, Charts, Forms</div>
              </div>
            </div>

            {/* API Layer */}
            <div style={{ background: '#0F172A', borderRadius: '8px', padding: '10px', border: '1px solid #F59E0B40' }}>
              <div style={{ color: '#F59E0B', fontSize: '8px', fontWeight: '600', letterSpacing: '0.5px', marginBottom: '8px' }}>API LAYER (/api)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {apiRoutes.map((route) => (
                  <div key={route.name} style={{ background: `${route.color}10`, borderRadius: '4px', padding: '5px 7px', borderLeft: `3px solid ${route.color}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '10px' }}>{route.icon}</span>
                      <span style={{ color: route.color, fontSize: '8px', fontWeight: '600' }}>{route.name}</span>
                    </div>
                    <div style={{ color: '#64748B', fontSize: '6px', marginLeft: '14px', marginTop: '1px' }}>{route.paths}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Service Layer */}
            <div style={{ background: '#0F172A', borderRadius: '8px', padding: '10px', border: '1px solid #8B5CF640' }}>
              <div style={{ color: '#8B5CF6', fontSize: '8px', fontWeight: '600', letterSpacing: '0.5px', marginBottom: '8px' }}>SERVICE LAYER (lib/services)</div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: '8px' }}>
                {/* Core Services */}
                <div>
                  <div style={{ color: '#10B981', fontSize: '7px', fontWeight: '600', marginBottom: '4px' }}>Core Services</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {[
                      { name: 'OnboardingService', icon: '📋', desc: 'Session mgmt, Step validation, Event logging' },
                      { name: 'StripeService', icon: '💳', desc: 'SetupIntent, Subscriptions, Payment methods' },
                      { name: 'SubscriptionService', icon: '📦', desc: 'Trial mgmt, Plan changes, Cancellation' }
                    ].map((svc) => (
                      <div key={svc.name} style={{ background: '#10B98112', borderRadius: '4px', padding: '5px 6px', border: '1px solid #10B98120' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '10px' }}>{svc.icon}</span>
                          <span style={{ color: '#10B981', fontSize: '7px', fontWeight: '600' }}>{svc.name}</span>
                        </div>
                        <div style={{ color: '#64748B', fontSize: '6px', marginLeft: '14px' }}>{svc.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Agent Pipeline */}
                <div>
                  <div style={{ color: '#A78BFA', fontSize: '7px', fontWeight: '600', marginBottom: '4px' }}>AI Agent Pipeline (9 Agents)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '3px' }}>
                    {aiAgents.slice(0, 5).map((agent) => (
                      <div key={agent.id} onMouseEnter={() => setHoveredAgent(agent.id)} onMouseLeave={() => setHoveredAgent(null)} style={{ background: hoveredAgent === agent.id ? `${agent.color}30` : `${agent.color}15`, borderRadius: '4px', padding: '4px 2px', textAlign: 'center', border: `1px solid ${agent.color}35`, cursor: 'pointer', transition: 'all 0.15s' }}>
                        <div style={{ fontSize: '12px' }}>{agent.icon}</div>
                        <div style={{ color: agent.color, fontSize: '6px', fontWeight: '600' }}>{agent.id}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '3px', marginTop: '3px' }}>
                    {aiAgents.slice(5).map((agent) => (
                      <div key={agent.id} onMouseEnter={() => setHoveredAgent(agent.id)} onMouseLeave={() => setHoveredAgent(null)} style={{ background: hoveredAgent === agent.id ? `${agent.color}30` : `${agent.color}15`, borderRadius: '4px', padding: '4px 2px', textAlign: 'center', border: `1px solid ${agent.color}35`, cursor: 'pointer', transition: 'all 0.15s' }}>
                        <div style={{ fontSize: '12px' }}>{agent.icon}</div>
                        <div style={{ color: agent.color, fontSize: '6px', fontWeight: '600' }}>{agent.id}</div>
                      </div>
                    ))}
                  </div>
                  {hoveredAgent && (
                    <div style={{ marginTop: '6px', background: '#1E293B', borderRadius: '4px', padding: '5px 7px', borderLeft: `3px solid ${aiAgents.find(a => a.id === hoveredAgent)?.color}` }}>
                      <div style={{ color: '#E2E8F0', fontSize: '8px', fontWeight: '600' }}>{aiAgents.find(a => a.id === hoveredAgent)?.name}</div>
                      <div style={{ color: '#94A3B8', fontSize: '7px' }}>{aiAgents.find(a => a.id === hoveredAgent)?.desc}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Real-time + Data Access */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ background: '#0F172A', borderRadius: '6px', padding: '8px', border: '1px solid #EC489940', flex: 1 }}>
                <div style={{ color: '#EC4899', fontSize: '8px', fontWeight: '600', marginBottom: '6px' }}>REAL-TIME LAYER</div>
                <div style={{ background: '#EC489920', borderRadius: '4px', padding: '6px', textAlign: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '14px' }}>🔌</span>
                  <div style={{ color: '#F472B6', fontSize: '9px', fontWeight: '600' }}>Socket.io Server</div>
                  <div style={{ color: '#64748B', fontSize: '7px' }}>Port 3000</div>
                </div>
                <div style={{ color: '#94A3B8', fontSize: '7px' }}>• Onboarding Events</div>
                <div style={{ color: '#94A3B8', fontSize: '7px' }}>• Scan Events</div>
              </div>
              <div style={{ background: '#0F172A', borderRadius: '6px', padding: '8px', border: '1px solid #334155' }}>
                <div style={{ color: '#94A3B8', fontSize: '8px', fontWeight: '600', marginBottom: '4px' }}>DATA ACCESS LAYER</div>
                <div style={{ color: '#E2E8F0', fontSize: '7px' }}>• Prisma ORM (Type-safe)</div>
                <div style={{ color: '#E2E8F0', fontSize: '7px' }}>• Cache Layer (withCache)</div>
                <div style={{ color: '#E2E8F0', fontSize: '7px' }}>• DB Operations</div>
              </div>
            </div>
          </div>

          {/* Middleware Bar */}
          <div style={{ marginTop: '10px', background: 'linear-gradient(90deg, #0EA5E9 0%, #06B6D4 100%)', borderRadius: '6px', padding: '6px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px' }}>🛡️</span>
              <span style={{ color: 'white', fontSize: '10px', fontWeight: '700' }}>MIDDLEWARE STACK</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['Auth', 'RateLimit', 'ErrorHandler'].map((mw, idx) => (
                <React.Fragment key={mw}>
                  <span style={{ color: 'white', fontSize: '9px', background: 'rgba(255,255,255,0.2)', padding: '3px 8px', borderRadius: '6px' }}>{mw}</span>
                  {idx < 2 && <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '9px' }}>→</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Tier 2 → Tier 3 Connection */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4px 0' }}>
          <svg width="40" height="16"><line x1="20" y1="0" x2="20" y2="16" stroke="#22C55E" strokeWidth="2" /><polygon points="16,10 20,16 24,10" fill="#22C55E" /></svg>
          <div style={{ background: '#1E293B', borderRadius: '4px', padding: '3px 10px', marginLeft: '10px' }}>
            <span style={{ color: '#22C55E', fontSize: '8px', fontWeight: '600' }}>TCP/HTTP/AMQP/HTTPS</span>
            <span style={{ color: '#64748B', fontSize: '7px', marginLeft: '6px' }}>Database + External API calls</span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TIER 3: BACKEND */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div style={{ background: `linear-gradient(135deg, ${tierInfo.tier3.color}06, transparent)`, borderRadius: '12px', border: `2px solid ${tierInfo.tier3.color}40`, padding: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ background: tierInfo.tier3.color, color: 'white', fontSize: '9px', fontWeight: '700', padding: '3px 10px', borderRadius: '4px' }}>TIER 3</div>
            <div style={{ color: tierInfo.tier3.color, fontSize: '12px', fontWeight: '700' }}>BACKEND (Services, Databases, External APIs)</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 0.9fr', gap: '10px', marginBottom: '10px' }}>
            
            {/* Databases */}
            <div style={{ background: '#1A1F2E', borderRadius: '8px', padding: '10px', border: '1px solid #22C55E30' }}>
              <div style={{ color: '#22C55E', fontSize: '9px', fontWeight: '600', marginBottom: '8px' }}>DATABASES</div>
              
              {/* MongoDB */}
              <div style={{ background: '#0F172A', borderRadius: '6px', padding: '8px', marginBottom: '8px', border: '1px solid #22C55E20' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px' }}>🍃</span>
                  <span style={{ color: '#22C55E', fontSize: '10px', fontWeight: '600' }}>MongoDB 7.0</span>
                  <span style={{ color: '#64748B', fontSize: '8px' }}>:27017</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3px' }}>
                  {mongoCollections.map((col) => (
                    <div key={col.name} style={{ background: '#22C55E10', borderRadius: '3px', padding: '3px', textAlign: 'center' }}>
                      <span style={{ fontSize: '8px' }}>{col.icon}</span>
                      <div style={{ color: '#4ADE80', fontSize: '6px', fontWeight: '500' }}>{col.name}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Redis */}
              <div style={{ background: '#0F172A', borderRadius: '6px', padding: '8px', border: '1px solid #DC262620' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px' }}>⚡</span>
                  <span style={{ color: '#DC2626', fontSize: '10px', fontWeight: '600' }}>Redis 7.0</span>
                  <span style={{ color: '#64748B', fontSize: '8px' }}>:6379</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '3px' }}>
                  {[
                    { name: 'Session Cache', icon: '🔐', ttl: 'TTL: 24h' },
                    { name: 'Profile Cache', icon: '📦', ttl: 'TTL: 5min' },
                    { name: 'Rate Limit', icon: '⏱️', ttl: '100 req/min' },
                    { name: 'Job Queue', icon: '📋', ttl: 'Bull queues' }
                  ].map((cache) => (
                    <div key={cache.name} style={{ background: '#DC262610', borderRadius: '3px', padding: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span style={{ fontSize: '8px' }}>{cache.icon}</span>
                        <span style={{ color: '#FCA5A5', fontSize: '7px', fontWeight: '500' }}>{cache.name}</span>
                      </div>
                      <div style={{ color: '#64748B', fontSize: '6px', marginLeft: '11px' }}>{cache.ttl}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Firecrawl Stack */}
            <div style={{ background: '#1A1F2E', borderRadius: '8px', padding: '10px', border: '2px solid #F9731650' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '16px' }}>🕷️</span>
                <div>
                  <div style={{ color: '#F97316', fontSize: '11px', fontWeight: '700' }}>FIRECRAWL OPEN SOURCE STACK</div>
                  <div style={{ color: '#64748B', fontSize: '8px' }}>Self-Hosted Web Scraping with JS Rendering</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {/* API Service */}
                <div style={{ background: '#0F172A', borderRadius: '6px', padding: '8px' }}>
                  <div style={{ color: '#F97316', fontSize: '8px', fontWeight: '600', marginBottom: '6px' }}>API SERVICE</div>
                  <div style={{ background: '#F9731618', borderRadius: '4px', padding: '6px', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '12px' }}>🕷️</span>
                      <div>
                        <div style={{ color: '#FB923C', fontSize: '9px', fontWeight: '600' }}>Firecrawl API</div>
                        <div style={{ color: '#64748B', fontSize: '7px' }}>Port 3002 → 3000</div>
                      </div>
                    </div>
                    <div style={{ color: '#94A3B8', fontSize: '7px', marginTop: '3px' }}>/v1/crawl, /v1/scrape, /v1/map</div>
                  </div>
                  <div style={{ background: '#F59E0B18', borderRadius: '4px', padding: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '12px' }}>👷</span>
                      <div>
                        <div style={{ color: '#FBBF24', fontSize: '9px', fontWeight: '600' }}>Crawl Workers</div>
                        <div style={{ color: '#64748B', fontSize: '7px' }}>NUM_WORKERS: 4 (parallel)</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Data Layer + Browser */}
                <div style={{ background: '#0F172A', borderRadius: '6px', padding: '8px' }}>
                  <div style={{ color: '#94A3B8', fontSize: '8px', fontWeight: '600', marginBottom: '6px' }}>DATA + BROWSER</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginBottom: '4px' }}>
                    <div style={{ background: '#33679118', borderRadius: '4px', padding: '5px' }}>
                      <span style={{ fontSize: '10px' }}>🐘</span>
                      <div style={{ color: '#60A5FA', fontSize: '8px', fontWeight: '500' }}>PostgreSQL 17</div>
                      <div style={{ color: '#64748B', fontSize: '6px' }}>:5432 NUQ Queue</div>
                    </div>
                    <div style={{ background: '#FF660018', borderRadius: '4px', padding: '5px' }}>
                      <span style={{ fontSize: '10px' }}>🐰</span>
                      <div style={{ color: '#FB923C', fontSize: '8px', fontWeight: '500' }}>RabbitMQ 3</div>
                      <div style={{ color: '#64748B', fontSize: '6px' }}>:5672 Worker Queue</div>
                    </div>
                  </div>
                  <div style={{ background: '#22C55E18', borderRadius: '4px', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ fontSize: '12px' }}>🎭</span>
                      <div>
                        <div style={{ color: '#22C55E', fontSize: '8px', fontWeight: '600' }}>Playwright Service</div>
                        <div style={{ color: '#64748B', fontSize: '6px' }}>Internal :3000 • Headless Chrome</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <svg width="16" height="8"><line x1="0" y1="4" x2="10" y2="4" stroke="#22C55E" strokeWidth="1.5" /><polygon points="10,1 16,4 10,7" fill="#22C55E" /></svg>
                      <span style={{ fontSize: '10px' }}>🌐</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* External Services */}
            <div style={{ background: '#1A1F2E', borderRadius: '8px', padding: '10px', border: '1px solid #F59E0B30' }}>
              <div style={{ color: '#F59E0B', fontSize: '9px', fontWeight: '600', marginBottom: '8px' }}>EXTERNAL SERVICES</div>
              
              {/* AI Providers */}
              <div style={{ marginBottom: '8px' }}>
                <div style={{ color: '#64748B', fontSize: '7px', fontWeight: '500', marginBottom: '4px' }}>AI/LLM Providers</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '3px' }}>
                  {[
                    { name: 'OpenAI', icon: '🤖', desc: 'GPT-4o-mini', color: '#10B981' },
                    { name: 'Anthropic', icon: '🧠', desc: 'Claude 3', color: '#EA580C' },
                    { name: 'Gemini', icon: '💎', desc: 'Google', color: '#4285F4' },
                    { name: 'Perplexity', icon: '🔍', desc: 'AI', color: '#8B5CF6' }
                  ].map((svc) => (
                    <div key={svc.name} style={{ background: `${svc.color}12`, borderRadius: '4px', padding: '4px 6px', borderLeft: `2px solid ${svc.color}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span style={{ fontSize: '10px' }}>{svc.icon}</span>
                        <span style={{ color: svc.color, fontSize: '8px', fontWeight: '600' }}>{svc.name}</span>
                      </div>
                      <div style={{ color: '#64748B', fontSize: '6px', marginLeft: '13px' }}>{svc.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payments */}
              <div>
                <div style={{ color: '#64748B', fontSize: '7px', fontWeight: '500', marginBottom: '4px' }}>Payment Providers</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {[
                    { name: 'Stripe', icon: '💳', desc: 'Subscriptions, Apple Pay, Google Pay', color: '#6366F1' },
                    { name: 'PayPal', icon: '🅿️', desc: 'Alternative payments', color: '#003087' }
                  ].map((svc) => (
                    <div key={svc.name} style={{ background: `${svc.color}12`, borderRadius: '4px', padding: '4px 6px', borderLeft: `2px solid ${svc.color}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span style={{ fontSize: '10px' }}>{svc.icon}</span>
                        <span style={{ color: svc.color, fontSize: '8px', fontWeight: '600' }}>{svc.name}</span>
                      </div>
                      <div style={{ color: '#64748B', fontSize: '6px', marginLeft: '13px' }}>{svc.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* GCP Infrastructure */}
          <div style={{ background: 'linear-gradient(135deg, #4285F412, #34A85308)', borderRadius: '8px', padding: '10px', border: '1px solid #4285F430' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ width: '20px', height: '20px', background: 'linear-gradient(135deg, #4285F4 25%, #34A853 25%, #34A853 50%, #FBBC05 50%, #FBBC05 75%, #EA4335 75%)', borderRadius: '4px' }} />
              <div style={{ color: '#F8FAFC', fontSize: '11px', fontWeight: '600' }}>INFRASTRUCTURE (GCP)</div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { name: 'Cloud Run', icon: '☁️', desc: '0-20 instances, 2Gi/2CPU' },
                { name: 'Secret Manager', icon: '🔒', desc: 'API keys, DB credentials' },
                { name: 'Memorystore', icon: '📦', desc: 'Redis 7.0, 1GB' },
                { name: 'Cloud Logging', icon: '📊', desc: 'Structured logs' },
                { name: 'VPC Connector', icon: '🔗', desc: 'Private networking' }
              ].map((svc) => (
                <div key={svc.name} style={{ background: '#0F172A', borderRadius: '5px', padding: '6px 10px', border: '1px solid #334155', flex: '1 1 130px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '11px' }}>{svc.icon}</span>
                    <span style={{ color: '#E2E8F0', fontSize: '9px', fontWeight: '600' }}>{svc.name}</span>
                  </div>
                  <div style={{ color: '#64748B', fontSize: '7px', marginLeft: '15px' }}>{svc.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Agent Pipeline Flow */}
        <div style={{ marginTop: '12px', background: '#1A1F2E', borderRadius: '10px', padding: '12px', border: '1px solid #8B5CF640' }}>
          <div style={{ color: '#8B5CF6', fontSize: '10px', fontWeight: '600', letterSpacing: '0.5px', marginBottom: '10px', textAlign: 'center' }}>AI AGENT PIPELINE FLOW (MagicImportOrchestrator)</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '6px' }}>
            {[
              { step: '1', agent: 'CrawlerAgent', icon: '🕷️', target: 'Firecrawl', color: '#3B82F6' },
              { step: '2', agent: 'VibeCheckAgent', icon: '✨', target: 'OpenAI', color: '#EC4899' },
              { step: '3', agent: 'CompetitorAgent', icon: '🎯', target: 'OpenAI', color: '#F59E0B' },
              { step: '4', agent: 'ProductExtractor', icon: '📦', target: 'OpenAI', color: '#10B981' },
              { step: '5', agent: 'AudiencePos', icon: '👥', target: 'OpenAI', color: '#6366F1' }
            ].map((item, idx, arr) => (
              <React.Fragment key={item.step}>
                <div style={{ background: '#0F172A', borderRadius: '6px', padding: '8px 10px', textAlign: 'center', minWidth: '90px', border: `1px solid ${item.color}30` }}>
                  <div style={{ fontSize: '16px', marginBottom: '2px' }}>{item.icon}</div>
                  <div style={{ color: item.color, fontSize: '8px', fontWeight: '600' }}>{item.step}. {item.agent}</div>
                  <div style={{ color: '#64748B', fontSize: '7px' }}>→ {item.target}</div>
                </div>
                {idx < arr.length - 1 && (
                  <svg width="20" height="10" viewBox="0 0 20 10"><line x1="0" y1="5" x2="14" y2="5" stroke="#8B5CF6" strokeWidth="2" /><polygon points="14,2 20,5 14,8" fill="#8B5CF6" /></svg>
                )}
              </React.Fragment>
            ))}
            <svg width="20" height="10" viewBox="0 0 20 10"><line x1="0" y1="5" x2="14" y2="5" stroke="#22C55E" strokeWidth="2" /><polygon points="14,2 20,5 14,8" fill="#22C55E" /></svg>
            <div style={{ background: '#22C55E18', borderRadius: '6px', padding: '8px 12px', textAlign: 'center', border: '1px solid #22C55E40' }}>
              <span style={{ fontSize: '14px' }}>🍃</span>
              <div style={{ color: '#22C55E', fontSize: '8px', fontWeight: '600' }}>brand360_profiles</div>
              <div style={{ color: '#64748B', fontSize: '7px' }}>MongoDB</div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {[
            { type: 'Tier 1→2', color: '#3B82F6', label: 'HTTPS/WS :3000' },
            { type: 'Tier 2→3', color: '#22C55E', label: 'TCP/HTTP/AMQP' },
            { type: 'Firecrawl', color: '#F97316', label: 'Internal stack' },
            { type: 'External API', color: '#F59E0B', label: 'HTTPS calls' },
            { type: 'Real-time', color: '#EC4899', dashed: true, label: 'Socket events' }
          ].map((item) => (
            <div key={item.type} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '14px', height: '2px', background: item.color, borderStyle: item.dashed ? 'dashed' : 'solid' }} />
              <span style={{ color: '#94A3B8', fontSize: '8px', fontWeight: '500' }}>{item.type}</span>
              <span style={{ color: '#64748B', fontSize: '7px' }}>({item.label})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ArchitectureDiagram;
