import type {
  ToolbarComponent,
  ToolbarImportFn,
  ToolbarLoader,
} from '../types';

export const createLazyLoader =
  (importFn: ToolbarImportFn, exportName?: string): ToolbarLoader =>
  () =>
    importFn().then((module) => {
      const resolved = (exportName ? module[exportName] : module.default) as
        | ToolbarComponent
        | undefined;

      if (!resolved) {
        const available = Object.keys(module);
        throw new Error(
          `Toolbar component "${exportName || 'default'}" not found. Available exports: ${available.join(', ')}`,
        );
      }

      return { default: resolved };
    });
