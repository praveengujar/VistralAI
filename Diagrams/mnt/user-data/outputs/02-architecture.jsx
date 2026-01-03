import React from 'react';

const ArchitectureDiagram = () => {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0C0F1A 0%, #131825 50%, #0C0F1A 100%)', padding: '40px 24px', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#F8FAFC', margin: '0 0 8px 0' }}>VistralAI System Architecture</h1>
        <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>GCP Cloud Run with VPC, Memorystore, and external services</p>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* External Users */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '24px' }}>
          <div style={{ background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)', borderRadius: '12px', padding: '16px 24px', textAlign: 'center', boxShadow: '0 4px 24px rgba(59, 130, 246, 0.3)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" style={{ margin: '0 auto 8px', display: 'block' }}><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
            <div style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>Browser Client</div>
            <div style={{ color: '#93C5FD', fontSize: '11px' }}>HTTPS</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}><div style={{ width: '2px', height: '24px', background: 'linear-gradient(to bottom, #3B82F6, #475569)' }} /></div>

        {/* GCP Container */}
        <div style={{ background: '#1A1F2E', borderRadius: '20px', border: '2px solid #4285F4', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #334155' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #4285F4 25%, #34A853 25%, #34A853 50%, #FBBC05 50%, #FBBC05 75%, #EA4335 75%)', borderRadius: '8px' }} />
            <div>
              <div style={{ color: '#F8FAFC', fontWeight: '700', fontSize: '18px' }}>Google Cloud Platform</div>
              <div style={{ color: '#64748B', fontSize: '12px' }}>Production Environment • us-central1</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            {/* Cloud Run Services */}
            <div style={{ background: '#0F172A', borderRadius: '12px', padding: '16px', border: '1px solid #334155' }}>
              <div style={{ color: '#94A3B8', fontSize: '10px', fontWeight: '600', letterSpacing: '1px', marginBottom: '12px' }}>CLOUD RUN SERVICES</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: 'linear-gradient(135deg, #059669, #10B981)', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ color: 'white', fontWeight: '700', fontSize: '14px' }}>VistralAI</div>
                  <div style={{ color: '#A7F3D0', fontSize: '10px', marginTop: '4px' }}>Next.js 14 • Port 8080</div>
                  <div style={{ color: '#A7F3D0', fontSize: '10px' }}>2Gi / 2CPU • 0-20 instances</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, #D97706, #F59E0B)', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ color: 'white', fontWeight: '700', fontSize: '14px' }}>Firecrawl Service</div>
                  <div style={{ color: '#FEF3C7', fontSize: '10px', marginTop: '4px' }}>Internal HTTP • Port 3000</div>
                  <div style={{ color: '#FEF3C7', fontSize: '10px' }}>1Gi / 1CPU • 0-10 instances</div>
                </div>
              </div>
            </div>

            {/* VPC Network */}
            <div style={{ background: '#0F172A', borderRadius: '12px', padding: '16px', border: '1px solid #8B5CF6' }}>
              <div style={{ color: '#8B5CF6', fontSize: '10px', fontWeight: '600', letterSpacing: '1px', marginBottom: '12px' }}>VPC NETWORK</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: '#8B5CF620', borderRadius: '8px', padding: '12px', border: '1px solid #8B5CF640' }}>
                  <div style={{ color: '#A78BFA', fontWeight: '600', fontSize: '12px' }}>VPC Connector</div>
                  <div style={{ color: '#64748B', fontSize: '10px' }}>vistralai-connector</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, #DC2626, #EF4444)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ color: 'white', fontWeight: '600', fontSize: '12px' }}>Cloud Memorystore</div>
                  <div style={{ color: '#FCA5A5', fontSize: '10px' }}>Redis 7.0 • 1GB</div>
                </div>
                <div style={{ background: '#334155', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ color: '#E2E8F0', fontWeight: '600', fontSize: '12px' }}>Firewall Rules</div>
                  <div style={{ color: '#64748B', fontSize: '10px' }}>Internal traffic only</div>
                </div>
              </div>
            </div>

            {/* Supporting Services */}
            <div style={{ background: '#0F172A', borderRadius: '12px', padding: '16px', border: '1px solid #334155' }}>
              <div style={{ color: '#94A3B8', fontSize: '10px', fontWeight: '600', letterSpacing: '1px', marginBottom: '12px' }}>SUPPORTING SERVICES</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { name: 'Secret Manager', desc: 'API keys, URLs', color: '#6366F1' },
                  { name: 'Container Registry', desc: 'Docker images', color: '#3B82F6' },
                  { name: 'Cloud Logging', desc: 'Application logs', color: '#22C55E' },
                  { name: 'Cloud Monitoring', desc: 'Metrics + Alerts', color: '#F59E0B' }
                ].map((svc) => (
                  <div key={svc.name} style={{ background: `${svc.color}15`, borderRadius: '6px', padding: '8px 10px', borderLeft: `3px solid ${svc.color}` }}>
                    <div style={{ color: '#E2E8F0', fontSize: '11px', fontWeight: '500' }}>{svc.name}</div>
                    <div style={{ color: '#64748B', fontSize: '9px' }}>{svc.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* External Services */}
        <div style={{ color: '#94A3B8', fontSize: '11px', fontWeight: '600', letterSpacing: '1px', marginBottom: '12px', textAlign: 'center' }}>EXTERNAL SERVICES</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {[
            { name: 'Claude API', provider: 'Anthropic', color: '#EA580C', icon: '🤖' },
            { name: 'OpenAI API', provider: 'GPT-4o', color: '#10B981', icon: '🧠' },
            { name: 'MongoDB Atlas', provider: 'Database', color: '#22C55E', icon: '🍃' },
            { name: 'Stripe', provider: 'Payments', color: '#6366F1', icon: '💳' }
          ].map((svc) => (
            <div key={svc.name} style={{ background: '#1A1F2E', borderRadius: '12px', padding: '16px', border: `1px solid ${svc.color}40`, textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{svc.icon}</div>
              <div style={{ color: svc.color, fontWeight: '600', fontSize: '13px' }}>{svc.name}</div>
              <div style={{ color: '#64748B', fontSize: '10px' }}>{svc.provider}</div>
            </div>
          ))}
        </div>

        {/* Connection Legend */}
        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center', gap: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '24px', height: '2px', background: '#3B82F6' }} /><span style={{ color: '#64748B', fontSize: '11px' }}>HTTPS External</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '24px', height: '2px', background: '#8B5CF6' }} /><span style={{ color: '#64748B', fontSize: '11px' }}>VPC Internal</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '24px', height: '2px', background: '#EF4444' }} /><span style={{ color: '#64748B', fontSize: '11px' }}>Memorystore</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '24px', height: '2px', background: '#64748B', borderStyle: 'dashed' }} /><span style={{ color: '#64748B', fontSize: '11px' }}>Reads Secrets</span></div>
        </div>
      </div>
    </div>
  );
};

export default ArchitectureDiagram;
