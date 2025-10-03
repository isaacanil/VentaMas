import type { ToolbarImportFn, ToolbarLoader, ToolbarComponent } from '../types/types'

/**
 * Creates a lazy loader for a toolbar component
 * @param importFn - Function that imports the toolbar module
 * @param exportName - Optional named export, defaults to 'default'
 * @returns A loader function that resolves to the toolbar component
 */
export const createLazyLoader = (importFn: ToolbarImportFn, exportName?: string): ToolbarLoader => () =>
  importFn().then((module) => {
    const resolved = (exportName ? module[exportName] : module.default) as ToolbarComponent | undefined

    if (!resolved) {
      const available = Object.keys(module)
      throw new Error(`Toolbar component "${exportName || 'default'}" not found. Available exports: ${available.join(', ')}`)
    }

    return { default: resolved }
  })
