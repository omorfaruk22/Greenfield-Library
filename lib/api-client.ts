'use client';

type GetCacheEntry = { expiresAt: number; promise: Promise<unknown> };
const getCache = new Map<string, GetCacheEntry>();
const GET_CACHE_TTL = 8_000;

export function clearApiRequestCache() {
  getCache.clear();
}

export function prefetchApiRequest(url: string) {
  void apiRequest(url).catch(() => undefined);
}

export async function apiRequest<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const method = (init?.method || 'GET').toUpperCase();
  const cacheable = method === 'GET' && init?.cache !== 'no-store';
  if (!cacheable) clearApiRequestCache();

  if (cacheable) {
    const cached = getCache.get(url);
    if (cached && cached.expiresAt > Date.now()) return cached.promise as Promise<T>;
    if (cached) getCache.delete(url);
  }

  const promise = (async () => {
    const response = await fetch(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    });
    const data = await response.json().catch(() => ({})) as T & { error?: string; details?: Record<string, string[]> };
    if (!response.ok) {
      const fieldErrors = data && typeof data === 'object' && 'details' in data ? Object.values(data.details || {}).flat().join(' ') : '';
      throw new Error([data && typeof data === 'object' && 'error' in data ? data.error : 'Request failed.', fieldErrors].filter(Boolean).join(' '));
    }
    return data;
  })();

  if (cacheable) {
    const entry = { expiresAt: Date.now() + GET_CACHE_TTL, promise };
    getCache.set(url, entry);
    void promise.catch(() => {
      if (getCache.get(url) === entry) getCache.delete(url);
    });
  }
  return promise;
}
