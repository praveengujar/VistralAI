import React, { useState } from 'react';

const APIRouteDiagram = () => {
  const [expandedGroups, setExpandedGroups] = useState({
    middleware: true, auth: true, brand360: true, aeo: true, user: true,
    onboarding: true, payments: true, admin: true, other: true
  });

  const toggleGroup = (group) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const middlewareStack = [
    { name: 'withErrorHandler()', desc: 'Standardized JSON error responses' },
    { name: 'withAuth()', desc: 'Session validation wrapper' },
    { name: 'withRateLimit()', desc: 'Rate limiting (100 req/min default)' },
    { name: 'successResponse() / errorResponse()', desc: 'Response helpers' }
  ];

  const routeGroups = [
    {
      id: 'auth', name: 'AUTHENTICATION', color: '#3B82F6', bgColor: '#1E3A5F',
      routes: [
        { method: 'ALL', path: '/api/auth/[...nextauth]', desc: 'NextAuth handler (credentials, Google, GitHub)' },
        { method: 'POST', path: '/api/auth/register', desc: 'User registration with validation' }
      ]
    },
    {
      id: 'brand360', name: 'BRAND 360', color: '#10B981', bgColor: '#134E3A',
      routes: [
        { method: 'GET/POST', path: '/api/brand-360', desc: 'Complete brand data / Create profile' },
        { method: 'CRUD', path: '/api/brand-360/identity', desc: 'Brand identity (mission, vision, values)' },
        { method: 'CRUD', path: '/api/brand-360/products', desc: 'Products with pricing' },
        { method: 'CRUD', path: '/api/brand-360/competitors', desc: 'Competitors with threat levels' },
        { method: 'CRUD', path: '/api/brand-360/market-position', desc: 'Market position' },
        { method: 'POST', path: '/api/brand-360/analyze-website', desc: 'AI website analysis (GPT-4o-mini)' },
        { method: 'POST', path: '/api/brand-360/upload', desc: 'Document upload & processing' },
        { method: 'POST', path: '/api/brand-360/catalog/upload', desc: 'Product catalog CSV/Excel import' }
      ]
    },
    {
      id: 'aeo', name: 'AEO ENGINE', color: '#8B5CF6', bgColor: '#4C1D95',
      routes: [
        { method: 'POST', path: '/api/aeo/magic-import', desc: 'One-click brand extraction from URL' },
        { method: 'GET/POST', path: '/api/aeo/perception-scan', desc: 'Start scan / List scans' },
        { method: 'GET', path: '/api/aeo/perception-scan/[scanId]', desc: 'Scan results with metrics' },
        { method: 'CRUD', path: '/api/aeo/insights', desc: 'Perception insights' },
        { method: 'GET', path: '/api/aeo/insights/[insightId]', desc: 'Single insight details' },
        { method: 'CRUD', path: '/api/aeo/corrections', desc: 'Correction workflow' },
        { method: 'GET', path: '/api/aeo/corrections/[workflowId]', desc: 'Workflow details' },
        { method: 'CRUD', path: '/api/aeo/prompts', desc: 'Prompt management (5 categories)' },
        { method: 'POST', path: '/api/aeo/prompts/generate', desc: 'AI prompt generation' },
        { method: 'GET', path: '/api/aeo/reports/summary', desc: 'Dashboard summary report' },
        { method: 'POST', path: '/api/aeo/reports/export', desc: 'Export to PDF/CSV' },
        { method: 'POST', path: '/api/aeo/compare-scans', desc: 'Compare two scans side-by-side' }
      ]
    },
    {
      id: 'user', name: 'USER', color: '#F97316', bgColor: '#7C2D12',
      routes: [
        { method: 'GET/PUT', path: '/api/user/profile', desc: 'User profile' },
        { method: 'PUT', path: '/api/user/password', desc: 'Password change with validation' },
        { method: 'GET/DEL', path: '/api/user/sessions', desc: 'Active session management' },
        { method: 'GET', path: '/api/user/mfa', desc: 'MFA status check' },
        { method: 'POST', path: '/api/user/mfa/setup', desc: 'Generate TOTP secret + QR code' },
        { method: 'POST', path: '/api/user/mfa/verify', desc: 'Verify TOTP code' }
      ]
    },
    {
      id: 'onboarding', name: 'ONBOARDING', color: '#14B8A6', bgColor: '#134E4A',
      routes: [
        { method: 'GET/POST', path: '/api/onboarding/session', desc: 'Onboarding session management' },
        { method: 'POST', path: '/api/onboarding/brand', desc: 'Brand setup with Magic Import' },
        { method: 'POST', path: '/api/onboarding/plan', desc: 'Plan selection (Monitor/Growth/Dominance)' },
        { method: 'POST', path: '/api/onboarding/payment', desc: 'Payment processing' },
        { method: 'POST', path: '/api/onboarding/complete', desc: 'Complete onboarding flow' },
        { method: 'GET', path: '/api/onboarding/status', desc: 'Onboarding completion status' },
        { method: 'POST', path: '/api/onboarding/analyze', desc: 'Website URL analysis' }
      ]
    },
    {
      id: 'payments', name: 'PAYMENTS', color: '#EC4899', bgColor: '#831843',
      routes: [
        { method: 'POST', path: '/api/payments/stripe/create-setup-intent', desc: 'Create Stripe SetupIntent' },
        { method: 'POST', path: '/api/subscription', desc: 'Create subscription (15-day trial)' },
        { method: 'GET', path: '/api/subscription/status', desc: 'Subscription status' },
        { method: 'POST', path: '/api/subscription/cancel', desc: 'Cancel subscription' },
        { method: 'POST', path: '/api/webhooks/stripe', desc: 'Stripe webhook handler' }
      ]
    },
    {
      id: 'admin', name: 'ADMIN', color: '#EF4444', bgColor: '#7F1D1D',
      routes: [
        { method: 'GET', path: '/api/admin/queue-stats', desc: 'Bull queue statistics' },
        { method: 'GET', path: '/api/admin/review-queue', desc: 'Admin review dashboard' }
      ]
    },
    {
      id: 'other', name: 'OTHER', color: '#6B7280', bgColor: '#374151',
      routes: [
        { method: 'GET', path: '/api/health', desc: 'Health check endpoint' },
        { method: 'GET', path: '/api/brand-profile', desc: 'Legacy brand profile' },
        { method: 'GET', path: '/api/reports/brand-story', desc: 'Brand story narrative report' },
        { method: 'GET', path: '/api/debug/db-dump', desc: 'Database debug (dev only)' }
      ]
    }
  ];

  const totalRoutes = routeGroups.reduce((acc, group) => acc + group.routes.length, 0);

  const getMethodColor = (method) => {
    if (method.includes('GET')) return '#22C55E';
    if (method.includes('POST')) return '#3B82F6';
    if (method.includes('PUT')) return '#F59E0B';
    if (method.includes('DEL')) return '#EF4444';
    if (method.includes('CRUD')) return '#8B5CF6';
    return '#6B7280';
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)', padding: '40px 24px', fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#F8FAFC', margin: '0 0 8px 0' }}>VistralAI API Routes</h1>
        <p style={{ fontSize: '14px', color: '#94A3B8', margin: 0 }}>{totalRoutes} endpoints across {routeGroups.length} modules</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <div style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', borderRadius: '12px', padding: '16px 32px', boxShadow: '0 4px 24px rgba(99, 102, 241, 0.4)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
          <span style={{ color: 'white', fontWeight: '600', fontSize: '16px' }}>Client</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}><div style={{ width: '2px', height: '24px', background: 'linear-gradient(to bottom, #6366F1, #475569)' }} /></div>

      <div style={{ maxWidth: '1400px', margin: '0 auto 24px', background: 'linear-gradient(90deg, #0EA5E9 0%, #06B6D4 100%)', borderRadius: '12px', padding: '16px 24px', boxShadow: '0 4px 24px rgba(14, 165, 233, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            <span style={{ color: 'white', fontWeight: '700', fontSize: '14px', letterSpacing: '1px' }}>MIDDLEWARE LAYER</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {middlewareStack.map((mw) => (<div key={mw.name} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '6px 12px' }}><code style={{ color: 'white', fontSize: '11px', fontWeight: '500' }}>{mw.name}</code></div>))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}><div style={{ width: '2px', height: '24px', background: '#475569' }} /></div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', maxWidth: '1400px', margin: '0 auto 24px' }}>
        {routeGroups.map((group) => (
          <div key={group.id} style={{ background: group.bgColor, borderRadius: '12px', border: `1px solid ${group.color}40`, overflow: 'hidden' }}>
            <button onClick={() => toggleGroup(group.id)} style={{ width: '100%', padding: '14px 20px', background: `${group.color}20`, border: 'none', borderBottom: `1px solid ${group.color}40`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: group.color, boxShadow: `0 0 12px ${group.color}` }} />
                <span style={{ color: group.color, fontWeight: '700', fontSize: '13px', letterSpacing: '1px' }}>{group.name}</span>
                <span style={{ color: '#94A3B8', fontSize: '12px', background: '#1E293B', padding: '2px 8px', borderRadius: '10px' }}>{group.routes.length}</span>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={group.color} strokeWidth="2" style={{ transform: expandedGroups[group.id] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9" /></svg>
            </button>
            {expandedGroups[group.id] && (
              <div style={{ padding: '12px' }}>
                {group.routes.map((route, idx) => (
                  <div key={idx} style={{ padding: '10px 12px', marginBottom: idx < group.routes.length - 1 ? '8px' : 0, background: '#0F172A80', borderRadius: '8px', borderLeft: `3px solid ${group.color}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ background: getMethodColor(route.method), color: 'white', fontSize: '9px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>{route.method}</span>
                      <code style={{ color: '#E2E8F0', fontSize: '12px' }}>{route.path}</code>
                    </div>
                    <span style={{ color: '#64748B', fontSize: '11px' }}>{route.desc}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto 32px', background: 'linear-gradient(90deg, #DC2626 0%, #EF4444 100%)', borderRadius: '12px', padding: '16px 24px', boxShadow: '0 4px 24px rgba(220, 38, 38, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
            <span style={{ color: 'white', fontWeight: '700', fontSize: '14px', letterSpacing: '1px' }}>REDIS CACHING + BULL QUEUE</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {['5 min TTL default', 'Cache invalidation on mutations', 'Bull Queue for async jobs', 'In-memory fallback'].map((item) => (<div key={item} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '6px 12px' }}><span style={{ color: 'white', fontSize: '11px' }}>{item}</span></div>))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default APIRouteDiagram;
