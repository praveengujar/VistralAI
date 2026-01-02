import React from 'react';

const InfrastructureDiagram = () => {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0C0F1A 0%, #151C2C 50%, #0C0F1A 100%)', padding: '40px 24px', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#F8FAFC', margin: '0 0 8px 0' }}>Infrastructure & Deployment</h1>
        <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>CI/CD pipeline and GCP production architecture</p>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* CI/CD Pipeline */}
        <div style={{ background: '#1A1F2E', borderRadius: '16px', padding: '24px', marginBottom: '24px', border: '1px solid #334155' }}>
          <div style={{ color: '#94A3B8', fontSize: '11px', fontWeight: '600', letterSpacing: '1px', marginBottom: '20px' }}>CI/CD PIPELINE (Cloud Build)</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            {[
              { name: 'Source Code', icon: '📝', color: '#64748B' },
              { name: 'Git Push', icon: '↗️', color: '#64748B' },
              { name: 'Run Tests', icon: '✅', color: '#34A853' },
              { name: 'Docker Build', icon: '🐳', color: '#2496ED' },
              { name: 'Push GCR', icon: '📤', color: '#4285F4' },
              { name: 'Deploy', icon: '🚀', color: '#10B981' }
            ].map((step, idx, arr) => (
              <React.Fragment key={step.name}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: `${step.color}20`, border: `2px solid ${step.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>{step.icon}</div>
                  <span style={{ color: '#E2E8F0', fontSize: '9px', fontWeight: '500', textAlign: 'center' }}>{step.name}</span>
                </div>
                {idx < arr.length - 1 && (<div style={{ width: '20px', height: '2px', background: '#334155', position: 'relative' }}><div style={{ position: 'absolute', right: 0, top: '-3px', width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: '6px solid #334155' }} /></div>)}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '20px' }}>
          
          {/* Local Dev */}
          <div style={{ background: '#1A1F2E', borderRadius: '16px', padding: '18px', border: '1px solid #334155' }}>
            <div style={{ color: '#94A3B8', fontSize: '11px', fontWeight: '600', letterSpacing: '1px', marginBottom: '14px' }}>LOCAL DEV</div>
            <div style={{ background: '#0F172A', borderRadius: '10px', padding: '14px', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><span style={{ fontSize: '14px' }}>🐳</span><span style={{ color: '#2496ED', fontSize: '12px', fontWeight: '600' }}>Docker Compose</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { name: 'MongoDB', port: '27017', color: '#22C55E' },
                  { name: 'Redis', port: '6379', color: '#DC2626' },
                  { name: 'Firecrawl', port: '3002', color: '#F97316' },
                  { name: 'Mongo Express', port: '8081', color: '#6B7280' }
                ].map((svc) => (
                  <div key={svc.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', background: `${svc.color}10`, borderRadius: '5px', borderLeft: `3px solid ${svc.color}` }}>
                    <span style={{ color: '#E2E8F0', fontSize: '10px' }}>{svc.name}</span>
                    <code style={{ color: svc.color, fontSize: '9px' }}>{svc.port}</code>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* GCP Production */}
          <div style={{ background: '#1A1F2E', borderRadius: '16px', padding: '18px', border: '2px solid #4285F4' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid #334155' }}>
              <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #4285F4 25%, #34A853 25%, #34A853 50%, #FBBC05 50%, #FBBC05 75%, #EA4335 75%)', borderRadius: '6px' }} />
              <div><div style={{ color: '#F8FAFC', fontWeight: '700', fontSize: '14px' }}>Google Cloud Platform</div><div style={{ color: '#64748B', fontSize: '11px' }}>Production • us-central1</div></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ color: '#94A3B8', fontSize: '10px', fontWeight: '600', letterSpacing: '1px', marginBottom: '10px' }}>CLOUD RUN</div>
                <div style={{ background: 'linear-gradient(135deg, #059669, #10B981)', borderRadius: '10px', padding: '12px', marginBottom: '8px' }}>
                  <div style={{ color: 'white', fontWeight: '600', fontSize: '13px' }}>VistralAI</div>
                  <div style={{ color: '#A7F3D0', fontSize: '9px' }}>2Gi/2CPU • 0-20 instances</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, #D97706, #F59E0B)', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ color: 'white', fontWeight: '600', fontSize: '13px' }}>Firecrawl</div>
                  <div style={{ color: '#FEF3C7', fontSize: '9px' }}>1Gi/1CPU • 0-10 instances</div>
                </div>
              </div>
              <div>
                <div style={{ color: '#94A3B8', fontSize: '10px', fontWeight: '600', letterSpacing: '1px', marginBottom: '10px' }}>NETWORKING</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    { name: 'Cloud Load Balancer', color: '#4285F4' },
                    { name: 'VPC Connector', color: '#8B5CF6' },
                    { name: 'Firewall Rules', color: '#64748B' }
                  ].map((item) => (
                    <div key={item.name} style={{ background: '#0F172A', borderRadius: '6px', padding: '8px 10px', borderLeft: `3px solid ${item.color}` }}>
                      <div style={{ color: '#E2E8F0', fontSize: '10px', fontWeight: '500' }}>{item.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '14px' }}>
              <div style={{ color: '#94A3B8', fontSize: '10px', fontWeight: '600', letterSpacing: '1px', marginBottom: '8px' }}>DATA & MONITORING</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['Memorystore Redis 1GB', 'Secret Manager', 'Cloud Logging', 'Cloud Monitoring', 'Alerting'].map((item) => (
                  <div key={item} style={{ background: '#0F172A', borderRadius: '5px', padding: '5px 10px', border: '1px solid #334155' }}><span style={{ color: '#94A3B8', fontSize: '9px' }}>{item}</span></div>
                ))}
              </div>
            </div>
          </div>

          {/* External Services */}
          <div style={{ background: '#1A1F2E', borderRadius: '16px', padding: '18px', border: '1px solid #334155' }}>
            <div style={{ color: '#94A3B8', fontSize: '11px', fontWeight: '600', letterSpacing: '1px', marginBottom: '14px' }}>EXTERNAL</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { name: 'MongoDB Atlas', desc: 'Database', color: '#22C55E' },
                { name: 'Anthropic API', desc: 'Claude', color: '#EA580C' },
                { name: 'OpenAI API', desc: 'GPT-4o', color: '#10B981' },
                { name: 'Stripe', desc: 'Payments', color: '#6366F1' }
              ].map((svc) => (
                <div key={svc.name} style={{ background: `linear-gradient(135deg, ${svc.color}20, ${svc.color}10)`, borderRadius: '10px', padding: '12px', borderLeft: `3px solid ${svc.color}` }}>
                  <div style={{ color: svc.color, fontWeight: '600', fontSize: '12px' }}>{svc.name}</div>
                  <div style={{ color: '#94A3B8', fontSize: '10px' }}>{svc.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfrastructureDiagram;
