/**
 * Local in-memory key-value store for development
 * This simulates Vercel KV when running locally without Redis
 * Data persists only during the server session
 */

// In-memory storage (resets on server restart)
const store = new Map<string, unknown>()

export const localKV = {
  get(key: string): unknown | null {
    return store.get(key) ?? null
  },

  set(key: string, value: unknown): void {
    store.set(key, value)
  },

  del(key: string): void {
    store.delete(key)
  },

  keys(pattern: string): string[] {
    // Simple pattern matching for "prefix:*" patterns
    const prefix = pattern.replace("*", "")
    const matchingKeys: string[] = []
    
    for (const key of store.keys()) {
      if (key.startsWith(prefix)) {
        matchingKeys.push(key)
      }
    }
    
    return matchingKeys
  },

  // Helper to clear all data (useful for testing)
  clear(): void {
    store.clear()
  },

  // Helper to get store size
  size(): number {
    return store.size
  }
}
