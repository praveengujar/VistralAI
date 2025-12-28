/**
 * ShopifyService - Shopify Store Integration
 *
 * This service handles:
 * 1. OAuth connection with Shopify stores
 * 2. Fetching products from Shopify
 * 3. Syncing products to the database
 * 4. Mapping Shopify products to AEO product model
 */

import prisma from '@/lib/db/prisma';

// ============================================
// Types
// ============================================

export interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  vendor: string;
  product_type: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  status: 'active' | 'archived' | 'draft';
  tags: string;
  images: ShopifyImage[];
  variants: ShopifyVariant[];
  options: ShopifyOption[];
}

export interface ShopifyVariant {
  id: number;
  product_id: number;
  title: string;
  price: string;
  sku: string;
  position: number;
  compare_at_price: string | null;
  inventory_quantity: number;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  barcode: string | null;
}

export interface ShopifyImage {
  id: number;
  product_id: number;
  position: number;
  src: string;
  alt: string | null;
}

export interface ShopifyOption {
  id: number;
  product_id: number;
  name: string;
  position: number;
  values: string[];
}

export interface ShopifyConnectionResult {
  success: boolean;
  storeUrl?: string;
  storeName?: string;
  productCount?: number;
  error?: string;
}

export interface ShopifySyncProgress {
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  totalProducts: number;
  syncedProducts: number;
  errors: string[];
}

// ============================================
// ShopifyService
// ============================================

export class ShopifyService {
  private apiVersion = '2024-01';

