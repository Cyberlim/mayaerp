import { Redis } from '@upstash/redis';

// Initialize Redis client from environment variables
const rawUrl = process.env.UPSTASH_REDIS_REST_URL || 'https://moved-vervet-41278.upstash.io';
const rawToken = process.env.UPSTASH_REDIS_REST_TOKEN || 'AaE-AAIgcDE4MjRhZDE5M2JhMGE0NmJlOGNmZTMwNzJlMGY3MzFhYQ';

const redisUrl = rawUrl.replace(/^["']|["']$/g, '').trim();
const redisToken = rawToken.replace(/^["']|["']$/g, '').trim();

export const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});

// Default TTL: 30 minutes = 1800 seconds
export const DEFAULT_CACHE_TTL = 1800;

// ============================================================================
// LEVEL 1: ULTRA-FAST IN-PROCESS RAM CACHE (0ms sub-millisecond latency)
// ============================================================================
const memoryCache = new Map<string, { data: any; expiry: number }>();

export function getMemoryCache<T = any>(key: string): T | null {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    memoryCache.delete(key);
    return null;
  }
  return item.data as T;
}

export function setMemoryCache(key: string, data: any, ttlSeconds: number = DEFAULT_CACHE_TTL): void {
  if (memoryCache.size > 500) {
    const firstKey = memoryCache.keys().next().value;
    if (firstKey) memoryCache.delete(firstKey);
  }
  memoryCache.set(key, { data, expiry: Date.now() + (ttlSeconds * 1000) });
}

export function delMemoryCache(key: string): void {
  memoryCache.delete(key);
}

export function delMemoryCachePattern(pattern: string): void {
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
  for (const k of memoryCache.keys()) {
    if (regex.test(k)) {
      memoryCache.delete(k);
    }
  }
}

// ============================================================================
// LEVEL 2: MULTI-TIER CACHE (L1 In-Memory RAM + L2 Upstash Redis Cloud)
// ============================================================================

/**
 * Retrieve item with 2-tier caching:
 * 1. L1 RAM Cache (0ms)
 * 2. L2 Upstash Redis (~100-300ms)
 */
export async function getCache<T = any>(key: string): Promise<T | null> {
  // 1. Instant check in L1 RAM Cache
  const memoryHit = getMemoryCache<T>(key);
  if (memoryHit !== null) {
    return memoryHit;
  }

  // 2. Fallback to L2 Upstash Redis
  try {
    const data = await redis.get<T>(key);
    if (data !== null && data !== undefined) {
      // Warm L1 cache for subsequent instant reads
      setMemoryCache(key, data, DEFAULT_CACHE_TTL);
      return data;
    }
    return null;
  } catch (err) {
    console.warn(`[Redis Cache] GET failed for key: ${key}`, err);
    return null;
  }
}

/**
 * Store item in both L1 RAM and L2 Upstash Redis
 */
export async function setCache(key: string, value: any, ttlSeconds: number = DEFAULT_CACHE_TTL): Promise<void> {
  // 1. Instantly write to L1 RAM Cache
  setMemoryCache(key, value, ttlSeconds);

  // 2. Non-blocking write to L2 Upstash Redis
  redis.set(key, value, { ex: ttlSeconds }).catch(err => {
    console.warn(`[Redis Cache] SET failed for key: ${key}`, err);
  });
}

/**
 * Delete one or more specific keys from both L1 and L2 caches
 */
export async function delCache(...keys: string[]): Promise<void> {
  try {
    if (!keys || keys.length === 0) return;
    const validKeys = keys.filter(Boolean);
    validKeys.forEach(k => delMemoryCache(k));

    if (validKeys.length > 0) {
      await redis.del(...validKeys);
    }
  } catch (err) {
    console.warn(`[Redis Cache] DEL failed for keys: ${keys.join(', ')}`, err);
  }
}

/**
 * Delete all keys matching a prefix or wildcard pattern from both L1 and L2 caches
 */
export async function delCachePattern(pattern: string): Promise<void> {
  try {
    delMemoryCachePattern(pattern);
    const keys = await redis.keys(pattern);
    if (keys && keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.warn(`[Redis Cache] DEL pattern failed for: ${pattern}`, err);
  }
}

export const invalidatePattern = delCachePattern;

/**
 * Generic Cache-aside helper:
 * Returns cached data if available; otherwise executes fetcher, caches result for 30m, and returns it.
 */
export async function cachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = DEFAULT_CACHE_TTL
): Promise<T> {
  const cached = await getCache<T>(key);
  if (cached !== null && cached !== undefined) {
    return cached;
  }

  const freshData = await fetcher();
  if (freshData !== null && freshData !== undefined) {
    await setCache(key, freshData, ttlSeconds);
  }
  return freshData;
}
