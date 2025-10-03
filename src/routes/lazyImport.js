import { lazy } from 'react';

// Auxiliary helper to lazy-load components regardless of named or default export
export const lazyImport = (factory, name) => {
  return lazy(async () => {
    const module = await factory();
    const resolvedExport = name ? module?.[name] : module?.default ?? module;

    if (!resolvedExport) {
      const available = module ? Object.keys(module).join(', ') : 'none';
      throw new Error(`lazyImport: failed loading ${name ?? 'default'} export. Available exports: ${available}`);
    }

    return { default: resolvedExport };
  });
};
