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
        { from: 2, to: 3, label: 'Forward credentials', type: 'request' },
        { from: 3, to: 4, label: 'getUserByEmail()', type: 'query' },
        { from: 4, to: 3, label: 'User record', type: 'response' },
        { from: 3, to: 3, label: 'Verify password', type: 'process', note: 'bcrypt.compare()' },
        { from: 3, to: 4, label: 'Update lastLoginAt', type: 'query', condition: 'if valid' },
        { from: 3, to: 5, label: 'Log signin event', type: 'async', condition: 'if valid' },
        { from: 3, to: 1, label: 'HTTP-only cookie + JWT', type: 'response', condition: 'if valid' },
        { from: 1, to: 0, label: 'Redirect to /dashboard', type: 'action', condition: 'if valid' },
        { from: 3, to: 1, label: 'Error response', type: 'error', condition: 'if invalid' },
        { from: 1, to: 0, label: 'Show error message', type: 'action', condition: 'if invalid' }
      ]
    },
    oauth: {
      name: 'OAuth Login (Google/GitHub)',
      color: '#8B5CF6',
      steps: [
        { from: 0, to: 1, label: 'Click OAuth button', type: 'action' },
        { from: 1, to: 2, label: 'GET /api/auth/signin/google', type: 'request' },
        { from: 2, to: 3, label: 'Initialize OAuth', type: 'request' },
        { from: 3, to: 1, label: 'Redirect to provider', type: 'redirect' },
        { from: 1, to: 0, label: 'OAuth consent screen', type: 'action' },
        { from: 0, to: 1, label: 'Grant permission', type: 'action' },
        { from: 1, to: 3, label: 'Callback with auth code', type: 'request' },
        { from: 3, to: 3, label: 'Exchange code for tokens', type: 'process' },
        { from: 3, to: 4, label: 'Find or create user', type: 'query' },
        { from: 4, to: 3, label: 'User record', type: 'response' },
        { from: 3, to: 4, label: 'Link OAuth account', type: 'query' },
        { from: 3, to: 5, label: 'Log signin event', type: 'async' },
        { from: 3, to: 1, label: 'HTTP-only cookie', type: 'response' },
        { from: 1, to: 0, label: 'Redirect to /dashboard', type: 'action' }
      ]
    },
    session: {
      name: 'Session Validation',
      color: '#10B981',
      steps: [
        { from: 0, to: 1, label: 'Access protected route', type: 'action' },
        { from: 1, to: 2, label: 'Request with cookie', type: 'request' },
        { from: 2, to: 3, label: 'Validate JWT', type: 'request' },
        { from: 3, to: 3, label: 'Decode & verify token', type: 'process' },
        { from: 3, to: 2, label: 'Session data', type: 'response', condition: 'if valid' },
        { from: 2, to: 1, label: 'Protected content', type: 'response', condition: 'if valid' },
        { from: 3, to: 2, label: 'Invalid session', type: 'error', condition: 'if invalid' },
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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0F0F1A 0%, #1A1A2E 50%, #0F0F1A 100%)',
      padding: '40px 24px',
      fontFamily: "'Inter', -apple-system, sans-serif"
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#F8FAFC',
          margin: '0 0 8px 0'
        }}>
          Authentication Flows
        </h1>
        <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
          VistralAI authentication sequence diagrams
        </p>
      </div>

      {/* Flow Selector */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '12px',
        marginBottom: '40px'
      }}>
        {Object.entries(flows).map(([key, flow]) => (
          <button
            key={key}
            onClick={() => setActiveFlow(key)}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: activeFlow === key ? `2px solid ${flow.color}` : '2px solid #334155',
              background: activeFlow === key ? `${flow.color}20` : 'transparent',
              color: activeFlow === key ? flow.color : '#94A3B8',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {flow.name}
          </button>
        ))}
      </div>

      {/* Participants Header */}
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto 24px',
        display: 'grid',
        gridTemplateColumns: `repeat(${participants.length}, 1fr)`,
        gap: '16px'
      }}>
        {participants.map((p) => (
          <div key={p.id} style={{
            textAlign: 'center',
            padding: '16px 8px',
            background: `${p.color}15`,
            borderRadius: '12px',
            border: `1px solid ${p.color}40`
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>{p.icon}</div>
            <div style={{ color: p.color, fontWeight: '600', fontSize: '13px' }}>{p.name}</div>
          </div>
        ))}
      </div>

      {/* Lifelines */}
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        position: 'relative',
        paddingTop: '20px'
      }}>
        {/* Vertical lifelines */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'grid',
          gridTemplateColumns: `repeat(${participants.length}, 1fr)`,
          gap: '16px',
          pointerEvents: 'none'
        }}>
          {participants.map((p, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: 'center'
            }}>
              <div style={{
                width: '2px',
                height: '100%',
                background: `linear-gradient(to bottom, ${p.color}60, ${p.color}20)`,
                borderRadius: '1px'
              }} />
            </div>
          ))}
        </div>

        {/* Steps */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {currentFlow.steps.map((step, idx) => {
            const fromPos = (step.from / (participants.length - 1)) * 100;
            const toPos = (step.to / (participants.length - 1)) * 100;
            const isLeftToRight = step.to > step.from;
            const isSameColumn = step.from === step.to;
            
            return (
              <div key={idx} style={{
                marginBottom: '16px',
                position: 'relative',
                height: isSameColumn ? '48px' : '40px'
              }}>
                {isSameColumn ? (
                  // Self-referential (process)
                  <div style={{
                    position: 'absolute',
                    left: `calc(${fromPos}% + 20px)`,
                    top: '8px',
                    width: '60px',
                    height: '32px',
                    border: `2px solid ${getStepColor(step.type)}`,
                    borderLeft: 'none',
                    borderRadius: '0 8px 8px 0'
                  }}>
                    <div style={{
                      position: 'absolute',
                      left: '70px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      whiteSpace: 'nowrap',
                      background: '#1A1A2E',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      border: `1px solid ${getStepColor(step.type)}40`
                    }}>
                      <span style={{ color: getStepColor(step.type), fontSize: '12px', fontWeight: '500' }}>
                        {step.label}
                      </span>
                      {step.note && (
                        <span style={{ color: '#64748B', fontSize: '10px', marginLeft: '8px' }}>
                          {step.note}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  // Arrow between columns
                  <>
                    <div style={{
                      position: 'absolute',
                      left: `calc(${Math.min(fromPos, toPos)}% + 8px)`,
                      right: `calc(${100 - Math.max(fromPos, toPos)}% + 8px)`,
                      top: '50%',
                      height: '2px',
                      background: getStepColor(step.type),
                      transform: 'translateY(-50%)'
                    }}>
                      {/* Arrow head */}
                      <div style={{
                        position: 'absolute',
                        [isLeftToRight ? 'right' : 'left']: '-6px',
                        top: '-4px',
                        width: 0,
                        height: 0,
                        borderTop: '5px solid transparent',
                        borderBottom: '5px solid transparent',
                        [isLeftToRight ? 'borderLeft' : 'borderRight']: `8px solid ${getStepColor(step.type)}`
                      }} />
                    </div>
                    {/* Label */}
                    <div style={{
                      position: 'absolute',
                      left: `${(fromPos + toPos) / 2}%`,
                      top: '-4px',
                      transform: 'translateX(-50%)',
                      background: '#1A1A2E',
                      padding: '2px 10px',
                      borderRadius: '4px',
                      whiteSpace: 'nowrap',
                      border: `1px solid ${getStepColor(step.type)}30`
                    }}>
                      <span style={{ color: getStepColor(step.type), fontSize: '11px', fontWeight: '500' }}>
                        {step.label}
                      </span>
                      {step.condition && (
                        <span style={{
                          color: '#F59E0B',
                          fontSize: '10px',
                          marginLeft: '6px',
                          fontStyle: 'italic'
                        }}>
                          [{step.condition}]
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{
        maxWidth: '800px',
        margin: '48px auto 0',
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {[
          { type: 'request', label: 'Request' },
          { type: 'response', label: 'Response' },
          { type: 'query', label: 'DB Query' },
          { type: 'action', label: 'User Action' },
          { type: 'process', label: 'Processing' },
          { type: 'error', label: 'Error' },
          { type: 'redirect', label: 'Redirect' },
          { type: 'async', label: 'Async' }
        ].map(({ type, label }) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '24px',
              height: '3px',
              background: getStepColor(type),
              borderRadius: '2px'
            }} />
            <span style={{ color: '#94A3B8', fontSize: '11px' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AuthFlowDiagram;