  /**
   * Connect to a Shopify store
   * Note: In production, this should use Shopify OAuth
   */
  async connect(
    brand360Id: string,
    storeUrl: string,
    accessToken: string
  ): Promise<ShopifyConnectionResult> {
    try {
      // Normalize store URL
      const normalizedUrl = this.normalizeStoreUrl(storeUrl);

      // Test connection by fetching store info
      const response = await fetch(
        `https://${normalizedUrl}/admin/api/${this.apiVersion}/shop.json`,
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          error: `Failed to connect: ${response.status} - ${error}`,
        };
      }

      const data = await response.json();
      const shop = data.shop;

      // Fetch product count
      const countResponse = await fetch(
        `https://${normalizedUrl}/admin/api/${this.apiVersion}/products/count.json`,
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json',
          },
        }
      );

      const countData = await countResponse.json();
      const productCount = countData.count || 0;

      // Save connection to database
      await prisma.aEOProductCatalog.upsert({
        where: { brand360Id },
        create: {
          brand360Id,
          catalogName: `${shop.name} - Shopify`,
          catalogDescription: `Products synced from ${shop.name} Shopify store`,
          importSource: 'shopify',
          shopifyConnected: true,
          shopifyStoreUrl: normalizedUrl,
          shopifyAccessToken: accessToken, // In production, encrypt this
          shopifySyncEnabled: true,
        },
        update: {
          shopifyConnected: true,
          shopifyStoreUrl: normalizedUrl,
          shopifyAccessToken: accessToken,
          shopifySyncEnabled: true,
        },
      });

      return {
        success: true,
        storeUrl: normalizedUrl,
        storeName: shop.name,
        productCount,
      };
    } catch (error: any) {
      console.error('Shopify connection error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Disconnect a Shopify store
   */
  async disconnect(brand360Id: string): Promise<boolean> {
    try {
      await prisma.aEOProductCatalog.updateMany({
        where: { brand360Id, shopifyConnected: true },
        data: {
          shopifyConnected: false,
          shopifyAccessToken: null,
          shopifySyncEnabled: false,
        },
      });
      return true;
    } catch (error) {
      console.error('Shopify disconnect error:', error);
      return false;
    }
  }

  /**
   * Sync products from Shopify
   */
  async syncProducts(
    brand360Id: string,
    onProgress?: (progress: ShopifySyncProgress) => void
  ): Promise<ShopifySyncProgress> {
    const errors: string[] = [];
    let syncedProducts = 0;
    let totalProducts = 0;

    try {
      // Get catalog with Shopify connection
      const catalog = await prisma.aEOProductCatalog.findFirst({
        where: { brand360Id, shopifyConnected: true },
      });

      if (!catalog || !catalog.shopifyAccessToken || !catalog.shopifyStoreUrl) {
        return {
          status: 'failed',
          totalProducts: 0,
          syncedProducts: 0,
          errors: ['Shopify not connected'],
        };
      }

      // Fetch all products with pagination
      let hasNextPage = true;
      let pageInfo: string | null = null;
      const allProducts: ShopifyProduct[] = [];

      while (hasNextPage) {
        const fetchUrl: string = pageInfo
          ? `https://${catalog.shopifyStoreUrl}/admin/api/${this.apiVersion}/products.json?limit=250&page_info=${pageInfo}`
          : `https://${catalog.shopifyStoreUrl}/admin/api/${this.apiVersion}/products.json?limit=250`;

        const fetchResponse: Response = await fetch(fetchUrl, {
          headers: {
            'X-Shopify-Access-Token': catalog.shopifyAccessToken,
            'Content-Type': 'application/json',
          },
        });

        if (!fetchResponse.ok) {
          throw new Error(`Failed to fetch products: ${fetchResponse.status}`);
        }

        const data = await fetchResponse.json();
        allProducts.push(...data.products);

        // Check for next page
        const linkHeader: string | null = fetchResponse.headers.get('Link');
        if (linkHeader && linkHeader.includes('rel="next"')) {
          const nextLink: string | undefined = linkHeader.split(',').find((l: string) => l.includes('rel="next"'));
          const match: RegExpMatchArray | null = nextLink?.match(/page_info=([^>&]+)/) || null;
          pageInfo = match ? match[1] : null;
          hasNextPage = !!pageInfo;
        } else {
          hasNextPage = false;
        }
      }

      totalProducts = allProducts.length;

      // Import products
      for (let i = 0; i < allProducts.length; i++) {
        const shopifyProduct = allProducts[i];

        try {
          await this.importShopifyProduct(brand360Id, catalog.id, shopifyProduct);
          syncedProducts++;
        } catch (err: any) {
          errors.push(`Failed to import ${shopifyProduct.title}: ${err.message}`);
        }

        // Report progress periodically
        if ((i + 1) % 50 === 0 || i === allProducts.length - 1) {
          onProgress?.({
            status: 'syncing',
            totalProducts,
            syncedProducts,
            errors: errors.slice(-5),
          });
        }
      }

      // Update catalog sync time
      await prisma.aEOProductCatalog.update({
        where: { id: catalog.id },
        data: {
          shopifyLastSyncAt: new Date(),
          lastImportAt: new Date(),
          lastImportSource: 'shopify',
        },
      });

      return {
        status: errors.length > 0 ? 'completed' : 'completed',
        totalProducts,
        syncedProducts,
        errors,
      };
    } catch (error: any) {
      return {
        status: 'failed',
        totalProducts,
        syncedProducts,
        errors: [...errors, error.message],
      };
    }
  }

  /**
   * Import a single Shopify product
   */
  private async importShopifyProduct(
    brand360Id: string,
    catalogId: string,
    shopifyProduct: ShopifyProduct
  ): Promise<void> {
    // Parse description - strip HTML
    const description = this.stripHtml(shopifyProduct.body_html || '');
    const shortDescription = description.slice(0, 200);

    // Get primary variant for pricing
    const primaryVariant = shopifyProduct.variants[0];
    const price = primaryVariant ? parseFloat(primaryVariant.price) : undefined;
    const compareAtPrice = primaryVariant?.compare_at_price
      ? parseFloat(primaryVariant.compare_at_price)
      : undefined;

    // Get primary image
    const imageUrl = shopifyProduct.images[0]?.src;
    const imageUrls = shopifyProduct.images.map(img => img.src);

    // Parse tags
    const tags = shopifyProduct.tags
      ? shopifyProduct.tags.split(',').map(t => t.trim())
      : [];

    // Determine availability
    const totalInventory = shopifyProduct.variants.reduce(
      (sum, v) => sum + (v.inventory_quantity || 0),
      0
    );
    const availability = totalInventory > 0 ? 'InStock' : 'OutOfStock';

    // Upsert product
    const product = await prisma.product.upsert({
      where: {
        brand360Id_slug: {
          brand360Id,
          slug: shopifyProduct.handle,
        },
      },
      create: {
        brand360Id,
        catalogId,
        name: shopifyProduct.title,
        slug: shopifyProduct.handle,
        description,
        shortDescription,
        externalId: String(shopifyProduct.id),
        sku: primaryVariant?.sku || undefined,
        gtin: primaryVariant?.barcode || undefined,
        category: shopifyProduct.product_type || undefined,
        productType: 'Product',
        price,
        compareAtPrice,
        priceCurrency: 'USD', // Shopify returns prices in shop currency
        availability,
        inventoryQuantity: totalInventory,
        imageUrl,
        imageUrls,
        tags,
        importSource: 'shopify',
        importedAt: new Date(),
        lastSyncAt: new Date(),
        isActive: shopifyProduct.status === 'active',
      },
      update: {
        name: shopifyProduct.title,
        description,
        shortDescription,
        externalId: String(shopifyProduct.id),
        sku: primaryVariant?.sku || undefined,
        gtin: primaryVariant?.barcode || undefined,
        category: shopifyProduct.product_type || undefined,
        price,
        compareAtPrice,
        availability,
        inventoryQuantity: totalInventory,
        imageUrl,
        imageUrls,
        tags,
        lastSyncAt: new Date(),
        isActive: shopifyProduct.status === 'active',
      },
    });

    // Upsert variants
    for (const variant of shopifyProduct.variants) {
      if (shopifyProduct.variants.length === 1 && variant.title === 'Default Title') {
        // Skip default variant for single-variant products
        continue;
      }

      const variantAttributes: Record<string, string> = {};
      if (variant.option1) variantAttributes[shopifyProduct.options[0]?.name || 'Option 1'] = variant.option1;
      if (variant.option2) variantAttributes[shopifyProduct.options[1]?.name || 'Option 2'] = variant.option2;
      if (variant.option3) variantAttributes[shopifyProduct.options[2]?.name || 'Option 3'] = variant.option3;

      await prisma.productVariant.upsert({
        where: {
          productId_externalId: {
            productId: product.id,
            externalId: String(variant.id),
          },
        },
        create: {
          productId: product.id,
          name: variant.title,
          sku: variant.sku || undefined,
          externalId: String(variant.id),
          attributes: variantAttributes,
          price: parseFloat(variant.price),
          compareAtPrice: variant.compare_at_price
            ? parseFloat(variant.compare_at_price)
            : undefined,
          inventoryQuantity: variant.inventory_quantity,
          availability: variant.inventory_quantity > 0 ? 'InStock' : 'OutOfStock',
        },
        update: {
          name: variant.title,
          sku: variant.sku || undefined,
          attributes: variantAttributes,
          price: parseFloat(variant.price),
          compareAtPrice: variant.compare_at_price
            ? parseFloat(variant.compare_at_price)
            : undefined,
          inventoryQuantity: variant.inventory_quantity,
          availability: variant.inventory_quantity > 0 ? 'InStock' : 'OutOfStock',
        },
      });
    }
  }

  /**
   * Get Shopify connection status
   */
  async getConnectionStatus(brand360Id: string): Promise<{
    connected: boolean;
    storeUrl?: string;
    lastSyncAt?: Date;
    productCount?: number;
  }> {
    const catalog = await prisma.aEOProductCatalog.findFirst({
      where: { brand360Id, shopifyConnected: true },
    });

    if (!catalog) {
      return { connected: false };
    }

    // Get product count
    const productCount = await prisma.product.count({
      where: { brand360Id, importSource: 'shopify' },
    });

    return {
      connected: true,
      storeUrl: catalog.shopifyStoreUrl || undefined,
      lastSyncAt: catalog.shopifyLastSyncAt || undefined,
      productCount,
    };
  }

  /**
   * Normalize Shopify store URL
   */
  private normalizeStoreUrl(url: string): string {
    // Remove protocol and trailing slashes
    let normalized = url
      .replace(/^https?:\/\//, '')
      .replace(/\/+$/, '');

    // Add .myshopify.com if not present
    if (!normalized.includes('.myshopify.com') && !normalized.includes('.')) {
      normalized += '.myshopify.com';
    }

    return normalized;
  }

  /**
   * Strip HTML tags from text
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

// Export singleton instance
export const shopifyService = new ShopifyService();
