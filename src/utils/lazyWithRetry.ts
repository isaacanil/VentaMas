// @ts-nocheck
import { lazy } from 'react';

const isChunkLoadError = (error) => {
  if (!error) return false;
  const message = error.message ?? '';
  return (
    error.name === 'ChunkLoadError' ||
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed')
  );
};

/**
 * Wraps React.lazy imports to gracefully recover from intermittent chunk loading failures.
 * When the dynamic import cannot be fetched (typically due to a stale cache), the page
 * is reloaded once so the client can pull the fresh bundle.
 */
export const lazyWithRetry = (importer, cacheKey = 'lazy-module') => {
  return lazy(async () => {
    const storageKey = `lazy-retry:${cacheKey}`;

    try {
      const module = await importer();
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(storageKey);
      }
      return module;
    } catch (error) {
      if (typeof window !== 'undefined' && isChunkLoadError(error)) {
        const hasReloaded = window.sessionStorage.getItem(storageKey);
        if (!hasReloaded) {
          window.sessionStorage.setItem(storageKey, 'true');
          window.location.reload();
          return new Promise(() => {
            // Intentionally unresolved: the reload will interrupt the render cycle.
          });
        }
      }
      throw error;
    }
  });
};
