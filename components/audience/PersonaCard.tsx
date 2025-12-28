'use client';

import { useState } from 'react';
import { CustomerPersona, PainPoint } from '@/lib/query/audienceHooks';

interface PersonaCardProps {
  persona: CustomerPersona;
  onEdit?: (persona: CustomerPersona) => void;
  onDelete?: (personaId: string) => void;
}

const priorityLabels: Record<number, string> = {
  1: 'Primary',
  2: 'Secondary',
  3: 'Tertiary',
};

const priorityColors: Record<number, string> = {
  1: 'bg-green-500/20 text-green-400 border-green-500/30',
  2: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  3: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const severityColors: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400',
  high: 'bg-orange-500/20 text-orange-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  low: 'bg-green-500/20 text-green-400',
};

export function PersonaCard({ persona, onEdit, onDelete }: PersonaCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const priorityClass = priorityColors[persona.priority] || priorityColors[3];
  const priorityLabel = priorityLabels[persona.priority] || 'Other';

  return (
    <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold text-lg">
              {persona.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold text-[rgb(var(--foreground))]">{persona.name}</h3>
              {persona.title && (
                <p className="text-sm text-[rgb(var(--foreground-secondary))]">{persona.title}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 text-xs rounded-full border ${priorityClass}`}>
              {priorityLabel}
            </span>
            {/* Menu */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1 hover:bg-[rgb(var(--border))] rounded"
              >
                <svg className="w-5 h-5 text-[rgb(var(--foreground-secondary))]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-1 w-32 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-md shadow-lg z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.(persona);
                      setShowMenu(false);
                    }}
                    className="block w-full px-4 py-2 text-left text-sm hover:bg-[rgb(var(--border))] text-[rgb(var(--foreground))]"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(persona.id);
                      setShowMenu(false);
                    }}
                    className="block w-full px-4 py-2 text-left text-sm hover:bg-[rgb(var(--border))] text-red-400"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Info */}
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-[rgb(var(--foreground-secondary))]">
          {persona.industry && <span className="bg-[rgb(var(--border))] px-2 py-1 rounded">{persona.industry}</span>}
          {persona.companySize && <span className="bg-[rgb(var(--border))] px-2 py-1 rounded">{persona.companySize}</span>}
          {persona.seniorityLevel && <span className="bg-[rgb(var(--border))] px-2 py-1 rounded">{persona.seniorityLevel}</span>}
        </div>

        {/* Archetype */}
        {persona.archetype && (
          <div className="mt-2 text-sm text-[rgb(var(--foreground-secondary))]">
            <span className="text-purple-400">{persona.archetype}</span>
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-[rgb(var(--border))] pt-4 space-y-4">
          {/* Goals */}
          {persona.primaryGoals.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-[rgb(var(--foreground))] mb-2">Goals</h4>
              <ul className="space-y-1">
                {persona.primaryGoals.map((goal, i) => (
                  <li key={i} className="text-sm text-[rgb(var(--foreground-secondary))] flex items-start gap-2">
                    <span className="text-green-400">-</span>
                    {goal}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Frustrations */}
          {persona.frustrations.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-[rgb(var(--foreground))] mb-2">Frustrations</h4>
              <ul className="space-y-1">
                {persona.frustrations.map((frustration, i) => (
                  <li key={i} className="text-sm text-[rgb(var(--foreground-secondary))] flex items-start gap-2">
                    <span className="text-red-400">-</span>
                    {frustration}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pain Points */}
          {persona.painPoints.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-[rgb(var(--foreground))] mb-2">Pain Points</h4>
              <div className="space-y-2">
                {persona.painPoints.map((painPoint) => (
                  <PainPointBadge key={painPoint.id} painPoint={painPoint} />
                ))}
              </div>
            </div>
          )}

          {/* Key Messages */}
          {persona.keyMessages.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-[rgb(var(--foreground))] mb-2">Key Messages</h4>
              <ul className="space-y-1">
                {persona.keyMessages.map((message, i) => (
                  <li key={i} className="text-sm text-[rgb(var(--foreground-secondary))] italic">
                    &ldquo;{message}&rdquo;
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Information Sources */}
          {persona.informationSources.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-[rgb(var(--foreground))] mb-2">Information Sources</h4>
              <div className="flex flex-wrap gap-1">
                {persona.informationSources.map((source, i) => (
                  <span key={i} className="text-xs bg-[rgb(var(--border))] px-2 py-1 rounded">
                    {source}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Buying Behavior */}
          {persona.buyingRole && (
            <div>
              <h4 className="text-sm font-medium text-[rgb(var(--foreground))] mb-2">Buying Behavior</h4>
              <div className="text-sm text-[rgb(var(--foreground-secondary))] space-y-1">
                <p><span className="text-[rgb(var(--foreground))]">Role:</span> {persona.buyingRole}</p>
                {persona.purchaseTimeline && (
                  <p><span className="text-[rgb(var(--foreground))]">Timeline:</span> {persona.purchaseTimeline}</p>
                )}
                {persona.buyingCriteria.length > 0 && (
                  <p><span className="text-[rgb(var(--foreground))]">Criteria:</span> {persona.buyingCriteria.join(', ')}</p>
                )}
              </div>
            </div>
          )}

          {/* Needs Review Badge */}
          {persona.needsReview && (
            <div className="flex items-center gap-2 text-amber-400 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Needs Review
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PainPointBadge({ painPoint }: { painPoint: PainPoint }) {
  const severityClass = severityColors[painPoint.severity] || severityColors.medium;

  return (
    <div className="flex items-start gap-2 p-2 bg-[rgb(var(--background))] rounded">
      <span className={`text-xs px-2 py-0.5 rounded ${severityClass}`}>
        {painPoint.severity}
      </span>
      <div className="flex-1">
        <p className="text-sm text-[rgb(var(--foreground))]">{painPoint.title}</p>
        {painPoint.description && (
          <p className="text-xs text-[rgb(var(--foreground-secondary))] mt-1">{painPoint.description}</p>
        )}
      </div>
    </div>
  );
}

export default PersonaCard;
