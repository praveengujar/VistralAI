'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

export interface UrlAnalyzerProps {
  onAnalysisStart: (url: string) => void;
  onAnalysisComplete: (result: any) => void;
  onError: (error: string) => void;
  isLoading?: boolean;
  jobProgress?: number;
  jobCurrentStep?: string;
}

export default function UrlAnalyzer({
  onAnalysisStart,
  onAnalysisComplete,
  onError,
  isLoading = false,
  jobProgress = 0,
  jobCurrentStep = '',
}: UrlAnalyzerProps) {
  const [url, setUrl] = useState('');
  const [validationError, setValidationError] = useState('');

  const validateUrl = (urlString: string): boolean => {
    try {
      new URL(urlString.startsWith('http') ? urlString : `https://${urlString}`);
      return true;
    } catch {
      return false;
    }
  };

  const handleAnalyze = () => {
    setValidationError('');

    if (!url.trim()) {
      setValidationError('Please enter a website URL');
      return;
    }

    if (!validateUrl(url)) {
      setValidationError('Please enter a valid URL (e.g., example.com)');
      return;
    }

    onAnalysisStart(url);
  };

  return (
    <div className="space-y-6">
      {/* URL Input Section */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--foreground))' }}>
          Website URL <span className="text-error-500">*</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={(e) =>
              e.key === 'Enter' && !isLoading && handleAnalyze()
            }
            disabled={isLoading}
            placeholder="example.com or https://example.com"
            className="flex-1 px-4 py-3 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60"
            style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', color: 'rgb(var(--foreground))' }}
          />
          <button
            onClick={handleAnalyze}
            disabled={isLoading || !url.trim()}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
          >
            {isLoading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>

        {validationError && (
          <div className="mt-2 flex items-start gap-2 text-error-600">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{validationError}</span>
          </div>
        )}
      </div>

      {/* Analysis Progress Section */}
      {isLoading && (
        <div className="bg-info-500/10 border border-info-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Loader className="w-5 h-5 text-info-600 animate-spin flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-info-700 dark:text-info-300">
                {jobCurrentStep || 'Analyzing website...'}
              </h4>
              <p className="text-sm text-info-600 dark:text-info-400 mt-1">
                This may take up to 60 seconds. Please don&apos;t leave this page.
              </p>

              {/* Progress Bar */}
              <div className="mt-3 w-full bg-info-500/20 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-info-600 h-full transition-all duration-300"
                  style={{ width: `${jobProgress}%` }}
                />
              </div>
              <p className="text-xs text-info-600 dark:text-info-400 mt-1">
                {jobProgress}% complete
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Information Section */}
      <div className="rounded-lg p-4" style={{ backgroundColor: 'rgb(var(--background-secondary))', border: '1px solid rgb(var(--border))' }}>
        <h4 className="font-medium mb-2" style={{ color: 'rgb(var(--foreground))' }}>What we analyze:</h4>
        <ul className="text-sm space-y-1" style={{ color: 'rgb(var(--foreground-secondary))' }}>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-success-600" />
            Brand mission, vision, and values
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-success-600" />
            Company information and team
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-success-600" />
            Products and services
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-success-600" />
            Target audience and positioning
          </li>
        </ul>
      </div>
    </div>
  );
}
