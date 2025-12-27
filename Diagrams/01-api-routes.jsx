import React, { useState } from 'react';

const APIRouteDiagram = () => {
  const [expandedGroups, setExpandedGroups] = useState({
    auth: true,
    brand360: true,
    aeo: true,
    user: true,
    onboarding: true,
    admin: true,
    other: true
  });

  const toggleGroup = (group) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const routeGroups = [
    {
      id: 'auth',
      name: 'AUTHENTICATION',
      color: '#3B82F6',
      bgColor: '#1E3A5F',
      routes: [
        { path: '/api/auth/[...nextauth]', desc: 'NextAuth handler' },
        { path: '/api/auth/register', desc: 'User registration' }
      ]
    },
    {
      id: 'brand360',
      name: 'BRAND 360',
      color: '#10B981',
      bgColor: '#134E3A',
      routes: [
        { path: '/api/brand-360', desc: 'Get complete brand data' },
        { path: '/api/brand-360/identity', desc: 'Brand identity CRUD' },
        { path: '/api/brand-360/products', desc: 'Products CRUD' },
        { path: '/api/brand-360/competitors', desc: 'Competitors CRUD' },
        { path: '/api/brand-360/market-position', desc: 'Market position CRUD' },
        { path: '/api/brand-360/analyze-website', desc: 'Analyze website URL' },
        { path: '/api/brand-360/upload', desc: 'Document upload' },
        { path: '/api/brand-360/catalog/upload', desc: 'Catalog upload' }
      ]
    },
    {
      id: 'aeo',
      name: 'AEO ENGINE',
      color: '#8B5CF6',
      bgColor: '#4C1D95',
      routes: [
        { path: '/api/aeo/magic-import', desc: 'Extract brand from website' },
        { path: '/api/aeo/perception-scan', desc: 'Start/list scans' },
        { path: '/api/aeo/perception-scan/[scanId]', desc: 'Get scan results' },
        { path: '/api/aeo/insights', desc: 'Perception insights CRUD' },
        { path: '/api/aeo/insights/[insightId]', desc: 'Single insight' },
        { path: '/api/aeo/corrections', desc: 'Correction workflows' },
        { path: '/api/aeo/corrections/[workflowId]', desc: 'Single workflow' },
        { path: '/api/aeo/prompts', desc: 'Prompt management' },
        { path: '/api/aeo/prompts/generate', desc: 'Generate prompts' },
        { path: '/api/aeo/reports/summary', desc: 'Report summary' },
        { path: '/api/aeo/reports/export', desc: 'Export reports' },
        { path: '/api/aeo/compare-scans', desc: 'Compare scans' }
      ]
    },
    {
      id: 'user',
      name: 'USER',
      color: '#F97316',
      bgColor: '#7C2D12',
      routes: [
        { path: '/api/user/profile', desc: 'User profile' },
        { path: '/api/user/password', desc: 'Password management' },
        { path: '/api/user/sessions', desc: 'Session management' },
        { path: '/api/user/mfa', desc: 'MFA status' },
        { path: '/api/user/mfa/setup', desc: 'MFA setup' },
        { path: '/api/user/mfa/verify', desc: 'MFA verification' }
      ]
    },
    {
      id: 'onboarding',
      name: 'ONBOARDING',
      color: '#14B8A6',
      bgColor: '#134E4A',
      routes: [
        { path: '/api/onboarding/analyze', desc: 'Analyze URL' },
        { path: '/api/onboarding/status', desc: 'Check status' },
        { path: '/api/onboarding/confirm', desc: 'Confirm onboarding' },
        { path: '/api/onboarding/review-queue', desc: 'Review queue' },
        { path: '/api/onboarding/review-queue/approve', desc: 'Approve items' },
        { path: '/api/onboarding/products/upload', desc: 'Upload products' }
      ]
    },
    {
      id: 'admin',
      name: 'ADMIN',
      color: '#EF4444',
      bgColor: '#7F1D1D',
      routes: [
        { path: '/api/admin/queue-stats', desc: 'Queue statistics' },
        { path: '/api/admin/review-queue', desc: 'Admin review queue' }
      ]
    },
    {
      id: 'other',
      name: 'OTHER',
      color: '#6B7280',
      bgColor: '#374151',
      routes: [
        { path: '/api/health', desc: 'Health check' },
        { path: '/api/brand-profile', desc: 'Brand profile' },
        { path: '/api/reports/brand-story', desc: 'Brand story report' }
      ]
    }
  ];

  const totalRoutes = routeGroups.reduce((acc, group) => acc + group.routes.length, 0);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
      padding: '40px 24px',
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace"
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#F8FAFC',
          margin: '0 0 8px 0',
          letterSpacing: '-0.5px'
        }}>
          VistralAI API Routes
        </h1>
        <p style={{
          fontSize: '14px',
          color: '#94A3B8',
          margin: 0
        }}>
          {totalRoutes} endpoints across {routeGroups.length} modules
        </p>
      </div>

      {/* Client Node */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '32px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
          borderRadius: '12px',
          padding: '16px 32px',
          boxShadow: '0 4px 24px rgba(99, 102, 241, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          <span style={{ color: 'white', fontWeight: '600', fontSize: '16px' }}>Client</span>
        </div>
      </div>

      {/* Connection Line */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '32px'
      }}>
        <div style={{
          width: '2px',
          height: '40px',
          background: 'linear-gradient(to bottom, #6366F1, #475569)'
        }} />
      </div>

      {/* Route Groups Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {routeGroups.map((group) => (
          <div
            key={group.id}
            style={{
              background: group.bgColor,
              borderRadius: '12px',
              border: `1px solid ${group.color}40`,
              overflow: 'hidden',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
          >
            {/* Group Header */}
            <button
              onClick={() => toggleGroup(group.id)}
              style={{
                width: '100%',
                padding: '16px 20px',
                background: `${group.color}20`,
                border: 'none',
                borderBottom: `1px solid ${group.color}40`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: group.color,
                  boxShadow: `0 0 12px ${group.color}`
                }} />
                <span style={{
                  color: group.color,
                  fontWeight: '700',
                  fontSize: '13px',
                  letterSpacing: '1px'
                }}>
                  {group.name}
                </span>
                <span style={{
                  color: '#94A3B8',
                  fontSize: '12px',
                  background: '#1E293B',
                  padding: '2px 8px',
                  borderRadius: '10px'
                }}>
                  {group.routes.length}
                </span>
              </div>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke={group.color}
                strokeWidth="2"
                style={{
                  transform: expandedGroups[group.id] ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Routes List */}
            {expandedGroups[group.id] && (
              <div style={{ padding: '12px' }}>
                {group.routes.map((route, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 12px',
                      marginBottom: idx < group.routes.length - 1 ? '8px' : 0,
                      background: '#0F172A80',
                      borderRadius: '8px',
                      borderLeft: `3px solid ${group.color}`
                    }}
                  >
                    <code style={{
                      color: '#E2E8F0',
                      fontSize: '12px',
                      display: 'block',
                      marginBottom: '4px'
                    }}>
                      {route.path}
                    </code>
                    <span style={{
                      color: '#64748B',
                      fontSize: '11px'
                    }}>
                      {route.desc}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{
        marginTop: '48px',
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: '24px'
      }}>
        {routeGroups.map((group) => (
          <div key={group.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '16px',
              height: '16px',
              borderRadius: '4px',
              background: group.color
            }} />
            <span style={{ color: '#94A3B8', fontSize: '12px' }}>{group.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default APIRouteDiagram;
