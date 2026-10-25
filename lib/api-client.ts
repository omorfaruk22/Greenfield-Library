'use client';

export async function apiRequest<T = unknown>(url: string, init?: RequestInit): Promise<T> {
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
}
