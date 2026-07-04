interface CacheEntry {
  value: any;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

export async function getOrSetCache<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const existing = cache.get(key);
  if (existing && existing.expiresAt > now) {
    return existing.value as T;
  }

  const value = await fn();
  cache.set(key, { value, expiresAt: now + ttlMs });
  return value;
}
