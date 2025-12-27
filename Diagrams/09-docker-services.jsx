import React from 'react';

const DockerServicesDiagram = () => {
  const mongodbServices = [
    { name: 'MongoDB 7.0', port: '27017', color: '#22C55E', desc: 'Replica set rs0 for Prisma txns', icon: '🍃' },
    { name: 'Mongo Express', port: '8081', color: '#6B7280', desc: 'Web UI for MongoDB', icon: '🔍' },
    { name: 'Redis 7', port: '6379', color: '#DC2626', desc: 'appendonly, 256MB, LRU', icon: '⚡' },
    { name: 'Redis Commander', port: '8082', color: '#F59E0B', desc: 'Web UI for Redis', icon: '🔍' }
  ];

  const optionalServices = [
    { name: 'Firecrawl', port: '3002', color: '#F97316', desc: 'Web crawling service' },
    { name: 'Playwright', port: '3001', color: '#45BA4B', desc: 'Browser automation' },
    { name: 'PostgreSQL', port: '5432', color: '#336791', desc: 'Alt DB (DATABASE_MODE)' }
  ];

  const connections = [
    { from: 'VistralAI', to: 'MongoDB', label: 'Data persistence', color: '#22C55E' },
    { from: 'VistralAI', to: 'Redis', label: 'Caching + Sessions', color: '#DC2626' },
    { from: 'VistralAI', to: 'Firecrawl', label: 'Web crawling', color: '#F97316' },
    { from: 'Mongo Express', to: 'MongoDB', label: 'Admin UI', color: '#6B7280' },
    { from: 'Redis Commander', to: 'Redis', label: 'Admin UI', color: '#F59E0B' },
    { from: 'Firecrawl', to: 'Playwright', label: 'Browser automation', color: '#45BA4B' }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0A0E17 0%, #131B2E 50%, #0A0E17 100%)',
      padding: '40px 24px',
      fontFamily: "'Inter', -apple-system, sans-serif"
    }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#F8FAFC', margin: '0 0 8px 0' }}>Docker Services</h1>
        <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>Local development container architecture</p>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* VistralAI App */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #000000, #1A1A2E)',
            borderRadius: '18px',
            padding: '20px 40px',
            border: '2px solid #FFFFFF',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '10px' }}>
              <span style={{ fontSize: '24px' }}>▲</span>
              <span style={{ color: '#FFFFFF', fontWeight: '700', fontSize: '22px' }}>VistralAI</span>
            </div>
            <div style={{ color: '#94A3B8', fontSize: '13px', marginBottom: '8px' }}>Next.js 14 (npm run dev)</div>
            <div style={{ display: 'inline-block', background: '#10B98130', border: '1px solid #10B981', borderRadius: '16px', padding: '4px 14px' }}>
              <code style={{ color: '#10B981', fontSize: '13px', fontWeight: '600' }}>Port 3000</code>
            </div>
          </div>
        </div>

        {/* Connection Lines */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <svg width="500" height="50" viewBox="0 0 500 50">
            <line x1="250" y1="0" x2="250" y2="25" stroke="#475569" strokeWidth="2" />
            <line x1="80" y1="25" x2="420" y2="25" stroke="#475569" strokeWidth="2" />
            <line x1="80" y1="25" x2="80" y2="50" stroke="#22C55E" strokeWidth="2" />
            <line x1="180" y1="25" x2="180" y2="50" stroke="#DC2626" strokeWidth="2" />
            <line x1="320" y1="25" x2="320" y2="50" stroke="#6B7280" strokeWidth="2" />
            <line x1="420" y1="25" x2="420" y2="50" stroke="#F59E0B" strokeWidth="2" />
          </svg>
        </div>

        {/* Docker Compose Files */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
          
          {/* Main MongoDB Compose */}
          <div style={{
            background: '#1A1F2E',
            borderRadius: '16px',
            border: '2px solid #22C55E',
            overflow: 'hidden'
          }}>
            <div style={{
              background: '#22C55E20',
              padding: '14px 18px',
              borderBottom: '1px solid #22C55E40',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '20px' }}>🐳</span>
              <div>
                <div style={{ color: '#22C55E', fontWeight: '700', fontSize: '13px' }}>docker-compose.mongodb.yml</div>
                <div style={{ color: '#64748B', fontSize: '10px' }}>Primary development stack</div>
              </div>
            </div>
            <div style={{ padding: '14px' }}>
              {mongodbServices.map((service, idx) => (
                <div key={service.name} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  marginBottom: idx < mongodbServices.length - 1 ? '8px' : 0,
                  background: '#0F172A',
                  borderRadius: '10px',
                  borderLeft: `4px solid ${service.color}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '16px' }}>{service.icon}</span>
                    <div>
                      <div style={{ color: '#E2E8F0', fontSize: '12px', fontWeight: '600' }}>{service.name}</div>
                      <div style={{ color: '#64748B', fontSize: '10px' }}>{service.desc}</div>
                    </div>
                  </div>
                  <div style={{
                    background: `${service.color}20`,
                    padding: '4px 10px',
                    borderRadius: '14px',
                    border: `1px solid ${service.color}40`
                  }}>
                    <code style={{ color: service.color, fontSize: '11px', fontWeight: '600' }}>{service.port}</code>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Optional Firecrawl Compose */}
          <div style={{
            background: '#1A1F2E',
            borderRadius: '16px',
            border: '2px solid #F97316',
            overflow: 'hidden'
          }}>
            <div style={{
              background: '#F9731620',
              padding: '14px 18px',
              borderBottom: '1px solid #F9731640',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '20px' }}>🔥</span>
              <div>
                <div style={{ color: '#F97316', fontWeight: '700', fontSize: '13px' }}>docker-compose.yml</div>
                <div style={{ color: '#64748B', fontSize: '10px' }}>Optional - Firecrawl stack</div>
              </div>
            </div>
            <div style={{ padding: '14px' }}>
              {optionalServices.map((service, idx) => (
                <div key={service.name} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  marginBottom: idx < optionalServices.length - 1 ? '8px' : 0,
                  background: '#0F172A',
                  borderRadius: '10px',
                  borderLeft: `4px solid ${service.color}`
                }}>
                  <div>
                    <div style={{ color: '#E2E8F0', fontSize: '12px', fontWeight: '600' }}>{service.name}</div>
                    <div style={{ color: '#64748B', fontSize: '10px' }}>{service.desc}</div>
                  </div>
                  <div style={{
                    background: `${service.color}20`,
                    padding: '4px 10px',
                    borderRadius: '14px',
                    border: `1px solid ${service.color}40`
                  }}>
                    <code style={{ color: service.color, fontSize: '11px', fontWeight: '600' }}>{service.port}</code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Service Connections */}
        <div style={{
          background: '#1A1F2E',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '24px',
          border: '1px solid #334155'
        }}>
          <div style={{ color: '#94A3B8', fontSize: '11px', fontWeight: '600', letterSpacing: '1px', marginBottom: '14px' }}>
            SERVICE CONNECTIONS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {connections.map((conn, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                background: '#0F172A',
                borderRadius: '8px'
              }}>
                <span style={{ color: '#E2E8F0', fontSize: '11px', fontWeight: '500' }}>{conn.from}</span>
                <svg width="20" height="10" viewBox="0 0 20 10">
                  <line x1="0" y1="5" x2="14" y2="5" stroke={conn.color} strokeWidth="2" />
                  <polygon points="14,1 20,5 14,9" fill={conn.color} />
                </svg>
                <span style={{ color: '#E2E8F0', fontSize: '11px', fontWeight: '500' }}>{conn.to}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Start */}
        <div style={{
          background: '#0F172A',
          borderRadius: '12px',
          padding: '18px',
          border: '1px solid #334155'
        }}>
          <div style={{ color: '#94A3B8', fontSize: '11px', fontWeight: '600', letterSpacing: '1px', marginBottom: '12px' }}>QUICK START</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <div style={{ color: '#64748B', fontSize: '10px', marginBottom: '4px' }}># Start MongoDB + Redis stack</div>
              <code style={{
                display: 'block',
                background: '#1A1F2E',
                color: '#10B981',
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: "'JetBrains Mono', monospace"
              }}>
                docker-compose -f docker-compose.mongodb.yml up -d
              </code>
            </div>
            <div>
              <div style={{ color: '#64748B', fontSize: '10px', marginBottom: '4px' }}># Start Firecrawl stack (optional)</div>
              <code style={{
                display: 'block',
                background: '#1A1F2E',
                color: '#F97316',
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: "'JetBrains Mono', monospace"
              }}>
                docker-compose up -d
              </code>
            </div>
            <div>
              <div style={{ color: '#64748B', fontSize: '10px', marginBottom: '4px' }}># Start Next.js dev server</div>
              <code style={{
                display: 'block',
                background: '#1A1F2E',
                color: '#3B82F6',
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: "'JetBrains Mono', monospace"
              }}>
                npm run dev
              </code>
            </div>
          </div>
        </div>

        {/* Port Legend */}
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '12px' }}>
          {[
            { service: 'App', port: '3000', color: '#FFFFFF' },
            { service: 'MongoDB', port: '27017', color: '#22C55E' },
            { service: 'Redis', port: '6379', color: '#DC2626' },
            { service: 'Mongo Express', port: '8081', color: '#6B7280' },
            { service: 'Redis Commander', port: '8082', color: '#F59E0B' },
            { service: 'Firecrawl', port: '3002', color: '#F97316' }
          ].map((item) => (
            <div key={item.service} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: '#1A1F2E',
              borderRadius: '16px',
              border: `1px solid ${item.color}40`
            }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }} />
              <span style={{ color: '#94A3B8', fontSize: '10px' }}>{item.service}</span>
              <code style={{ color: item.color, fontSize: '10px', fontWeight: '600' }}>:{item.port}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DockerServicesDiagram;
