'use client';

import { useState } from 'react';
import { Globe, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface BrandStepProps {
  onSubmit: (websiteUrl: string, brandName: string) => void;
  isSubmitting: boolean;
  error?: string;
  defaultUrl?: string;
  defaultBrandName?: string;
}

export function BrandStep({
  onSubmit,
  isSubmitting,
  error,
  defaultUrl = '',
  defaultBrandName = '',
}: BrandStepProps) {
  const [websiteUrl, setWebsiteUrl] = useState(defaultUrl);
  const [brandName, setBrandName] = useState(defaultBrandName);
  const [urlError, setUrlError] = useState('');

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError('');

    if (!websiteUrl) {
      setUrlError('Please enter your website URL');
      return;
    }

    if (!validateUrl(websiteUrl)) {
      setUrlError('Please enter a valid URL');
      return;
    }

    if (!brandName.trim()) {
      setUrlError('Please enter your brand name');
      return;
    }

    const fullUrl = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;
    onSubmit(fullUrl, brandName.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Website URL Input */}
        <div>
          <label
            htmlFor="websiteUrl"
            className="block text-sm font-medium text-[rgb(var(--foreground))] mb-2"
          >
            Website URL
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(var(--foreground-secondary))]" />
            <input
              id="websiteUrl"
              type="text"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="example.com"
              className={`
                w-full pl-10 pr-4 py-3 rounded-lg border bg-[rgb(var(--surface))]
                text-[rgb(var(--foreground))] placeholder-[rgb(var(--foreground-secondary))]
                focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]
                ${urlError ? 'border-red-500' : 'border-[rgb(var(--border))]'}
              `}
            />
          </div>
          {urlError && (
            <p className="mt-1 text-sm text-red-500">{urlError}</p>
          )}
        </div>

        {/* Brand Name Input */}
        <div>
          <label
            htmlFor="brandName"
            className="block text-sm font-medium text-[rgb(var(--foreground))] mb-2"
          >
            Brand Name
          </label>
          <input
            id="brandName"
            type="text"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="Your company or brand name"
            className="w-full px-4 py-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))]
              text-[rgb(var(--foreground))] placeholder-[rgb(var(--foreground-secondary))]
              focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
          />
        </div>
      </div>

      {/* API Error Display */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* What Happens Next */}
      <Card className="p-4 bg-[rgb(var(--surface-hover))]">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-[rgb(var(--primary))] flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-[rgb(var(--foreground))] mb-2">
              What happens next?
            </p>
            <ul className="text-sm text-[rgb(var(--foreground-secondary))] space-y-1">
              <li>1. Choose your subscription plan</li>
              <li>2. Add payment method to start your free trial</li>
              <li>3. We&apos;ll analyze your website to build your brand profile</li>
            </ul>
          </div>
        </div>
      </Card>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          'Continue to Choose Plan'
        )}
      </Button>
    </form>
  );
}

export default BrandStep;
