'use client';

import { useState } from 'react';
import { ChevronDown, Edit2, Check, X } from 'lucide-react';

export interface IdentityCardData {
  mission?: string;
  vision?: string;
  coreValues?: string[];
  brandVoiceAttributes?: string[];
  uniqueSellingPropositions?: string[];
}

export interface CompetitorCardData {
  name: string;
  competitionType?: 'direct' | 'indirect' | 'aspirational';
  rationale?: string;
  confidence?: number;
}

export interface ProductCardData {
  name: string;
  description?: string;
  category?: string;
  features?: string[];
}

export interface ProfileReviewCardsProps {
  identityCard?: IdentityCardData;
  competitors?: CompetitorCardData[];
  products?: ProductCardData[];
  onIdentityChange?: (data: IdentityCardData) => void;
  onCompetitorsChange?: (data: CompetitorCardData[]) => void;
  onProductsChange?: (data: ProductCardData[]) => void;
}

interface EditingField {
  cardType: 'identity' | 'competitors' | 'products';
  fieldName: string;
  index?: number;
  value: any;
}

export default function ProfileReviewCards({
  identityCard,
  competitors = [],
  products = [],
  onIdentityChange,
  onCompetitorsChange,
  onProductsChange,
}: ProfileReviewCardsProps) {
  const [expandedCard, setExpandedCard] = useState<string | null>('identity');
  const [editingField, setEditingField] = useState<EditingField | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleStartEdit = (
    cardType: EditingField['cardType'],
    fieldName: string,
    value: any,
    index?: number,
  ) => {
    setEditingField({ cardType, fieldName, value, index });
    setEditValue(typeof value === 'string' ? value : JSON.stringify(value));
  };

  const handleSaveEdit = () => {
    if (!editingField) return;

    const { cardType, fieldName, index } = editingField;

    try {
      let newValue: any = editValue;

      // Try to parse as array if it looks like one
      if (editValue.includes(',')) {
        newValue = editValue
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean);
      }

      if (cardType === 'identity' && onIdentityChange) {
        const updated = {
          ...identityCard,
          [fieldName]: newValue,
        };
        onIdentityChange(updated);
      } else if (cardType === 'competitors' && onCompetitorsChange && index !== undefined) {
        const updated = [...competitors];
        updated[index] = { ...updated[index], [fieldName]: newValue };
        onCompetitorsChange(updated);
      } else if (cardType === 'products' && onProductsChange && index !== undefined) {
        const updated = [...products];
        updated[index] = { ...updated[index], [fieldName]: newValue };
        onProductsChange(updated);
      }

      setEditingField(null);
      setEditValue('');
    } catch (error) {
      console.error('Error saving edit:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const toggleCardExpanded = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  const ConfidenceBadge = ({ confidence }: { confidence?: number }) => {
    if (!confidence) return null;
    const percentage = Math.round(confidence * 100);
    let color = 'bg-error-background text-error';
    if (percentage >= 80) color = 'bg-success-background text-success';
    else if (percentage >= 60) color = 'bg-warning-background text-warning';
    else if (percentage >= 40) color = 'bg-warning-background text-warning';

    return (
      <span className={`text-xs px-2 py-1 rounded-full ${color} font-medium`}>
        {percentage}% confidence
      </span>
    );
  };

  const EditableField = ({
    label,
    value,
    onEdit,
    isEditing,
    onSave,
    onCancel,
  }: any) => {
    if (isEditing) {
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground-secondary">{label}</label>
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-primary-500 rounded bg-input text-foreground placeholder:text-foreground-muted"
            placeholder={`Enter ${label.toLowerCase()}`}
          />
          <div className="flex gap-2">
            <button
              onClick={onSave}
              className="px-3 py-1 bg-success-600 text-white text-sm rounded hover:bg-success-700 flex items-center gap-1"
            >
              <Check className="w-4 h-4" /> Save
            </button>
            <button
              onClick={onCancel}
              className="px-3 py-1 bg-surface-hover text-foreground-secondary text-sm rounded hover:bg-surface-active flex items-center gap-1"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-foreground-muted uppercase">{label}</p>
          <p className="text-sm text-foreground-secondary mt-1">
            {Array.isArray(value) ? value.join(', ') : value || '—'}
          </p>
        </div>
        <button
          onClick={() => onEdit(value)}
          className="p-1 hover:bg-surface-hover rounded text-foreground-muted hover:text-primary-600"
          title="Edit"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Brand Identity Card */}
      <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
        <button
          onClick={() => toggleCardExpanded('identity')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-surface-hover transition"
        >
          <h3 className="text-lg font-semibold text-foreground">
            Brand Identity
          </h3>
          <ChevronDown
            className={`w-5 h-5 transition-transform ${
              expandedCard === 'identity' ? 'rotate-180' : ''
            }`}
          />
        </button>

        {expandedCard === 'identity' && identityCard && (
          <div className="px-6 py-4 border-t border-border space-y-6">
            <EditableField
              label="Mission"
              value={identityCard.mission}
              isEditing={
                editingField?.cardType === 'identity' &&
                editingField?.fieldName === 'mission'
              }
              onEdit={() =>
                handleStartEdit(
                  'identity',
                  'mission',
                  identityCard.mission || '',
                )
              }
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
            />

            <EditableField
              label="Vision"
              value={identityCard.vision}
              isEditing={
                editingField?.cardType === 'identity' &&
                editingField?.fieldName === 'vision'
              }
              onEdit={() =>
                handleStartEdit(
                  'identity',
                  'vision',
                  identityCard.vision || '',
                )
              }
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
            />

            <EditableField
              label="Core Values"
              value={identityCard.coreValues}
              isEditing={
                editingField?.cardType === 'identity' &&
                editingField?.fieldName === 'coreValues'
              }
              onEdit={() =>
                handleStartEdit(
                  'identity',
                  'coreValues',
                  identityCard.coreValues || [],
                )
              }
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
            />

            <EditableField
              label="Brand Voice"
              value={identityCard.brandVoiceAttributes}
              isEditing={
                editingField?.cardType === 'identity' &&
                editingField?.fieldName === 'brandVoiceAttributes'
              }
              onEdit={() =>
                handleStartEdit(
                  'identity',
                  'brandVoiceAttributes',
                  identityCard.brandVoiceAttributes || [],
                )
              }
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
            />

            <EditableField
              label="Unique Selling Points"
              value={identityCard.uniqueSellingPropositions}
              isEditing={
                editingField?.cardType === 'identity' &&
                editingField?.fieldName === 'uniqueSellingPropositions'
              }
              onEdit={() =>
                handleStartEdit(
                  'identity',
                  'uniqueSellingPropositions',
                  identityCard.uniqueSellingPropositions || [],
                )
              }
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
            />
          </div>
        )}
      </div>

      {/* Competitors Card */}
      <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
        <button
          onClick={() => toggleCardExpanded('competitors')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-surface-hover transition"
        >
          <h3 className="text-lg font-semibold text-foreground">
            Competitors ({competitors.length})
          </h3>
          <ChevronDown
            className={`w-5 h-5 transition-transform ${
              expandedCard === 'competitors' ? 'rotate-180' : ''
            }`}
          />
        </button>

        {expandedCard === 'competitors' && (
          <div className="px-6 py-4 border-t border-border space-y-4">
            {competitors.length === 0 ? (
              <p className="text-foreground-muted text-sm">No competitors added</p>
            ) : (
              competitors.map((competitor, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-background-secondary rounded-lg border border-border"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-foreground">
                        {competitor.name}
                      </h4>
                      <p className="text-sm text-foreground-secondary mt-1">
                        {competitor.competitionType === 'direct'
                          ? '🔴 Direct Competitor'
                          : competitor.competitionType === 'indirect'
                          ? '🟡 Indirect Competitor'
                          : '⭐ Aspirational'}
                      </p>
                    </div>
                    <ConfidenceBadge confidence={competitor.confidence} />
                  </div>
                  <p className="text-sm text-foreground-secondary">
                    {competitor.rationale || '—'}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Products Card */}
      <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
        <button
          onClick={() => toggleCardExpanded('products')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-surface-hover transition"
        >
          <h3 className="text-lg font-semibold text-foreground">
            Products & Services ({products.length})
          </h3>
          <ChevronDown
            className={`w-5 h-5 transition-transform ${
              expandedCard === 'products' ? 'rotate-180' : ''
            }`}
          />
        </button>

        {expandedCard === 'products' && (
          <div className="px-6 py-4 border-t border-border space-y-4">
            {products.length === 0 ? (
              <p className="text-foreground-muted text-sm">
                No products detected. You can add them manually.
              </p>
            ) : (
              products.map((product, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-background-secondary rounded-lg border border-border"
                >
                  <h4 className="font-medium text-foreground">
                    {product.name}
                  </h4>
                  {product.category && (
                    <p className="text-xs text-foreground-secondary mt-1">
                      Category: {product.category}
                    </p>
                  )}
                  {product.description && (
                    <p className="text-sm text-foreground-secondary mt-2">
                      {product.description}
                    </p>
                  )}
                  {product.features && product.features.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-foreground-secondary">
                        Features:
                      </p>
                      <ul className="text-sm text-foreground-secondary list-disc list-inside mt-1">
                        {product.features.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
