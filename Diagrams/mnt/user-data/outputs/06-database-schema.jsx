import React, { useState } from 'react';

const DatabaseSchemaDiagram = () => {
  const [selectedEntity, setSelectedEntity] = useState(null);

  const entities = [
    { id: 'user', name: 'User', color: '#3B82F6', fields: [
      { name: 'id', type: 'String', pk: true },
      { name: 'email', type: 'String', unique: true },
      { name: 'password', type: 'String' },
      { name: 'accountType', type: 'String' },
      { name: 'subscription', type: 'String' },
      { name: 'mfaEnabled', type: 'Boolean' },
      { name: 'createdAt', type: 'DateTime' }
    ]},
    { id: 'organization', name: 'Organization', color: '#8B5CF6', fields: [
      { name: 'id', type: 'String', pk: true },
      { name: 'name', type: 'String' },
      { name: 'slug', type: 'String', unique: true }
    ]},
    { id: 'membership', name: 'Membership', color: '#EC4899', fields: [
      { name: 'id', type: 'String', pk: true },
      { name: 'userId', type: 'String', fk: 'User' },
      { name: 'organizationId', type: 'String', fk: 'Organization' }
    ]},
    { id: 'brandProfile', name: 'BrandProfile', color: '#10B981', fields: [
      { name: 'id', type: 'String', pk: true },
      { name: 'userId', type: 'String', fk: 'User' },
      { name: 'brandName', type: 'String' },
      { name: 'domain', type: 'String' },
      { name: 'category', type: 'String' },
      { name: 'crawlingStatus', type: 'String' }
    ]},
    { id: 'brand360Profile', name: 'Brand360Profile', color: '#14B8A6', fields: [
      { name: 'id', type: 'String', pk: true },
      { name: 'organizationId', type: 'String', fk: 'Organization' },
      { name: 'brandName', type: 'String' },
      { name: 'completionScore', type: 'Int' },
      { name: 'entityHealthScore', type: 'Int' },
      { name: 'lastAnalyzedAt', type: 'DateTime' }
    ]},
    { id: 'brandIdentity', name: 'BrandIdentity', color: '#F59E0B', fields: [
      { name: 'id', type: 'String', pk: true },
      { name: 'brandId', type: 'String', fk: 'BrandProfile' },
      { name: 'mission', type: 'String' },
      { name: 'vision', type: 'String' },
      { name: 'values', type: 'String[]' },
      { name: 'brandStory', type: 'String' }
    ]},
    { id: 'perceptionScan', name: 'PerceptionScan', color: '#6366F1', fields: [
      { name: 'id', type: 'String', pk: true },
      { name: 'brand360Id', type: 'String', fk: 'Brand360Profile' },
      { name: 'status', type: 'String' },
      { name: 'platforms', type: 'String[]' },
      { name: 'overallScore', type: 'Float' },
      { name: 'quadrantPosition', type: 'String' }
    ]},
    { id: 'aiPerceptionResult', name: 'AIPerceptionResult', color: '#DC2626', fields: [
      { name: 'id', type: 'String', pk: true },
      { name: 'promptId', type: 'String', fk: 'GeneratedPrompt' },
      { name: 'brand360Id', type: 'String', fk: 'Brand360Profile' },
      { name: 'platform', type: 'String' },
      { name: 'response', type: 'String' },
      { name: 'faithfulnessScore', type: 'Float' },
      { name: 'shareOfVoice', type: 'Float' },
      { name: 'hallucinationScore', type: 'Float' }
    ]},
    { id: 'generatedPrompt', name: 'GeneratedPrompt', color: '#22C55E', fields: [
      { name: 'id', type: 'String', pk: true },
      { name: 'brand360Id', type: 'String', fk: 'Brand360Profile' },
      { name: 'category', type: 'String' },
      { name: 'intent', type: 'String' },
      { name: 'template', type: 'String' },
      { name: 'renderedPrompt', type: 'String' }
    ]}
  ];

  const relationships = [
    { from: 'user', to: 'brandProfile', type: '1:0..1' },
    { from: 'user', to: 'membership', type: '1:N' },
    { from: 'organization', to: 'membership', type: '1:N' },
    { from: 'brandProfile', to: 'brandIdentity', type: '1:0..1' },
    { from: 'brand360Profile', to: 'perceptionScan', type: '1:N' },
    { from: 'brand360Profile', to: 'aiPerceptionResult', type: '1:N' },
    { from: 'brand360Profile', to: 'generatedPrompt', type: '1:N' },
    { from: 'perceptionScan', to: 'aiPerceptionResult', type: '1:N' },
    { from: 'generatedPrompt', to: 'aiPerceptionResult', type: '1:N' }
  ];

  const EntityCard = ({ entity }) => (
    <div onClick={() => setSelectedEntity(selectedEntity === entity.id ? null : entity.id)} style={{ background: '#1A1F2E', borderRadius: '10px', border: `2px solid ${entity.color}`, overflow: 'hidden', cursor: 'pointer', boxShadow: selectedEntity === entity.id ? `0 0 20px ${entity.color}40` : 'none', transition: 'box-shadow 0.2s' }}>
      <div style={{ background: entity.color, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M4 7V4h16v3M9 20h6M12 4v16" /></svg>
        <span style={{ color: 'white', fontWeight: '600', fontSize: '12px' }}>{entity.name}</span>
      </div>
      <div style={{ padding: '10px' }}>
        {entity.fields.map((field, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px', marginBottom: idx < entity.fields.length - 1 ? '2px' : 0, background: field.pk ? `${entity.color}20` : 'transparent', borderRadius: '3px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {field.pk && <span style={{ color: entity.color, fontSize: '8px' }}>🔑</span>}
              {field.fk && <span style={{ color: '#F59E0B', fontSize: '8px' }}>🔗</span>}
              <span style={{ color: '#E2E8F0', fontSize: '10px' }}>{field.name}</span>
            </div>
            <span style={{ color: '#64748B', fontSize: '8px' }}>{field.type}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0A0E17 0%, #131B2E 50%, #0A0E17 100%)', padding: '40px 24px', fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#F8FAFC', margin: '0 0 8px 0', fontFamily: "'Inter', sans-serif" }}>Database Schema (ERD)</h1>
        <p style={{ fontSize: '14px', color: '#64748B', margin: 0, fontFamily: "'Inter', sans-serif" }}>MongoDB collections and relationships</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ fontSize: '10px' }}>🔑</span><span style={{ color: '#94A3B8', fontSize: '11px' }}>Primary Key</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ fontSize: '10px' }}>🔗</span><span style={{ color: '#94A3B8', fontSize: '11px' }}>Foreign Key</span></div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {entities.map((entity) => (<EntityCard key={entity.id} entity={entity} />))}
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', background: '#1A1F2E', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
        <div style={{ color: '#94A3B8', fontSize: '11px', fontWeight: '600', letterSpacing: '1px', marginBottom: '14px', fontFamily: "'Inter', sans-serif" }}>RELATIONSHIPS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
          {relationships.map((rel, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#0F172A60', borderRadius: '6px' }}>
              <span style={{ color: entities.find(e => e.id === rel.from)?.color, fontSize: '11px', fontWeight: '600' }}>{entities.find(e => e.id === rel.from)?.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '20px', height: '1px', background: '#475569' }} />
                <span style={{ color: '#64748B', fontSize: '9px' }}>{rel.type}</span>
                <div style={{ width: '20px', height: '1px', background: '#475569' }} />
              </div>
              <span style={{ color: entities.find(e => e.id === rel.to)?.color, fontSize: '11px', fontWeight: '600' }}>{entities.find(e => e.id === rel.to)?.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DatabaseSchemaDiagram;
