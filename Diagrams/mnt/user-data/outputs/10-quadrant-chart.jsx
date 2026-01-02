import React, { useState } from 'react';

const QuadrantChart = () => {
  const [hoveredBrand, setHoveredBrand] = useState(null);

  const brands = [
    { id: 'A', name: 'Brand A', x: 0.8, y: 0.85, quadrant: 'dominant', color: '#10B981', size: 36 },
    { id: 'B', name: 'Brand B', x: 0.3, y: 0.7, quadrant: 'niche', color: '#3B82F6', size: 28 },
    { id: 'C', name: 'Brand C', x: 0.2, y: 0.3, quadrant: 'invisible', color: '#EF4444', size: 24 },
    { id: 'D', name: 'Brand D', x: 0.75, y: 0.4, quadrant: 'vulnerable', color: '#F59E0B', size: 30 }
  ];

  const quadrants = [
    { id: 'niche', name: 'NICHE', position: 'top-left', color: '#3B82F6', advice: 'Hidden gem - needs promotion' },
    { id: 'dominant', name: 'DOMINANT', position: 'top-right', color: '#22C55E', advice: 'Category leader - maintain position' },
    { id: 'invisible', name: 'INVISIBLE', position: 'bottom-left', color: '#EF4444', advice: 'Critical - needs full overhaul' },
    { id: 'vulnerable', name: 'VULNERABLE', position: 'bottom-right', color: '#F59E0B', advice: 'Dangerous - fix misinformation' }
  ];

  const chartSize = 480;
  const padding = 50;
  const innerSize = chartSize - padding * 2;

  const getQuadrantStyle = (position) => {
    const base = { position: 'absolute', width: innerSize / 2, height: innerSize / 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' };
    switch (position) {
      case 'top-right': return { ...base, top: padding, right: padding };
      case 'top-left': return { ...base, top: padding, left: padding };
      case 'bottom-right': return { ...base, bottom: padding, right: padding };
      case 'bottom-left': return { ...base, bottom: padding, left: padding };
      default: return base;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0A0A12 0%, #12121F 50%, #0A0A12 100%)', padding: '40px 24px', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#F8FAFC', margin: '0 0 8px 0' }}>Brand Positioning Quadrant</h1>
        <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>Accuracy vs Visibility analysis</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        
        {/* Chart */}
        <div style={{ position: 'relative', width: chartSize, height: chartSize, background: '#1A1F2E', borderRadius: '16px', border: '1px solid #334155' }}>
          {quadrants.map((q) => (
            <div key={q.id} style={{ ...getQuadrantStyle(q.position), background: `linear-gradient(135deg, ${q.color}08 0%, ${q.color}15 100%)`, border: `1px solid ${q.color}20` }}>
              <span style={{ color: q.color, fontSize: '11px', fontWeight: '700', letterSpacing: '1px', opacity: 0.5 }}>{q.name}</span>
            </div>
          ))}

          <svg width={chartSize} height={chartSize} style={{ position: 'absolute', top: 0, left: 0 }}>
            <line x1={chartSize / 2} y1={padding} x2={chartSize / 2} y2={chartSize - padding} stroke="#475569" strokeWidth="2" strokeDasharray="6 4" />
            <line x1={padding} y1={chartSize / 2} x2={chartSize - padding} y2={chartSize / 2} stroke="#475569" strokeWidth="2" strokeDasharray="6 4" />
            <rect x={padding} y={padding} width={innerSize} height={innerSize} fill="none" stroke="#475569" strokeWidth="1" rx="4" />
          </svg>

          <div style={{ position: 'absolute', bottom: '18px', left: '50%', transform: 'translateX(-50%)', color: '#94A3B8', fontSize: '12px', fontWeight: '600' }}>VISIBILITY →</div>
          <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%) rotate(-90deg)', color: '#94A3B8', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' }}>ACCURACY →</div>

          {brands.map((brand) => {
            const x = padding + brand.x * innerSize;
            const y = padding + (1 - brand.y) * innerSize;
            const isHovered = hoveredBrand === brand.id;

            return (
              <div key={brand.id} onMouseEnter={() => setHoveredBrand(brand.id)} onMouseLeave={() => setHoveredBrand(null)} style={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)', cursor: 'pointer', zIndex: isHovered ? 10 : 1 }}>
                <div style={{ position: 'absolute', width: isHovered ? brand.size * 1.8 : brand.size * 1.4, height: isHovered ? brand.size * 1.8 : brand.size * 1.4, borderRadius: '50%', background: brand.color, opacity: 0.2, filter: 'blur(10px)', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', transition: 'all 0.2s' }} />
                <div style={{ width: isHovered ? brand.size * 1.2 : brand.size, height: isHovered ? brand.size * 1.2 : brand.size, borderRadius: '50%', background: brand.color, border: '2px solid #0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${brand.color}60`, transition: 'all 0.2s' }}>
                  <span style={{ color: 'white', fontSize: isHovered ? '13px' : '11px', fontWeight: '700' }}>{brand.id}</span>
                </div>
                {isHovered && (
                  <div style={{ position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)', background: '#1E293B', borderRadius: '10px', padding: '10px 14px', border: `1px solid ${brand.color}`, whiteSpace: 'nowrap', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 100 }}>
                    <div style={{ color: '#F8FAFC', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>{brand.name}</div>
                    <div style={{ color: '#94A3B8', fontSize: '11px' }}>Vis: {(brand.x * 100).toFixed(0)}% | Acc: {(brand.y * 100).toFixed(0)}%</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sidebar */}
        <div style={{ width: '280px' }}>
          <div style={{ background: '#1A1F2E', borderRadius: '12px', padding: '18px', marginBottom: '16px', border: '1px solid #334155' }}>
            <div style={{ color: '#94A3B8', fontSize: '11px', fontWeight: '600', letterSpacing: '1px', marginBottom: '14px' }}>QUADRANT LEGEND</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {quadrants.map((q) => (
                <div key={q.id} style={{ padding: '10px 12px', background: '#0F172A', borderRadius: '8px', borderLeft: `4px solid ${q.color}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: q.color, boxShadow: `0 0 8px ${q.color}` }} />
                    <span style={{ color: q.color, fontSize: '12px', fontWeight: '700' }}>{q.name}</span>
                  </div>
                  <div style={{ color: '#64748B', fontSize: '9px', fontStyle: 'italic' }}>"{q.advice}"</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: '#1A1F2E', borderRadius: '12px', padding: '18px', border: '1px solid #334155' }}>
            <div style={{ color: '#94A3B8', fontSize: '11px', fontWeight: '600', letterSpacing: '1px', marginBottom: '14px' }}>BRANDS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {brands.map((brand) => (
                <div key={brand.id} onMouseEnter={() => setHoveredBrand(brand.id)} onMouseLeave={() => setHoveredBrand(null)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: hoveredBrand === brand.id ? `${brand.color}15` : '#0F172A', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s', border: hoveredBrand === brand.id ? `1px solid ${brand.color}40` : '1px solid transparent' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: brand.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: '700' }}>{brand.id}</div>
                    <div>
                      <div style={{ color: '#E2E8F0', fontSize: '12px', fontWeight: '500' }}>{brand.name}</div>
                      <div style={{ color: '#64748B', fontSize: '10px' }}>V: {(brand.x * 100).toFixed(0)}% | A: {(brand.y * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                  <span style={{ color: brand.color, fontSize: '9px', fontWeight: '600', textTransform: 'uppercase', background: `${brand.color}20`, padding: '3px 8px', borderRadius: '10px' }}>{brand.quadrant}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuadrantChart;
