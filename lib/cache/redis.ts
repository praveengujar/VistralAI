// Redis Caching Layer
// Provides distributed caching with graceful fallback to in-memory

import Redis from 'ioredis';

// ============================================
// Redis Client Singleton
// ============================================

let redisClient: Redis | null = null;
let isRedisAvailable = false;

// In-memory fallback cache
const memoryCache = new Map<string, { value: string; expiresAt: number }>();

function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;

  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    console.warn('[Cache] REDIS_URL not configured, using in-memory fallback');
    return null;
  }

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    redisClient.on('connect', () => {
      console.log('[Cache] Redis connected');
      isRedisAvailable = true;
    });

    redisClient.on('error', (err) => {
      console.error('[Cache] Redis error:', err.message);
      isRedisAvailable = false;
    });

    redisClient.on('close', () => {
      console.log('[Cache] Redis connection closed');
      isRedisAvailable = false;
    });

    // Attempt connection
    redisClient.connect().catch((err) => {
      console.warn('[Cache] Redis connection failed, using in-memory fallback:', err.message);
      isRedisAvailable = false;
    });

    return redisClient;
  } catch (error) {
    console.error('[Cache] Failed to create Redis client:', error);
    return null;
  }
}

// Initialize Redis on module load
getRedisClient();

// ============================================
// Cache Operations
// ============================================

const DEFAULT_TTL = 5 * 60; // 5 minutes in seconds

/**
 * Get a value from cache
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    // Try Redis first
    if (isRedisAvailable && redisClient) {
      const value = await redisClient.get(key);
      if (value) {
        return JSON.parse(value) as T;
      }
      return null;
    }

    // Fallback to memory cache
    const entry = memoryCache.get(key);
    if (entry) {
      if (entry.expiresAt > Date.now()) {
        return JSON.parse(entry.value) as T;
      }
      memoryCache.delete(key);
    }
    return null;
  } catch (error) {
    console.error('[Cache] Get error:', error);
    return null;
  }
}

/**
 * Set a value in cache with optional TTL
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number = DEFAULT_TTL
): Promise<boolean> {
  try {
    const serialized = JSON.stringify(value);

    // Try Redis first
    if (isRedisAvailable && redisClient) {
      await redisClient.setex(key, ttlSeconds, serialized);
      return true;
    }

    // Fallback to memory cache
    memoryCache.set(key, {
      value: serialized,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });

    // Clean up expired entries periodically
    if (memoryCache.size > 1000) {
      cleanupMemoryCache();
    }

    return true;
  } catch (error) {
    console.error('[Cache] Set error:', error);
    return false;
  }
}

/**
 * Delete a key from cache
 */
export async function cacheDelete(key: string): Promise<boolean> {
  try {
    if (isRedisAvailable && redisClient) {
      await redisClient.del(key);
    }
    memoryCache.delete(key);
    return true;
  } catch (error) {
    console.error('[Cache] Delete error:', error);
    return false;
  }
}

/**
 * Delete all keys matching a pattern
 */
export async function cacheDeletePattern(pattern: string): Promise<boolean> {
  try {
    if (isRedisAvailable && redisClient) {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    }

    // For memory cache, iterate and delete matching keys
    for (const key of memoryCache.keys()) {
      if (matchesPattern(key, pattern)) {
        memoryCache.delete(key);
      }
    }
    return true;
  } catch (error) {
    console.error('[Cache] Delete pattern error:', error);
    return false;
  }
}

/**
 * Check if a key exists in cache
 */
export async function cacheExists(key: string): Promise<boolean> {
  try {
    if (isRedisAvailable && redisClient) {
      return (await redisClient.exists(key)) === 1;
    }

    const entry = memoryCache.get(key);
    return !!entry && entry.expiresAt > Date.now();
  } catch (error) {
    return false;
  }
}

// ============================================
// Cache Wrapper for API Routes
// ============================================

interface CacheOptions {
  ttl?: number;
  keyPrefix?: string;
}

/**
 * Wrapper function that caches the result of an async function
 */
export async function withCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = DEFAULT_TTL, keyPrefix = '' } = options;
  const fullKey = keyPrefix ? `${keyPrefix}:${key}` : key;

  // Try to get from cache
  const cached = await cacheGet<T>(fullKey);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetchFn();

  // Cache the result
  await cacheSet(fullKey, data, ttl);

  return data;
}

// ============================================
// Helper Functions
// ============================================

function cleanupMemoryCache(): void {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expiresAt <= now) {
      memoryCache.delete(key);
    }
  }
}

function matchesPattern(key: string, pattern: string): boolean {
  // Convert Redis pattern to regex
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
  return regex.test(key);
}

// ============================================
// Cache Status
// ============================================

export function getCacheStatus(): {
  type: 'redis' | 'memory';
  isAvailable: boolean;
  memorySize: number;
} {
  return {
    type: isRedisAvailable ? 'redis' : 'memory',
    isAvailable: isRedisAvailable || true, // Memory fallback always available
    memorySize: memoryCache.size,
  };
}

// ============================================
// Cleanup on process exit
// ============================================

if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    if (redisClient) {
      await redisClient.quit();
    }
  });
}
