// @ts-nocheck
import type { CountsMap } from './types';

export function getPersistedCount(
  serverCounts: CountsMap,
  key: string,
  fallback?: number,
) {
  if (serverCounts[key] !== undefined) return Number(serverCounts[key]);
  return Number(fallback ?? 0);
}

export function getEffectiveCount(
  counts: CountsMap,
  serverCounts: CountsMap,
  key: string,
  fallback?: number,
) {
  if (counts[key] !== undefined) return Number(counts[key]);
  return getPersistedCount(serverCounts, key, fallback);
}
