/**
 * Application Startup Initialization
 * Validates configuration and initializes services at app startup
 *
 * Usage:
 *   In app/api/health/route.ts or similar:
 *   import { initializeApp } from '@/lib/config/startup';
 *   await initializeApp();
 */

import { validateFeatureConfig, getFeatureConfigString, FEATURES } from './features';
import { getFirecrawlClient } from './firecrawl';

export interface StartupStatus {
  success: boolean;
  timestamp: Date;
  configuration: {
    features: string;
    firecrawlEnabled: boolean;
  };
  health: {
    firecrawl: boolean;
  };
  warnings: string[];
  errors: string[];
}

/**
 * Initialize application at startup
 * Validates configuration and performs health checks
 */
export async function initializeApp(): Promise<StartupStatus> {
  const warnings: string[] = [];
  const errors: string[] = [];
  const health = {
    firecrawl: false,
  };

  console.log('[App] Starting VistralAI initialization...');

  try {
    // Validate feature configuration
    console.log('[App] Validating feature configuration...');
    validateFeatureConfig();

    // Check Firecrawl if enabled
    if (FEATURES.USE_FIRECRAWL) {
      console.log('[App] Checking Firecrawl connection...');
      try {
        const firecrawl = getFirecrawlClient();
        health.firecrawl = await firecrawl.healthCheck();
        if (health.firecrawl) {
          console.log('[App] Firecrawl health check passed');
        } else {
          warnings.push('Firecrawl health check failed. Website crawling will not work.');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        warnings.push(`Firecrawl connection failed: ${message}`);
      }
    }

    // Check required environment variables
    if (FEATURES.USE_REAL_API && !process.env.ANTHROPIC_API_KEY) {
      errors.push('USE_REAL_API=true but ANTHROPIC_API_KEY not set');
    }

    console.log('[App] VistralAI initialization complete');

    return {
      success: errors.length === 0,
      timestamp: new Date(),
      configuration: {
        features: getFeatureConfigString(),
        firecrawlEnabled: FEATURES.USE_FIRECRAWL,
      },
      health,
      warnings,
      errors,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[App] Initialization failed:', message);
    errors.push(`Initialization failed: ${message}`);

    return {
      success: false,
      timestamp: new Date(),
      configuration: {
        features: getFeatureConfigString(),
        firecrawlEnabled: FEATURES.USE_FIRECRAWL,
      },
      health,
      warnings,
      errors,
    };
  }
}

/**
 * Get application status
 * Quick status check without re-initialization
 */
export async function getAppStatus(): Promise<Omit<StartupStatus, 'timestamp'> & { timestamp: string }> {
  const status = await initializeApp();
  return {
    ...status,
    timestamp: status.timestamp.toISOString(),
  };
}

/**
 * Log startup status to console
 */
export function logStartupStatus(status: StartupStatus): void {
  console.log('\n========================================');
  console.log('VistralAI Startup Status');
  console.log('========================================');
  console.log('Success:', status.success);
  console.log('Timestamp:', status.timestamp.toISOString());
  console.log('\nConfiguration:');
  console.log(status.configuration.features);
  console.log('\nHealth Checks:');
  console.log('- Firecrawl:', status.health.firecrawl ? '✓ Healthy' : '✗ Unhealthy');

  if (status.warnings.length > 0) {
    console.log('\nWarnings:');
    status.warnings.forEach((w) => console.log(`- ${w}`));
  }

  if (status.errors.length > 0) {
    console.log('\nErrors:');
    status.errors.forEach((e) => console.log(`- ${e}`));
  }

  console.log('========================================\n');
}
