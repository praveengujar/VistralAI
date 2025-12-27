import React, { useState } from 'react';

const DatabaseSchemaDiagram = () => {
  const [selectedEntity, setSelectedEntity] = useState(null);

  const entities = [
    {
      id: 'user', name: 'User', color: '#3B82F6',
      fields: [
        { name: 'id', type: 'ObjectId', pk: true },
        { name: 'email', type: 'String', unique: true },
        { name: 'password', type: 'String (hashed)' },
        { name: 'accountType', type: 'brand|agency|enterprise' },
        { name: 'subscription', type: 'free|pro|enterprise' },
        { name: 'mfaEnabled', type: 'Boolean' },
        { name: 'mfaSecret', type: 'String?' }
      ]
    },
    {
      id: 'organization', name: 'Organization', color: '#8B5CF6',
      fields: [
        { name: 'id', type: 'ObjectId', pk: true },
        { name: 'name', type: 'String' },
        { name: 'slug', type: 'String', unique: true },
        { name: 'plan', type: 'String' }
      ]
    },
    {
      id: 'membership', name: 'Membership', color: '#EC4899',
      fields: [
        { name: 'id', type: 'ObjectId', pk: true },
        { name: 'userId', type: 'ObjectId', fk: 'User' },
        { name: 'organizationId', type: 'ObjectId', fk: 'Organization' },
        { name: 'role', type: 'owner|admin|member' }
      ],
      indexes: ['@@unique([userId, organizationId])']
    },
    {
      id: 'session', name: 'Session', color: '#6B7280',
      fields: [
        { name: 'id', type: 'ObjectId', pk: true },
        { name: 'userId', type: 'ObjectId', fk: 'User' },
        { name: 'expires', type: 'DateTime' },
        { name: 'sessionToken', type: 'String', unique: true }
      ],
      indexes: ['@@index([userId, expires])']
    },
    {
      id: 'auditLog', name: 'AuditLog', color: '#F59E0B',
      fields: [
        { name: 'id', type: 'ObjectId', pk: true },
        { name: 'userId', type: 'ObjectId', fk: 'User' },
        { name: 'organizationId', type: 'ObjectId?' },
        { name: 'action', type: 'String' },
        { name: 'metadata', type: 'Json' },
        { name: 'createdAt', type: 'DateTime' }
      ],
      indexes: ['@@index([userId, createdAt])', '@@index([action, createdAt])']
    },
    {
      id: 'brand360Profile', name: 'Brand360Profile', color: '#10B981',
      fields: [
        { name: 'id', type: 'ObjectId', pk: true },
        { name: 'organizationId', type: 'ObjectId', fk: 'Organization' },
        { name: 'brandName', type: 'String' },
        { name: 'completionScore', type: 'Number (0-100)' },
        { name: 'entityHealthScore', type: 'Number (0-100)' }
      ],
      indexes: ['@@index([organizationId])']
    },
    {
      id: 'generatedPrompt', name: 'GeneratedPrompt', color: '#6366F1',
      fields: [
        { name: 'id', type: 'ObjectId', pk: true },
        { name: 'brand360Id', type: 'ObjectId', fk: 'Brand360Profile' },
        { name: 'category', type: 'nav|func|comp|voice|adv' },
        { name: 'intent', type: 'String' },
        { name: 'template', type: 'String' },
        { name: 'renderedPrompt', type: 'String' },
        { name: 'isActive', type: 'Boolean' }
      ],
      indexes: ['@@index([brand360Id, category, isActive])']
    },
    {
      id: 'perceptionScan', name: 'PerceptionScan', color: '#14B8A6',
      fields: [
        { name: 'id', type: 'ObjectId', pk: true },
        { name: 'brand360Id', type: 'ObjectId', fk: 'Brand360Profile' },
        { name: 'status', type: 'pending|running|completed|failed' },
        { name: 'platforms', type: 'String[]' },
        { name: 'overallScore', type: 'Number?' },
        { name: 'quadrantPosition', type: 'Json?' }
      ],
      indexes: ['@@index([brand360Id, status])']
    },
    {
      id: 'aiPerceptionResult', name: 'AIPerceptionResult', color: '#DC2626',
      fields: [
        { name: 'id', type: 'ObjectId', pk: true },
        { name: 'promptId', type: 'ObjectId', fk: 'GeneratedPrompt' },
        { name: 'brand360Id', type: 'ObjectId', fk: 'Brand360Profile' },
        { name: 'scanId', type: 'ObjectId', fk: 'PerceptionScan' },
        { name: 'platform', type: 'claude|chatgpt|gemini|perplexity' },
        { name: 'faithfulnessScore', type: 'Number (0-100)' },
        { name: 'shareOfVoice', type: 'Number (0-100)' },
        { name: 'hallucinationScore', type: 'Number (0-100)' }
      ],
      indexes: ['@@index([brand360Id, platform])', '@@index([scanId, platform])']
    },
    {
      id: 'perceptionInsight', name: 'PerceptionInsight', color: '#EC4899',
      fields: [
        { name: 'id', type: 'ObjectId', pk: true },
        { name: 'brand360Id', type: 'ObjectId', fk: 'Brand360Profile' },
        { name: 'category', type: 'visibility|accuracy|...' },
        { name: 'priority', type: 'critical|high|medium|low' },
        { name: 'status', type: 'open|in_progress|resolved|dismissed' }
      ],
      indexes: ['@@index([brand360Id, status, priority])']
    },
    {
      id: 'correctionWorkflow', name: 'CorrectionWorkflow', color: '#F97316',
      fields: [
        { name: 'id', type: 'ObjectId', pk: true },
        { name: 'brand360Id', type: 'ObjectId', fk: 'Brand360Profile' },
        { name: 'insightId', type: 'ObjectId', fk: 'PerceptionInsight' },
        { name: 'status', type: 'suggested|approved|implemented|verified' },
        { name: 'schemaOrgFix', type: 'Json?' },
        { name: 'faqPageSuggestion', type: 'String?' }
      ],
      indexes: ['@@index([brand360Id])']
    }
  ];

  const relationships = [
    { from: 'user', to: 'session', type: '1:N', label: 'has many' },
    { from: 'user', to: 'membership', type: '1:N', label: 'has many' },
    { from: 'organization', to: 'membership', type: '1:N', label: 'has many' },
    { from: 'organization', to: 'brand360Profile', type: '1:N', label: 'has many' },
    { from: 'brand360Profile', to: 'generatedPrompt', type: '1:N', label: 'has many' },
    { from: 'brand360Profile', to: 'perceptionScan', type: '1:N', label: 'has many' },
    { from: 'brand360Profile', to: 'aiPerceptionResult', type: '1:N', label: 'has many' },
    { from: 'brand360Profile', to: 'perceptionInsight', type: '1:N', label: 'has many' },
    { from: 'perceptionScan', to: 'aiPerceptionResult', type: '1:N', label: 'contains' },
    { from: 'generatedPrompt', to: 'aiPerceptionResult', type: '1:N', label: 'produces' },
    { from: 'perceptionInsight', to: 'correctionWorkflow', type: '1:1', label: 'triggers' }
  ];

  const embeddedDocs = [
    { parent: 'Brand360Profile', children: ['EntityHome', 'OrganizationSchema', 'BrandIdentityPrism', 'BrandArchetype', 'BrandVoiceProfile', 'ClaimLocker', 'CompetitorGraph', 'RiskFactors', 'CustomerPersona[]', 'Product[]'] }
  ];

  const EntityCard = ({ entity }) => (
    <div
      style={{
        background: '#1A1F2E',
        borderRadius: '10px',
        border: `2px solid ${entity.color}`,
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: selectedEntity === entity.id ? `0 0 20px ${entity.color}40` : 'none',
        transition: 'box-shadow 0.2s'
      }}
      onClick={() => setSelectedEntity(selectedEntity === entity.id ? null : entity.id)}
    >
      <div style={{
        background: entity.color,
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M4 7V4h16v3M9 20h6M12 4v16" />
        </svg>
        <span style={{ color: 'white', fontWeight: '600', fontSize: '12px' }}>{entity.name}</span>
      </div>
      
      <div style={{ padding: '10px' }}>
        {entity.fields.map((field, idx) => (
          <div key={idx} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 6px',
            marginBottom: idx < entity.fields.length - 1 ? '2px' : 0,
            background: field.pk ? `${entity.color}20` : 'transparent',
            borderRadius: '3px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {field.pk && <span style={{ color: entity.color, fontSize: '8px' }}>🔑</span>}
              {field.fk && <span style={{ color: '#F59E0B', fontSize: '8px' }}>🔗</span>}
              <span style={{ color: '#E2E8F0', fontSize: '10px' }}>{field.name}</span>
            </div>
            <span style={{ color: '#64748B', fontSize: '8px' }}>{field.type}</span>
          </div>
        ))}
        {entity.indexes && (
          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #334155' }}>
            {entity.indexes.map((idx, i) => (
              <code key={i} style={{
                display: 'block',
                background: '#0F172A',
                color: '#F59E0B',
                padding: '3px 6px',
                borderRadius: '3px',
                fontSize: '8px',
                marginBottom: i < entity.indexes.length - 1 ? '3px' : 0
              }}>{idx}</code>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0A0E17 0%, #131B2E 50%, #0A0E17 100%)',
      padding: '40px 24px',
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace"
    }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#F8FAFC', margin: '0 0 8px 0', fontFamily: "'Inter', sans-serif" }}>
          Database Schema (ERD)
        </h1>
        <p style={{ fontSize: '14px', color: '#64748B', margin: 0, fontFamily: "'Inter', sans-serif" }}>
          MongoDB collections with composite indexes
        </p>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '10px' }}>🔑</span>
          <span style={{ color: '#94A3B8', fontSize: '11px' }}>Primary Key</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '10px' }}>🔗</span>
          <span style={{ color: '#94A3B8', fontSize: '11px' }}>Foreign Key</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: '#F59E0B', fontSize: '11px' }}>@@index</span>
          <span style={{ color: '#64748B', fontSize: '11px' }}>Composite Index</span>
        </div>
      </div>

      {/* Entity Grid */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        {entities.map((entity) => (
          <EntityCard key={entity.id} entity={entity} />
        ))}
      </div>

      {/* Relationships */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto 32px',
        background: '#1A1F2E',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #334155'
      }}>
        <div style={{ color: '#94A3B8', fontSize: '11px', fontWeight: '600', letterSpacing: '1px', marginBottom: '14px', fontFamily: "'Inter', sans-serif" }}>
          RELATIONSHIPS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
          {relationships.map((rel, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px',
              background: '#0F172A60',
              borderRadius: '6px'
            }}>
              <span style={{ color: entities.find(e => e.id === rel.from)?.color, fontSize: '11px', fontWeight: '600' }}>
                {entities.find(e => e.id === rel.from)?.name}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: '#64748B', fontSize: '9px' }}>{rel.type.split(':')[0]}</span>
                <div style={{ width: '30px', height: '1px', background: '#475569' }} />
                <span style={{ color: '#64748B', fontSize: '9px' }}>{rel.type.split(':')[1]}</span>
              </div>
              <span style={{ color: entities.find(e => e.id === rel.to)?.color, fontSize: '11px', fontWeight: '600' }}>
                {entities.find(e => e.id === rel.to)?.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Embedded Documents */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        background: '#1A1F2E',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #334155'
      }}>
        <div style={{ color: '#94A3B8', fontSize: '11px', fontWeight: '600', letterSpacing: '1px', marginBottom: '14px', fontFamily: "'Inter', sans-serif" }}>
          EMBEDDED DOCUMENTS
        </div>
        {embeddedDocs.map((doc, idx) => (
          <div key={idx}>
            <div style={{ color: '#10B981', fontSize: '12px', fontWeight: '600', marginBottom: '10px' }}>{doc.parent}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {doc.children.map((child, cidx) => (
                <code key={cidx} style={{
                  background: '#0F172A',
                  color: '#94A3B8',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '10px',
                  border: '1px solid #334155'
                }}>{child}</code>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DatabaseSchemaDiagram;
