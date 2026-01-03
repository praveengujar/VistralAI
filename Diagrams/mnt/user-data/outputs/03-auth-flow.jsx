import React, { useState } from 'react';

const AuthFlowDiagram = () => {
  const [activeFlow, setActiveFlow] = useState('credentials');

  const participants = [
    { id: 'user', name: 'User', color: '#3B82F6', icon: '👤' },
    { id: 'browser', name: 'Browser', color: '#8B5CF6', icon: '🌐' },
    { id: 'nextjs', name: 'Next.js', color: '#000000', icon: '▲' },
    { id: 'nextauth', name: 'NextAuth', color: '#10B981', icon: '🔐' },
    { id: 'mongodb', name: 'MongoDB', color: '#22C55E', icon: '🍃' },
    { id: 'audit', name: 'Audit Log', color: '#F59E0B', icon: '📋' }
  ];

  const flows = {
    credentials: {
      name: 'Credentials Login',
      color: '#3B82F6',
      steps: [
        { from: 0, to: 1, label: 'Enter email/password', type: 'action' },
        { from: 1, to: 2, label: 'POST /api/auth/signin', type: 'request' },
        { from: 2, to: 3, label: 'Validate credentials', type: 'request' },
        { from: 3, to: 4, label: 'getUserByEmail()', type: 'query' },
        { from: 4, to: 3, label: 'User record', type: 'response' },
        { from: 3, to: 3, label: 'verifyPassword()', type: 'process' },
        { from: 3, to: 4, label: 'Update lastLoginAt', type: 'query', condition: 'if valid' },
        { from: 3, to: 5, label: 'Log signin event', type: 'async' },
        { from: 3, to: 1, label: 'Set HTTP-only cookie', type: 'response' },
        { from: 1, to: 0, label: 'Redirect to /dashboard', type: 'redirect' }
      ]
    },
    oauth: {
      name: 'OAuth (Google/GitHub)',
      color: '#8B5CF6',
      steps: [
        { from: 0, to: 1, label: 'Click OAuth provider', type: 'action' },
        { from: 1, to: 3, label: 'GET /api/auth/signin/google', type: 'request' },
        { from: 3, to: 1, label: 'Redirect to OAuth provider', type: 'redirect' },
        { from: 1, to: 0, label: 'OAuth consent screen', type: 'action' },
        { from: 0, to: 1, label: 'Grant permission', type: 'action' },
        { from: 1, to: 3, label: 'OAuth callback with code', type: 'request' },
        { from: 3, to: 3, label: 'Exchange code for tokens', type: 'process' },
        { from: 3, to: 4, label: 'Find or create user', type: 'query' },
        { from: 3, to: 4, label: 'Link OAuth account', type: 'query' },
        { from: 3, to: 5, label: 'Log signin event', type: 'async' },
        { from: 3, to: 1, label: 'Set HTTP-only cookie', type: 'response' },
        { from: 1, to: 0, label: 'Redirect to /dashboard', type: 'redirect' }
      ]
    },
    session: {
      name: 'Session Validation',
      color: '#10B981',
      steps: [
        { from: 0, to: 1, label: 'Access protected route', type: 'action' },
        { from: 1, to: 2, label: 'Request with cookie', type: 'request' },
        { from: 2, to: 3, label: 'Validate JWT token', type: 'request' },
        { from: 3, to: 2, label: 'Session data', type: 'response', condition: 'if valid' },
        { from: 2, to: 1, label: 'Protected content', type: 'response', condition: 'if valid' },
        { from: 3, to: 2, label: 'null session', type: 'error', condition: 'if invalid' },
        { from: 2, to: 1, label: 'Redirect to /auth/login', type: 'redirect', condition: 'if invalid' }
      ]
    }
  };

  const getStepColor = (type) => {
    switch (type) {
      case 'request': return '#3B82F6';
      case 'response': return '#10B981';
      case 'query': return '#22C55E';
      case 'action': return '#8B5CF6';
      case 'process': return '#F59E0B';
      case 'error': return '#EF4444';
      case 'redirect': return '#EC4899';
      case 'async': return '#6366F1';
      default: return '#64748B';
    }
  };

  const currentFlow = flows[activeFlow];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0F0F1A 0%, #1A1A2E 50%, #0F0F1A 100%)', padding: '40px 24px', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#F8FAFC', margin: '0 0 8px 0' }}>Authentication Flows</h1>
        <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>Credentials, OAuth (Google/GitHub), and Session Validation</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '40px' }}>
        {Object.entries(flows).map(([key, flow]) => (
          <button key={key} onClick={() => setActiveFlow(key)} style={{ padding: '12px 24px', borderRadius: '8px', border: activeFlow === key ? `2px solid ${flow.color}` : '2px solid #334155', background: activeFlow === key ? `${flow.color}20` : 'transparent', color: activeFlow === key ? flow.color : '#94A3B8', fontWeight: '600', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}>{flow.name}</button>
        ))}
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto 24px', display: 'grid', gridTemplateColumns: `repeat(${participants.length}, 1fr)`, gap: '12px' }}>
        {participants.map((p) => (
          <div key={p.id} style={{ textAlign: 'center', padding: '14px 8px', background: `${p.color}15`, borderRadius: '12px', border: `1px solid ${p.color}40` }}>
            <div style={{ fontSize: '20px', marginBottom: '6px' }}>{p.icon}</div>
            <div style={{ color: p.color, fontWeight: '600', fontSize: '11px' }}>{p.name}</div>
          </div>
        ))}
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', paddingTop: '20px' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'grid', gridTemplateColumns: `repeat(${participants.length}, 1fr)`, gap: '12px', pointerEvents: 'none' }}>
          {participants.map((p, i) => (<div key={i} style={{ display: 'flex', justifyContent: 'center' }}><div style={{ width: '2px', height: '100%', background: `linear-gradient(to bottom, ${p.color}60, ${p.color}20)`, borderRadius: '1px' }} /></div>))}
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          {currentFlow.steps.map((step, idx) => {
            const fromPos = (step.from / (participants.length - 1)) * 100;
            const toPos = (step.to / (participants.length - 1)) * 100;
            const isLeftToRight = step.to > step.from;
            const isSameColumn = step.from === step.to;

            return (
              <div key={idx} style={{ marginBottom: '14px', position: 'relative', height: isSameColumn ? '44px' : '36px' }}>
                {isSameColumn ? (
                  <div style={{ position: 'absolute', left: `calc(${fromPos}% + 16px)`, top: '6px', width: '50px', height: '28px', border: `2px solid ${getStepColor(step.type)}`, borderLeft: 'none', borderRadius: '0 8px 8px 0' }}>
                    <div style={{ position: 'absolute', left: '60px', top: '50%', transform: 'translateY(-50%)', whiteSpace: 'nowrap', background: '#1A1A2E', padding: '3px 10px', borderRadius: '4px', border: `1px solid ${getStepColor(step.type)}30` }}>
                      <span style={{ color: getStepColor(step.type), fontSize: '10px', fontWeight: '500' }}>{step.label}</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ position: 'absolute', left: `calc(${Math.min(fromPos, toPos)}% + 6px)`, right: `calc(${100 - Math.max(fromPos, toPos)}% + 6px)`, top: '50%', height: '2px', background: getStepColor(step.type), transform: 'translateY(-50%)' }}>
                      <div style={{ position: 'absolute', [isLeftToRight ? 'right' : 'left']: '-5px', top: '-4px', width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', [isLeftToRight ? 'borderLeft' : 'borderRight']: `7px solid ${getStepColor(step.type)}` }} />
                    </div>
                    <div style={{ position: 'absolute', left: `${(fromPos + toPos) / 2}%`, top: '-6px', transform: 'translateX(-50%)', background: '#1A1A2E', padding: '2px 8px', borderRadius: '4px', whiteSpace: 'nowrap', border: `1px solid ${getStepColor(step.type)}30` }}>
                      <span style={{ color: getStepColor(step.type), fontSize: '10px', fontWeight: '500' }}>{step.label}</span>
                      {step.condition && (<span style={{ color: '#F59E0B', fontSize: '9px', marginLeft: '5px', fontStyle: 'italic' }}>[{step.condition}]</span>)}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '48px auto 0', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '16px' }}>
        {[{ type: 'request', label: 'Request' }, { type: 'response', label: 'Response' }, { type: 'query', label: 'DB Query' }, { type: 'action', label: 'User Action' }, { type: 'process', label: 'Processing' }, { type: 'error', label: 'Error' }, { type: 'redirect', label: 'Redirect' }, { type: 'async', label: 'Async' }].map(({ type, label }) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '20px', height: '3px', background: getStepColor(type), borderRadius: '2px' }} /><span style={{ color: '#94A3B8', fontSize: '11px' }}>{label}</span></div>
        ))}
      </div>
    </div>
  );
};

export default AuthFlowDiagram;
