'use client';

import { useState } from 'react';
import {
  Upload,
  ShoppingCart,
  Package,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Link as LinkIcon,
} from 'lucide-react';

interface ProductCatalogConnectorProps {
  brandId: string;
  onComplete?: () => void;
}

interface CatalogIntegration {
  id: string;
  name: string;
  icon: string;
  description: string;
  status: 'available' | 'coming_soon' | 'connected';
}

const integrations: CatalogIntegration[] = [
  {
    id: 'shopify',
    name: 'Shopify',
    icon: '🛍️',
    description: 'Connect your Shopify store',
    status: 'available',
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    icon: '🛒',
    description: 'Sync WooCommerce products',
    status: 'coming_soon',
  },
  {
    id: 'magento',
    name: 'Magento',
    icon: '📦',
    description: 'Import from Magento',
    status: 'coming_soon',
  },
  {
    id: 'bigcommerce',
    name: 'BigCommerce',
    icon: '🏪',
    description: 'Connect BigCommerce store',
    status: 'coming_soon',
  },
];

export default function ProductCatalogConnector({
  brandId,
  onComplete,
}: ProductCatalogConnectorProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'integrate'>('upload');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'failed'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [productsImported, setProductsImported] = useState(0);

  const handleFileUpload = async (file: any) => {
    if (!file.name.endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }

    setUploadedFile(file);
    setUploadStatus('uploading');

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setUploadProgress(i);
    }

    setUploadStatus('processing');

    // Call API to process catalog
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('brandId', brandId);

      const response = await fetch('/api/brand-360/catalog/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brandId,
          fileName: file.name,
          fileSize: file.size,
        }),
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setProductsImported(data.productsImported || 0);
      setUploadStatus('completed');

      if (onComplete) {
        setTimeout(onComplete, 2000);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('failed');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleIntegrationConnect = (integrationId: string) => {
    if (integrationId === 'shopify') {
      // In production, open OAuth flow
      alert('Shopify integration coming soon! This will open OAuth flow to connect your Shopify store.');
    } else {
      alert(`${integrationId} integration coming soon!`);
    }
  };

  const downloadTemplate = () => {
    // Create CSV template
    const template = `sku,name,category,description,price,currency,url,features,benefits
PROD-001,Sample Product,Electronics,A great product description,99.99,USD,https://example.com/product,"Feature 1, Feature 2, Feature 3","Benefit 1, Benefit 2"
PROD-002,Another Product,Accessories,Another description,49.99,USD,https://example.com/product2,"Feature A, Feature B","Benefit A, Benefit B"`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_catalog_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'upload'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-foreground-muted hover:text-foreground-secondary hover:border-border-secondary'
            }`}
          >
            <Upload className="inline-block h-5 w-5 mr-2" />
            Upload CSV
          </button>
          <button
            onClick={() => setActiveTab('integrate')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'integrate'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-foreground-muted hover:text-foreground-secondary hover:border-border-secondary'
            }`}
          >
            <LinkIcon className="inline-block h-5 w-5 mr-2" />
            Connect Platform
          </button>
        </nav>
      </div>

      {/* Upload CSV Tab */}
      {activeTab === 'upload' && (
        <div className="space-y-4">
          {uploadStatus === 'idle' && (
            <>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-border-secondary rounded-lg p-12 text-center hover:border-border transition-colors"
              >
                <input
                  type="file"
                  id="catalog-upload"
                  className="hidden"
                  accept=".csv"
                  onChange={handleFileInput}
                />
                <Package className="h-12 w-12 mx-auto text-foreground-muted mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Upload Product Catalog
                </h3>
                <p className="text-sm text-foreground-secondary mb-4">
                  Drop your CSV file here or{' '}
                  <label
                    htmlFor="catalog-upload"
                    className="text-primary-600 hover:text-primary-700 cursor-pointer font-medium"
                  >
                    browse
                  </label>
                </p>
                <p className="text-xs text-foreground-muted">
                  CSV format only • Up to 10,000 products
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">
                      CSV Format Requirements
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Include columns: SKU, Name, Category, Description, Price</li>
                      <li>• Optional: Features, Benefits, Image URLs, Specifications</li>
                      <li>• Use UTF-8 encoding</li>
                      <li>• First row should contain column headers</li>
                    </ul>
                    <button
                      onClick={downloadTemplate}
                      className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                      Download CSV Template →
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {uploadStatus === 'uploading' && (
            <div className="bg-surface border border-border rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Loader2 className="h-6 w-6 text-primary-600 animate-spin" />
                <div>
                  <h4 className="font-medium text-foreground">Uploading catalog...</h4>
                  <p className="text-sm text-foreground-secondary">{uploadedFile?.name}</p>
                </div>
              </div>
              <div className="w-full bg-background-tertiary rounded-full h-2">
                <div
                  className="bg-primary-600 rounded-full h-2 transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-foreground-secondary mt-2">{uploadProgress}%</p>
            </div>
          )}

          {uploadStatus === 'processing' && (
            <div className="bg-surface border border-border rounded-lg p-6">
              <div className="flex items-center space-x-3">
                <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                <div>
                  <h4 className="font-medium text-foreground">Processing products...</h4>
                  <p className="text-sm text-foreground-secondary">
                    Extracting product information and validating data
                  </p>
                </div>
              </div>
            </div>
          )}

          {uploadStatus === 'completed' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <div>
                  <h4 className="font-medium text-green-900">
                    Catalog imported successfully!
                  </h4>
                  <p className="text-sm text-green-700">
                    {productsImported} products imported and ready for AI optimization
                  </p>
                </div>
              </div>
            </div>
          )}

          {uploadStatus === 'failed' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center space-x-3">
                <XCircle className="h-6 w-6 text-red-600" />
                <div>
                  <h4 className="font-medium text-red-900">Upload failed</h4>
                  <p className="text-sm text-red-700">
                    Please check your file format and try again
                  </p>
                  <button
                    onClick={() => {
                      setUploadStatus('idle');
                      setUploadedFile(null);
                    }}
                    className="mt-2 text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Connect Platform Tab */}
      {activeTab === 'integrate' && (
        <div className="space-y-4">
          <p className="text-sm text-foreground-secondary">
            Connect your e-commerce platform to automatically sync your product catalog
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrations.map((integration) => (
              <div
                key={integration.id}
                className={`border rounded-lg p-6 ${
                  integration.status === 'connected'
                    ? 'border-green-300 bg-green-50'
                    : 'border-border bg-surface'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{integration.icon}</div>
                    <div>
                      <h4 className="font-medium text-foreground">{integration.name}</h4>
                      <p className="text-sm text-foreground-secondary">{integration.description}</p>
                    </div>
                  </div>
                  {integration.status === 'connected' && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                </div>

                {integration.status === 'available' && (
                  <button
                    onClick={() => handleIntegrationConnect(integration.id)}
                    className="w-full mt-3 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-medium"
                  >
                    Connect {integration.name}
                  </button>
                )}

                {integration.status === 'coming_soon' && (
                  <div className="mt-3 px-4 py-2 bg-background-tertiary text-foreground-muted rounded-md text-sm font-medium text-center">
                    Coming Soon
                  </div>
                )}

                {integration.status === 'connected' && (
                  <button className="w-full mt-3 px-4 py-2 bg-surface border border-border-secondary text-foreground-secondary rounded-md hover:bg-surface-hover text-sm font-medium">
                    Manage Connection
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Automatic Sync</p>
                <p>
                  Once connected, your product catalog will automatically sync every 24 hours.
                  You can also trigger manual syncs anytime.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
