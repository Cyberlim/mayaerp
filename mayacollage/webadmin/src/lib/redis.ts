import { Redis } from '@upstash/redis';

// Initialize Redis client from environment variables
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || 'https://moved-vervet-41278.upstash.io';
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || 'AaE-AAIgcDE4MjRhZDE5M2JhMGE0NmJlOGNmZTMwNzJlMGY3MzFhYQ';

export const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});

// Default TTL: 30 minutes = 1800 seconds
export const DEFAULT_CACHE_TTL = 1800;

/**
 * Retrieve item from Redis cache with error handling
 */
export async function getCache<T = any>(key: string): Promise<T | null> {
  try {
    const data = await redis.get<T>(key);
    return data ?? null;
  } catch (err) {
    console.warn(`[Redis Cache] GET failed for key: ${key}`, err);
    return null;
  }
}

/**
 * Store item in Redis cache with TTL (Default: 30 minutes)
 */
export async function setCache(key: string, value: any, ttlSeconds: number = DEFAULT_CACHE_TTL): Promise<void> {
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (err) {
    console.warn(`[Redis Cache] SET failed for key: ${key}`, err);
  }
}

/**
 * Delete one or more specific keys from cache
 */
export async function delCache(...keys: string[]): Promise<void> {
  try {
    if (!keys || keys.length === 0) return;
    const validKeys = keys.filter(Boolean);
    if (validKeys.length > 0) {
      await redis.del(...validKeys);
    }
  } catch (err) {
    console.warn(`[Redis Cache] DEL failed for keys: ${keys.join(', ')}`, err);
  }
}

/**
 * Delete all keys matching a prefix or wildcard pattern
 */
export async function delCachePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys && keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.warn(`[Redis Cache] DEL pattern failed for: ${pattern}`, err);
  }
}

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
