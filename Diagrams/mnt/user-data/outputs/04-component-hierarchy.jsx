import React, { useState } from 'react';

const ComponentHierarchyDiagram = () => {
  const [expandedNodes, setExpandedNodes] = useState({
    root: true, providers: true, auth: true, dashboard: true, brand360: false,
    aeo: false, review: false, settings: false, onboarding: false, shared: false
  });

  const toggleNode = (id) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'layout': return '#6366F1';
      case 'page': return '#3B82F6';
      case 'component': return '#64748B';
      case 'provider': return '#8B5CF6';
      case 'group': return '#10B981';
      default: return '#64748B';
    }
  };

  const TreeNode = ({ node, depth = 0, parentColor }) => {
    const nodeColor = node.color || parentColor || getTypeColor(node.type);
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = node.id ? expandedNodes[node.id] : true;

    return (
      <div style={{ marginLeft: depth > 0 ? '20px' : 0 }}>
        <div onClick={() => node.id && hasChildren && toggleNode(node.id)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', marginBottom: '4px', background: node.type === 'group' ? `${nodeColor}15` : '#1E293B', borderRadius: '8px', border: `1px solid ${nodeColor}30`, cursor: hasChildren && node.id ? 'pointer' : 'default', transition: 'all 0.2s' }}>
          {hasChildren && node.id && (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={nodeColor} strokeWidth="2" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}><polyline points="9 18 15 12 9 6" /></svg>)}
          {!hasChildren && node.id && <div style={{ width: '14px' }} />}
          <span style={{ color: node.type === 'group' ? nodeColor : '#E2E8F0', fontWeight: node.type === 'group' || node.type === 'page' ? '600' : '400', fontSize: node.type === 'group' ? '12px' : '11px', flex: 1 }}>{node.name}</span>
          <span style={{ fontSize: '9px', color: nodeColor, background: `${nodeColor}20`, padding: '2px 6px', borderRadius: '8px' }}>{node.type}</span>
        </div>
        {hasChildren && isExpanded && (
          <div style={{ borderLeft: `2px solid ${nodeColor}30`, marginLeft: '7px', paddingLeft: '8px' }}>
            {node.children.map((child, idx) => (<TreeNode key={idx} node={child} depth={depth + 1} parentColor={nodeColor} />))}
          </div>
        )}
      </div>
    );
  };

  const componentTree = {
    id: 'root', name: 'App Router (Next.js 14)', type: 'layout', color: '#6366F1',
    children: [
      { id: 'providers', name: 'PROVIDERS', type: 'group', color: '#8B5CF6', children: [
        { name: 'SessionProvider (NextAuth)', type: 'provider' },
        { name: 'ThemeProvider', type: 'provider' }
      ]},
      { id: 'auth', name: 'AUTH PAGES', type: 'group', color: '#3B82F6', children: [
        { name: 'LoginPage → AuthForm', type: 'page' },
        { name: 'RegisterPage → AuthForm', type: 'page' },
        { name: 'ErrorPage', type: 'page' }
      ]},
      { id: 'dashboard', name: 'DASHBOARD PAGES', type: 'group', color: '#10B981', children: [
        { name: 'DashboardLayout', type: 'layout', children: [
          { name: 'Sidebar + Navigation', type: 'component' },
          { name: 'TopBar + UserMenu', type: 'component' }
        ]},
        { name: 'DashboardPage (Home)', type: 'page', children: [
          { name: 'BrandPresenceHero', type: 'component' },
          { name: 'BrandHealthIndicator', type: 'component' },
          { name: 'BrandMoments', type: 'component' },
          { name: 'BrandGrowthOpportunities', type: 'component' },
          { name: 'MarketLandscape', type: 'component' },
          { name: 'BrandStoryVisualizer', type: 'component' },
          { name: 'AIPlatformGalaxy', type: 'component' }
        ]},
        { id: 'brand360', name: 'Brand360Page', type: 'page', color: '#8B5CF6', children: [
          { name: 'WebsiteAnalyzer', type: 'component' },
          { name: 'BrandStoryCanvas', type: 'component' },
          { name: 'BrandOfferingsShowcase', type: 'component' },
          { name: 'ProfileStrengthMeter', type: 'component' },
          { name: 'DocumentUpload', type: 'component' },
          { name: 'ProductCatalogConnector', type: 'component' }
        ]},
        { id: 'aeo', name: 'AEOPage', type: 'page', color: '#F59E0B', children: [
          { name: 'QuadrantChart', type: 'component' },
          { name: 'MetricsRadarChart', type: 'component' },
          { name: 'PerceptionScoreCard', type: 'component' },
          { name: 'PlatformComparisonChart', type: 'component' },
          { name: 'ScoreTrendChart', type: 'component' },
          { name: 'InsightsPriorityMatrix', type: 'component' },
          { name: 'CorrectionFunnel', type: 'component' }
        ]},
        { name: 'ScanPage', type: 'page' },
        { name: 'InsightsPage', type: 'page' },
        { id: 'review', name: 'ReviewQueuePage', type: 'page', color: '#EC4899', children: [
          { name: 'ReviewQueueBanner', type: 'component' },
          { name: 'ReviewModal', type: 'component' },
          { name: 'FieldReviewCard', type: 'component' }
        ]},
        { id: 'settings', name: 'SettingsPage', type: 'page', color: '#6B7280' },
        { name: 'ReportPage', type: 'page' }
      ]},
      { id: 'onboarding', name: 'ONBOARDING PAGE', type: 'group', color: '#F97316', children: [
        { name: 'OnboardingWizard', type: 'component' },
        { name: 'NewOnboardingWizard', type: 'component' },
        { name: 'UrlAnalyzer', type: 'component' },
        { name: 'ProfileReviewCards', type: 'component' },
        { name: 'ProductIngestionTabs', type: 'component' }
      ]},
      { id: 'shared', name: 'SHARED UI COMPONENTS', type: 'group', color: '#A855F7', children: [
        { name: 'ThemeToggle, ThemeSelector', type: 'component' },
        { name: 'MetricCard, AlertBanner', type: 'component' },
        { name: 'OpportunityCard', type: 'component' }
      ]}
    ]
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)', padding: '40px 24px', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#F8FAFC', margin: '0 0 8px 0' }}>Component Hierarchy</h1>
        <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>VistralAI React application structure</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '28px', flexWrap: 'wrap' }}>
        {[{ type: 'layout', label: 'Layout' }, { type: 'page', label: 'Page' }, { type: 'component', label: 'Component' }, { type: 'provider', label: 'Provider' }].map(({ type, label }) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '16px', height: '16px', borderRadius: '4px', background: getTypeColor(type) }} /><span style={{ color: '#94A3B8', fontSize: '11px' }}>{label}</span></div>
        ))}
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', background: '#0F172A80', borderRadius: '16px', padding: '20px', border: '1px solid #334155' }}>
        <TreeNode node={componentTree} />
      </div>
    </div>
  );
};

export default ComponentHierarchyDiagram;
