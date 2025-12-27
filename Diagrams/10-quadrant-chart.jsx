import React, { useState } from 'react';

const QuadrantChart = () => {
  const [hoveredBrand, setHoveredBrand] = useState(null);

  const brands = [
    { id: 'A', name: 'Your Brand', x: 0.82, y: 0.88, quadrant: 'dominant', color: '#10B981', size: 36 },
    { id: 'B', name: 'Brand B', x: 0.25, y: 0.75, quadrant: 'niche', color: '#3B82F6', size: 28 },
    { id: 'C', name: 'Brand C', x: 0.18, y: 0.22, quadrant: 'invisible', color: '#EF4444', size: 24 },
    { id: 'D', name: 'Brand D', x: 0.78, y: 0.35, quadrant: 'vulnerable', color: '#F59E0B', size: 30 },
    { id: 'C1', name: 'Competitor 1', x: 0.65, y: 0.70, quadrant: 'dominant', color: '#6B7280', size: 26 },
    { id: 'C2', name: 'Competitor 2', x: 0.55, y: 0.45, quadrant: 'center', color: '#6B7280', size: 22 }
  ];

  const quadrants = [
    { id: 'niche', name: 'NICHE', position: 'top-left', color: '#3B82F6', desc: 'High Accuracy, Low Visibility', advice: 'Hidden gem - needs promotion' },
    { id: 'dominant', name: 'DOMINANT', position: 'top-right', color: '#22C55E', desc: 'High Accuracy, High Visibility', advice: 'Category leader - maintain position' },
    { id: 'invisible', name: 'INVISIBLE', position: 'bottom-left', color: '#EF4444', desc: 'Low Accuracy, Low Visibility', advice: 'Critical - needs full overhaul' },
    { id: 'vulnerable', name: 'VULNERABLE', position: 'bottom-right', color: '#F59E0B', desc: 'Low Accuracy, High Visibility', advice: 'Dangerous - fix misinformation' }
  ];

  const chartSize = 520;
  const padding = 60;
  const innerSize = chartSize - padding * 2;

  const getQuadrantStyle = (position) => {
    const base = {
      position: 'absolute',
      width: innerSize / 2,
      height: innerSize / 2,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '8px',
      transition: 'opacity 0.2s'
    };
    
    switch (position) {
      case 'top-right': return { ...base, top: padding, right: padding };
      case 'top-left': return { ...base, top: padding, left: padding };
      case 'bottom-right': return { ...base, bottom: padding, right: padding };
      case 'bottom-left': return { ...base, bottom: padding, left: padding };
      default: return base;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0A0A12 0%, #12121F 50%, #0A0A12 100%)',
      padding: '40px 24px',
      fontFamily: "'Inter', -apple-system, sans-serif"
    }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#F8FAFC', margin: '0 0 8px 0' }}>Brand Positioning Quadrant</h1>
        <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>AI Perception: Accuracy vs Visibility analysis</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        
        {/* Chart */}
        <div style={{
          position: 'relative',
          width: chartSize,
          height: chartSize,
          background: '#1A1F2E',
          borderRadius: '16px',
          border: '1px solid #334155'
        }}>
          {/* Quadrant backgrounds */}
          {quadrants.map((q) => (
            <div
              key={q.id}
              style={{
                ...getQuadrantStyle(q.position),
                background: `linear-gradient(135deg, ${q.color}08 0%, ${q.color}15 100%)`,
                border: `1px solid ${q.color}20`
              }}
            >
              <span style={{ color: q.color, fontSize: '11px', fontWeight: '700', letterSpacing: '1px', opacity: 0.5 }}>
                {q.name}
              </span>
            </div>
          ))}

          {/* Grid and axes */}
          <svg width={chartSize} height={chartSize} style={{ position: 'absolute', top: 0, left: 0 }}>
            {/* Center crosshairs */}
            <line x1={chartSize / 2} y1={padding} x2={chartSize / 2} y2={chartSize - padding} stroke="#475569" strokeWidth="2" strokeDasharray="6 4" />
            <line x1={padding} y1={chartSize / 2} x2={chartSize - padding} y2={chartSize / 2} stroke="#475569" strokeWidth="2" strokeDasharray="6 4" />
            
            {/* Grid lines */}
            {[0.25, 0.75].map((pos) => (
              <g key={pos}>
                <line x1={padding + pos * innerSize} y1={padding} x2={padding + pos * innerSize} y2={chartSize - padding} stroke="#334155" strokeWidth="1" strokeDasharray="3 6" />
                <line x1={padding} y1={padding + pos * innerSize} x2={chartSize - padding} y2={padding + pos * innerSize} stroke="#334155" strokeWidth="1" strokeDasharray="3 6" />
              </g>
            ))}
            
            {/* Outer border */}
            <rect x={padding} y={padding} width={innerSize} height={innerSize} fill="none" stroke="#475569" strokeWidth="1" rx="4" />
          </svg>

          {/* Axis labels */}
          <div style={{ position: 'absolute', bottom: '18px', left: '50%', transform: 'translateX(-50%)', color: '#94A3B8', fontSize: '12px', fontWeight: '600' }}>
            VISIBILITY →
          </div>
          <div style={{ position: 'absolute', bottom: '32px', left: padding, color: '#64748B', fontSize: '10px' }}>Low</div>
          <div style={{ position: 'absolute', bottom: '32px', right: padding, color: '#64748B', fontSize: '10px' }}>High</div>
          
          <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%) rotate(-90deg)', color: '#94A3B8', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' }}>
            ACCURACY →
          </div>
          <div style={{ position: 'absolute', left: '32px', bottom: padding + 8, color: '#64748B', fontSize: '10px' }}>Low</div>
          <div style={{ position: 'absolute', left: '32px', top: padding + 8, color: '#64748B', fontSize: '10px' }}>High</div>

          {/* Brand dots */}
          {brands.map((brand) => {
            const x = padding + brand.x * innerSize;
            const y = padding + (1 - brand.y) * innerSize;
            const isHovered = hoveredBrand === brand.id;
            const isYourBrand = brand.id === 'A';

            return (
              <div
                key={brand.id}
                onMouseEnter={() => setHoveredBrand(brand.id)}
                onMouseLeave={() => setHoveredBrand(null)}
                style={{
                  position: 'absolute',
                  left: x,
                  top: y,
                  transform: 'translate(-50%, -50%)',
                  cursor: 'pointer',
                  zIndex: isHovered ? 10 : isYourBrand ? 5 : 1
                }}
              >
                {/* Glow effect */}
                <div style={{
                  position: 'absolute',
                  width: isHovered ? brand.size * 1.8 : brand.size * 1.4,
                  height: isHovered ? brand.size * 1.8 : brand.size * 1.4,
                  borderRadius: '50%',
                  background: brand.color,
                  opacity: 0.2,
                  filter: 'blur(10px)',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  transition: 'all 0.2s'
                }} />
                
                {/* Main dot */}
                <div style={{
                  width: isHovered ? brand.size * 1.2 : brand.size,
                  height: isHovered ? brand.size * 1.2 : brand.size,
                  borderRadius: '50%',
                  background: isYourBrand ? `linear-gradient(135deg, ${brand.color}, ${brand.color}DD)` : brand.color,
                  border: isYourBrand ? '3px solid white' : '2px solid #0F172A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 4px 12px ${brand.color}60`,
                  transition: 'all 0.2s'
                }}>
                  <span style={{ color: 'white', fontSize: isHovered ? '13px' : '11px', fontWeight: '700' }}>{brand.id}</span>
                </div>

                {/* Tooltip */}
                {isHovered && (
                  <div style={{
                    position: 'absolute',
                    top: '-70px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#1E293B',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    border: `1px solid ${brand.color}`,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    zIndex: 100
                  }}>
                    <div style={{ color: '#F8FAFC', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>{brand.name}</div>
                    <div style={{ color: '#94A3B8', fontSize: '11px' }}>
                      Visibility: {(brand.x * 100).toFixed(0)}% | Accuracy: {(brand.y * 100).toFixed(0)}%
                    </div>
                    <div style={{ color: brand.color, fontSize: '10px', marginTop: '4px', textTransform: 'uppercase', fontWeight: '600' }}>
                      {brand.quadrant}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sidebar */}
        <div style={{ width: '300px' }}>
          {/* Quadrant Legend */}
          <div style={{
            background: '#1A1F2E',
            borderRadius: '12px',
            padding: '18px',
            marginBottom: '16px',
            border: '1px solid #334155'
          }}>
            <div style={{ color: '#94A3B8', fontSize: '11px', fontWeight: '600', letterSpacing: '1px', marginBottom: '14px' }}>QUADRANT LEGEND</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {quadrants.map((q) => (
                <div key={q.id} style={{
                  padding: '10px 12px',
                  background: '#0F172A',
                  borderRadius: '8px',
                  borderLeft: `4px solid ${q.color}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: q.color, boxShadow: `0 0 8px ${q.color}` }} />
                    <span style={{ color: q.color, fontSize: '12px', fontWeight: '700' }}>{q.name}</span>
                  </div>
                  <div style={{ color: '#94A3B8', fontSize: '10px', marginBottom: '2px' }}>{q.desc}</div>
                  <div style={{ color: '#64748B', fontSize: '9px', fontStyle: 'italic' }}>"{q.advice}"</div>
                </div>
              ))}
            </div>
          </div>

          {/* Brand List */}
          <div style={{
            background: '#1A1F2E',
            borderRadius: '12px',
            padding: '18px',
            border: '1px solid #334155'
          }}>
            <div style={{ color: '#94A3B8', fontSize: '11px', fontWeight: '600', letterSpacing: '1px', marginBottom: '14px' }}>BRANDS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {brands.map((brand) => (
                <div
                  key={brand.id}
                  onMouseEnter={() => setHoveredBrand(brand.id)}
                  onMouseLeave={() => setHoveredBrand(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: hoveredBrand === brand.id ? `${brand.color}15` : '#0F172A',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    border: hoveredBrand === brand.id ? `1px solid ${brand.color}40` : '1px solid transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: brand.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: '700',
                      border: brand.id === 'A' ? '2px solid white' : 'none'
                    }}>
                      {brand.id}
                    </div>
                    <div>
                      <div style={{ color: '#E2E8F0', fontSize: '12px', fontWeight: '500' }}>{brand.name}</div>
                      <div style={{ color: '#64748B', fontSize: '10px' }}>
                        V: {(brand.x * 100).toFixed(0)}% | A: {(brand.y * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                  <span style={{ 
                    color: brand.color, 
                    fontSize: '9px', 
                    fontWeight: '600', 
                    textTransform: 'uppercase',
                    background: `${brand.color}20`,
                    padding: '3px 8px',
                    borderRadius: '10px'
                  }}>
                    {brand.quadrant}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Metrics Legend */}
          <div style={{
            marginTop: '16px',
            background: '#0F172A',
            borderRadius: '10px',
            padding: '14px',
            border: '1px solid #334155'
          }}>
            <div style={{ color: '#64748B', fontSize: '10px', marginBottom: '8px' }}>AXIS CALCULATIONS</div>
            <div style={{ color: '#94A3B8', fontSize: '10px', lineHeight: 1.6 }}>
              <strong style={{ color: '#E2E8F0' }}>Visibility</strong> = avg(ShareOfVoice, BrandPosition)<br/>
              <strong style={{ color: '#E2E8F0' }}>Accuracy</strong> = avg(Faithfulness, 100 - HallucinationRate)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuadrantChart;
