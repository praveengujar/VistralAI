'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Check,
  Wand2,
  Loader2,
  Globe,
  Star,
} from 'lucide-react';

interface ReviewWebsite {
  id: string;
  name: string;
  slug: string;
  domain: string;
  reviewType: string;
  audienceType: string;
  priority: number;
}

interface ReviewCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  websites: ReviewWebsite[];
}

interface ReviewSiteSelectorProps {
  brand360Id: string;
  selectedWebsiteIds: string[];
  onSelectionChange: (websiteIds: string[]) => void;
  includeReviewSites: boolean;
  onIncludeChange: (include: boolean) => void;
  className?: string;
}

export default function ReviewSiteSelector({
  brand360Id,
  selectedWebsiteIds,
  onSelectionChange,
  includeReviewSites,
  onIncludeChange,
  className = '',
}: ReviewSiteSelectorProps) {
  const [categories, setCategories] = useState<ReviewCategory[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all categories with websites
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/review-sites/categories');
        if (!res.ok) throw new Error('Failed to fetch categories');
        const data = await res.json();
        setCategories(data.data?.categories || []);
      } catch (err) {
        console.error('Error fetching review categories:', err);
        setError('Failed to load review sites');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Toggle category expansion
  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  // Toggle website selection
  const toggleWebsite = useCallback(
    (websiteId: string) => {
      const next = selectedWebsiteIds.includes(websiteId)
        ? selectedWebsiteIds.filter((id) => id !== websiteId)
        : [...selectedWebsiteIds, websiteId];
      onSelectionChange(next);
    },
    [selectedWebsiteIds, onSelectionChange]
  );

  // Toggle all websites in a category
  const toggleCategoryWebsites = useCallback(
    (category: ReviewCategory) => {
      const categoryWebsiteIds = category.websites.map((w) => w.id);
      const allSelected = categoryWebsiteIds.every((id) =>
        selectedWebsiteIds.includes(id)
      );

      if (allSelected) {
        // Remove all category websites
        onSelectionChange(
          selectedWebsiteIds.filter((id) => !categoryWebsiteIds.includes(id))
        );
      } else {
        // Add all category websites
        const newSelection = new Set([...selectedWebsiteIds, ...categoryWebsiteIds]);
        onSelectionChange(Array.from(newSelection));
      }
    },
    [selectedWebsiteIds, onSelectionChange]
  );

  // Auto-detect categories
  const handleAutoDetect = async () => {
    if (!brand360Id) return;

    try {
      setIsAutoDetecting(true);
      setError(null);

      const res = await fetch('/api/review-sites/auto-detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand360Id,
          applyMappings: false, // Don't persist, just suggest
        }),
      });

      if (!res.ok) throw new Error('Failed to auto-detect');
      const data = await res.json();

      const detected = data.data?.detected || [];
      if (detected.length > 0) {
        // Get websites from detected categories
        const detectedCategoryIds = detected.map((d: { categoryId: string }) => d.categoryId);
        const websiteIds: string[] = [];

        categories.forEach((category) => {
          if (detectedCategoryIds.includes(category.id)) {
            category.websites.forEach((w) => websiteIds.push(w.id));
            // Auto-expand detected categories
            setExpandedCategories((prev) => new Set([...prev, category.id]));
          }
        });

        onSelectionChange(websiteIds);
        onIncludeChange(true);
      }
    } catch (err) {
      console.error('Error auto-detecting categories:', err);
      setError('Failed to auto-detect categories');
    } finally {
      setIsAutoDetecting(false);
    }
  };

  // Count selected websites per category
  const getSelectedCount = useCallback(
    (category: ReviewCategory) => {
      return category.websites.filter((w) =>
        selectedWebsiteIds.includes(w.id)
      ).length;
    },
    [selectedWebsiteIds]
  );

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin text-[rgb(var(--foreground-secondary))]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`py-4 text-center text-red-500 ${className}`}>
        {error}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with toggle and auto-detect */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={includeReviewSites}
              onChange={(e) => onIncludeChange(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[rgb(var(--border))] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent" />
          </div>
          <span className="text-sm font-medium text-[rgb(var(--foreground))]">
            Include Review Site Prompts
          </span>
        </label>

        <button
          onClick={handleAutoDetect}
          disabled={isAutoDetecting || !brand360Id}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg hover:bg-[rgb(var(--background))] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAutoDetecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="h-4 w-4" />
          )}
          Auto-Detect
        </button>
      </div>

      {/* Categories list */}
      {includeReviewSites && (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {categories.map((category) => {
            const isExpanded = expandedCategories.has(category.id);
            const selectedCount = getSelectedCount(category);
            const totalCount = category.websites.length;
            const allSelected = selectedCount === totalCount && totalCount > 0;

            return (
              <div
                key={category.id}
                className="border border-[rgb(var(--border))] rounded-lg overflow-hidden"
              >
                {/* Category header */}
                <div
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-[rgb(var(--surface))] transition-colors"
                  onClick={() => toggleCategory(category.id)}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCategoryWebsites(category);
                      }}
                      className={`h-5 w-5 rounded border ${
                        allSelected
                          ? 'bg-accent border-accent text-white'
                          : selectedCount > 0
                          ? 'bg-accent/30 border-accent'
                          : 'border-[rgb(var(--border))]'
                      } flex items-center justify-center transition-colors`}
                    >
                      {allSelected && <Check className="h-3 w-3" />}
                      {!allSelected && selectedCount > 0 && (
                        <div className="h-2 w-2 bg-accent rounded-sm" />
                      )}
                    </button>
                    <div>
                      <span className="font-medium text-[rgb(var(--foreground))]">
                        {category.name}
                      </span>
                      {selectedCount > 0 && (
                        <span className="ml-2 text-xs text-[rgb(var(--foreground-secondary))]">
                          ({selectedCount}/{totalCount})
                        </span>
                      )}
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-[rgb(var(--foreground-secondary))]" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-[rgb(var(--foreground-secondary))]" />
                  )}
                </div>

                {/* Websites list */}
                {isExpanded && (
                  <div className="border-t border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
                    {category.websites.map((website) => {
                      const isSelected = selectedWebsiteIds.includes(website.id);

                      return (
                        <div
                          key={website.id}
                          onClick={() => toggleWebsite(website.id)}
                          className="flex items-center gap-3 p-3 hover:bg-[rgb(var(--background))] cursor-pointer transition-colors"
                        >
                          <div
                            className={`h-5 w-5 rounded border ${
                              isSelected
                                ? 'bg-accent border-accent text-white'
                                : 'border-[rgb(var(--border))]'
                            } flex items-center justify-center transition-colors`}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                          <Globe className="h-4 w-4 text-[rgb(var(--foreground-secondary))]" />
                          <div className="flex-1">
                            <span className="text-sm text-[rgb(var(--foreground))]">
                              {website.name}
                            </span>
                            <span className="ml-2 text-xs text-[rgb(var(--foreground-secondary))]">
                              {website.domain}
                            </span>
                          </div>
                          {website.priority > 0 && (
                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Selected count */}
      {includeReviewSites && selectedWebsiteIds.length > 0 && (
        <div className="text-sm text-[rgb(var(--foreground-secondary))]">
          {selectedWebsiteIds.length} review site{selectedWebsiteIds.length !== 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  );
}
