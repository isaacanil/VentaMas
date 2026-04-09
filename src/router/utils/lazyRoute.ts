import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

const isChunkLoadError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  const { name, message } = error as { name?: string; message?: string };
  const msg = message ?? '';
  return (
    name === 'ChunkLoadError' ||
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed')
  );
};

/**
 * Drop-in replacement for `React.lazy` optimised for Vite dev-server.
 *
 * **DEV:** Behaves like `React.lazy` by default. If
 * `VITE_ENABLE_LAZY_ROUTE_WARMUP=true`, it immediately fires the dynamic
 * `import()` when the route file is evaluated. This warms Vite's
 * module-transform cache at startup (faster later navigations, heavier
 * startup).
 *
 * **PROD:** Wraps the import with retry-on-reload logic so that stale chunk
 * URLs (left over after a new deployment) trigger a single page reload
 * instead of a blank error screen.
 *
 * Usage – replace:
 *   import { lazy } from 'react';
 * with:
 *   import { lazyRoute as lazy } from '@/router/utils/lazyRoute';
 */
export const lazyRoute = <T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> => {
  const shouldWarmupInDev =
    import.meta.env.DEV &&
    import.meta.env.VITE_ENABLE_LAZY_ROUTE_WARMUP === 'true';

  if (shouldWarmupInDev) {
    // Start the import NOW to warm up Vite's transform cache in development.
    const modulePromise = factory();
    return lazy(() => modulePromise);
  }

  if (import.meta.env.DEV) {
    return lazy(factory);
  }

  return lazy(async () => {
    const storageKey = 'lazyRoute-retry';
    try {
      const mod = await factory();
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(storageKey);
      }
      return mod;
    } catch (error) {
      if (typeof window !== 'undefined' && isChunkLoadError(error)) {
        const hasReloaded = window.sessionStorage.getItem(storageKey);
        if (!hasReloaded) {
          window.sessionStorage.setItem(storageKey, 'true');
          window.location.reload();
          // Intentionally unresolved: the reload will interrupt the render cycle.
          return new Promise<never>(() => { });
        }
      }
      throw error;
    }
  });
};
