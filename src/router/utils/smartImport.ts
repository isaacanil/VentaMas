import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

type Importer<T> = () => Promise<{ default: T }>;

type SmartImportResult<T extends ComponentType<any>> =
  | T
  | LazyExoticComponent<T>;

/**
 * smartImport
 * - DEV: returns the eager component if provided to avoid dynamic import waterfalls.
 * - PROD: returns React.lazy(importer).
 *
 * Usage (DEV eager, PROD lazy):
 *   import { MyRoute } from './MyRoute';
 *   const MyRouteSmart = smartImport(() => import('./MyRoute'), MyRoute);
 *
 * Usage with import.meta.glob:
 *   const eager = import.meta.glob('./routes/*.tsx', { eager: true });
 *   const MyRouteSmart = smartImport(() => import('./routes/MyRoute'), (eager['./routes/MyRoute.tsx'] as any).default);
 */
export const smartImport = <T extends ComponentType<any>>(
  importer: Importer<T>,
  eager?: T,
): SmartImportResult<T> => {
  if (import.meta.env.DEV && eager) {
    return eager;
  }
  return lazy(importer);
};
