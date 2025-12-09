import { kv } from "@vercel/kv"
import { localKV } from "@/lib/local-kv"

// Use Vercel KV/Upstash in production, local storage in development
export const isProduction = !!(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL)

/**
 * Unified storage abstraction that works with both
 * Vercel KV (production) and local storage (development)
 */
export const storage = {
  async get<T>(key: string): Promise<T | null> {
    if (isProduction) {
      return await kv.get<T>(key)
    }
    return localKV.get(key) as T | null
  },

  async set(key: string, value: unknown): Promise<void> {
    if (isProduction) {
      await kv.set(key, value)
    } else {
      localKV.set(key, value)
    }
  },

  async del(key: string): Promise<void> {
    if (isProduction) {
      await kv.del(key)
    } else {
      localKV.del(key)
    }
  },

  async keys(pattern: string): Promise<string[]> {
    if (isProduction) {
      return await kv.keys(pattern)
    }
    return localKV.keys(pattern)
  },

  /**
   * Increment a hash field by a given amount
   * Only works in production (Redis), local fallback requires manual handling
   */
  async hincrby(key: string, field: string, increment: number): Promise<void> {
    if (isProduction) {
      await kv.hincrby(key, field, increment)
    }
    // Local fallback: caller should handle this case
  },
}
