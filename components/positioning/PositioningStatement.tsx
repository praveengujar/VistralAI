'use client';

import { useState } from 'react';
import { MarketPositioning } from '@/lib/query/audienceHooks';

interface PositioningStatementProps {
  positioning: MarketPositioning | null;
  onEdit?: (field: string, value: string) => void;
  editable?: boolean;
}

interface StatementPart {
  label: string;
  field: keyof MarketPositioning;
  placeholder: string;
  color: string;
}

const statementParts: StatementPart[] = [
  { label: 'For', field: 'targetAudienceSummary', placeholder: '[target audience]', color: 'text-blue-400' },
  { label: 'who', field: 'categoryDefinition', placeholder: '[need/problem]', color: 'text-purple-400' },
  { label: 'our product is a', field: 'categoryPosition', placeholder: '[category]', color: 'text-green-400' },
  { label: 'that provides', field: 'primaryBenefit', placeholder: '[key benefit]', color: 'text-yellow-400' },
  { label: 'Unlike', field: 'competitiveAlternative', placeholder: '[competitors]', color: 'text-red-400' },
  { label: 'we', field: 'primaryDifferentiator', placeholder: '[key differentiator]', color: 'text-cyan-400' },
];

export function PositioningStatement({ positioning, onEdit, editable = false }: PositioningStatementProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEditing = (field: string, currentValue: string) => {
    if (!editable) return;
    setEditingField(field);
    setEditValue(currentValue || '');
  };

  const saveEdit = () => {
    if (editingField && onEdit) {
      onEdit(editingField, editValue);
    }
    setEditingField(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const getValue = (field: keyof MarketPositioning): string => {
    if (!positioning) return '';
    const value = positioning[field];
    if (typeof value === 'string') return value;
    return '';
  };

  return (
    <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[rgb(var(--foreground))]">Positioning Statement</h3>
        {editable && (
          <span className="text-xs text-[rgb(var(--foreground-secondary))]">Click to edit</span>
        )}
      </div>

      {/* Full Statement Preview */}
      {positioning?.positioningStatement && (
        <div className="mb-6 p-4 bg-[rgb(var(--background))] rounded-lg">
          <p className="text-[rgb(var(--foreground))] italic">
            &ldquo;{positioning.positioningStatement}&rdquo;
          </p>
        </div>
      )}

      {/* Statement Builder */}
      <div className="space-y-4">
        {statementParts.map((part, index) => (
          <div key={part.field} className="flex items-start gap-3">
            <span className="text-[rgb(var(--foreground-secondary))] min-w-[80px] text-right">
              {part.label}
            </span>

            {editingField === part.field ? (
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="flex-1 px-3 py-1 bg-[rgb(var(--background))] border border-[rgb(var(--border))] rounded text-[rgb(var(--foreground))] focus:outline-none focus:border-blue-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit();
                    if (e.key === 'Escape') cancelEdit();
                  }}
                />
                <button
                  onClick={saveEdit}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  className="px-3 py-1 bg-[rgb(var(--border))] text-[rgb(var(--foreground))] rounded text-sm hover:bg-[rgb(var(--border))]/80"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div
                onClick={() => startEditing(part.field, getValue(part.field))}
                className={`flex-1 ${editable ? 'cursor-pointer hover:bg-[rgb(var(--border))]/30' : ''} p-1 rounded transition-colors`}
              >
                {getValue(part.field) ? (
                  <span className={part.color}>{getValue(part.field)}</span>
                ) : (
                  <span className="text-[rgb(var(--foreground-secondary))] opacity-50">
                    {part.placeholder}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Reason to Believe */}
      {positioning?.reasonToBelieve && (
        <div className="mt-6 pt-4 border-t border-[rgb(var(--border))]">
          <h4 className="text-sm font-medium text-[rgb(var(--foreground))] mb-2">Reason to Believe</h4>
          <p className="text-sm text-[rgb(var(--foreground-secondary))]">{positioning.reasonToBelieve}</p>
        </div>
      )}

      {/* Elevator Pitch */}
      {positioning?.elevatorPitch && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-[rgb(var(--foreground))] mb-2">Elevator Pitch</h4>
          <p className="text-sm text-[rgb(var(--foreground-secondary))]">{positioning.elevatorPitch}</p>
        </div>
      )}
    </div>
  );
}

export function ValuePropositionCards({ positioning }: { positioning: MarketPositioning | null }) {
  if (!positioning?.valuePropositions?.length) {
    return (
      <div className="text-center py-8 text-[rgb(var(--foreground-secondary))]">
        No value propositions defined
      </div>
    );
  }

  const typeColors: Record<string, string> = {
    Primary: 'bg-green-500/20 text-green-400 border-green-500/30',
    Secondary: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Product-Specific': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {positioning.valuePropositions.map((vp) => (
        <div
          key={vp.id}
          className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg p-4"
        >
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium text-[rgb(var(--foreground))]">{vp.headline}</h4>
            <span className={`text-xs px-2 py-1 rounded border ${typeColors[vp.type] || typeColors.Primary}`}>
              {vp.type}
            </span>
          </div>
          {vp.subheadline && (
            <p className="text-sm text-[rgb(var(--foreground-secondary))] mb-2">{vp.subheadline}</p>
          )}
          {vp.description && (
            <p className="text-sm text-[rgb(var(--foreground-secondary))]">{vp.description}</p>
          )}

          {/* Value Types */}
          <div className="mt-3 space-y-1 text-xs">
            {vp.functionalValue && (
              <div className="flex items-start gap-2">
                <span className="text-blue-400 min-w-[80px]">Functional:</span>
                <span className="text-[rgb(var(--foreground-secondary))]">{vp.functionalValue}</span>
              </div>
            )}
            {vp.emotionalValue && (
              <div className="flex items-start gap-2">
                <span className="text-pink-400 min-w-[80px]">Emotional:</span>
                <span className="text-[rgb(var(--foreground-secondary))]">{vp.emotionalValue}</span>
              </div>
            )}
            {vp.economicValue && (
              <div className="flex items-start gap-2">
                <span className="text-green-400 min-w-[80px]">Economic:</span>
                <span className="text-[rgb(var(--foreground-secondary))]">{vp.economicValue}</span>
              </div>
            )}
          </div>

          {/* Customer Quote */}
          {vp.customerQuote && (
            <div className="mt-3 p-2 bg-[rgb(var(--background))] rounded italic text-xs text-[rgb(var(--foreground-secondary))]">
              &ldquo;{vp.customerQuote}&rdquo;
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function ProofPointsList({ positioning }: { positioning: MarketPositioning | null }) {
  if (!positioning?.proofPoints?.length) {
    return (
      <div className="text-center py-8 text-[rgb(var(--foreground-secondary))]">
        No proof points defined
      </div>
    );
  }

  const typeIcons: Record<string, string> = {
    Statistic: '📊',
    CaseStudy: '📖',
    Award: '🏆',
    Certification: '✓',
    Testimonial: '💬',
  };

  // Group by type
  const groupedProofs = positioning.proofPoints.reduce((acc, proof) => {
    const type = proof.type || 'Other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(proof);
    return acc;
  }, {} as Record<string, typeof positioning.proofPoints>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedProofs).map(([type, proofs]) => (
        <div key={type}>
          <h4 className="text-sm font-medium text-[rgb(var(--foreground))] mb-3 flex items-center gap-2">
            <span>{typeIcons[type] || '📌'}</span>
            {type}s
          </h4>
          <div className="space-y-2">
            {proofs.map((proof) => (
              <div
                key={proof.id}
                className="flex items-start gap-3 p-3 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[rgb(var(--foreground))]">{proof.title}</span>
                    {proof.isVerified && (
                      <span className="text-xs text-green-400 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Verified
                      </span>
                    )}
                  </div>
                  {proof.metricValue && (
                    <p className="text-lg font-semibold text-blue-400 mt-1">{proof.metricValue}</p>
                  )}
                  {proof.description && (
                    <p className="text-sm text-[rgb(var(--foreground-secondary))] mt-1">{proof.description}</p>
                  )}
                  {proof.source && (
                    <p className="text-xs text-[rgb(var(--foreground-secondary))] mt-2">
                      Source: {proof.sourceUrl ? (
                        <a href={proof.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                          {proof.source}
                        </a>
                      ) : proof.source}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default PositioningStatement;
