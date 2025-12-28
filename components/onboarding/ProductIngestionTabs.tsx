'use client';

import { useState } from 'react';
import { Upload, Loader, AlertCircle } from 'lucide-react';

export interface ProductIngestionTabsProps {
  onProductsSelected?: (products: any[]) => void;
  onError?: (error: string) => void;
  isLoading?: boolean;
}

type Tab = 'website' | 'spreadsheet' | 'shopify';

export default function ProductIngestionTabs({
  onProductsSelected,
  onError,
  isLoading = false,
}: ProductIngestionTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('website');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [productCount, setProductCount] = useState(0);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    setUploadSuccess(false);

    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const fileName = file.name.toLowerCase();
    const isValidFile =
      fileName.endsWith('.csv') ||
      fileName.endsWith('.xlsx') ||
      fileName.endsWith('.xls');

    if (!isValidFile) {
      setUploadError(
        'Please upload a CSV or Excel file (*.csv, *.xlsx)',
      );
      return;
    }

    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds 10MB limit');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', 'temp-user'); // Would be actual user ID

      const response = await fetch('/api/onboarding/products/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setUploadError(
          data.error || 'Failed to process file',
        );
        return;
      }

      if (data.validCount === 0) {
        setUploadError('No valid products found in file');
        return;
      }

      setUploadSuccess(true);
      setProductCount(data.validCount);
      onProductsSelected?.(data.products);

      // Reset file input
      e.target.value = '';
    } catch (error) {
      setUploadError(
        'Error uploading file. Please try again.',
      );
      console.error('Upload error:', error);
      onError?.(
        error instanceof Error
          ? error.message
          : 'Unknown error',
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('website')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition ${
            activeTab === 'website'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-foreground-muted hover:text-foreground'
          }`}
        >
          Extract from Website
        </button>
        <button
          onClick={() => setActiveTab('spreadsheet')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition ${
            activeTab === 'spreadsheet'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-foreground-muted hover:text-foreground'
          }`}
        >
          Upload CSV/Excel
        </button>
        <button
          onClick={() => setActiveTab('shopify')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition ${
            activeTab === 'shopify'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-foreground-muted hover:text-foreground'
          }`}
        >
          Shopify Integration
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {/* Website Extraction Tab */}
        {activeTab === 'website' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                We&apos;ll automatically extract products from the website you provided.
                This works best if your website has dedicated product pages.
              </p>
            </div>
            <button
              disabled={isLoading}
              className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Extracting Products...
                </>
              ) : (
                'Extract Products from Website'
              )}
            </button>
          </div>
        )}

        {/* Spreadsheet Upload Tab */}
        {activeTab === 'spreadsheet' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border-secondary rounded-lg p-8">
              <label className="cursor-pointer block">
                <div className="flex flex-col items-center justify-center">
                  <Upload className="w-12 h-12 text-foreground-muted mb-2" />
                  <p className="text-lg font-medium text-foreground">
                    Drop your file here
                  </p>
                  <p className="text-sm text-foreground-secondary mt-1">
                    or click to browse (CSV, XLSX, XLS)
                  </p>
                </div>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>

            {uploading && (
              <div className="flex items-center gap-2 text-primary-600">
                <Loader className="w-4 h-4 animate-spin" />
                <span>Processing file...</span>
              </div>
            )}

            {uploadError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Upload Error</p>
                  <p className="text-sm mt-1">{uploadError}</p>
                </div>
              </div>
            )}

            {uploadSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-medium">
                  ✓ Successfully imported {productCount} products
                </p>
                <p className="text-sm text-green-700 mt-1">
                  You can review and edit them on the next step.
                </p>
              </div>
            )}

            <p className="text-xs text-foreground-secondary">
              <strong>CSV Format:</strong> Include columns like name, category, description,
              price, features, benefits
            </p>
          </div>
        )}

        {/* Shopify Integration Tab */}
        {activeTab === 'shopify' && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                Shopify integration will be available soon. For now, please export your
                products as CSV from Shopify and use the spreadsheet tab above.
              </p>
            </div>
            <button
              disabled={true}
              className="w-full px-4 py-3 bg-background-tertiary text-foreground-muted rounded-lg disabled:cursor-not-allowed font-medium"
            >
              Connect Shopify (Coming Soon)
            </button>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="bg-background-secondary border border-border rounded-lg p-4">
        <p className="text-sm font-medium text-foreground mb-2">
          All steps are optional
        </p>
        <p className="text-sm text-foreground-secondary">
          You can skip this step and add products manually later from your dashboard.
        </p>
      </div>
    </div>
  );
}
