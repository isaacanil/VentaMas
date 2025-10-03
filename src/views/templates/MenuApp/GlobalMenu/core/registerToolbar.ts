import type { RegisterToolbarArgs, ToolbarRegistryEntry } from '../types/types'
import { createLazyLoader } from '../utils/createLazyLoader'
import { normalizeMatch } from '../utils/normalizeMatch'
import { ensureArray } from '../utils/ensureArray'

/**
 * Registers a toolbar component with its route patterns
 * @param args - Configuration for the toolbar registration
 * @returns ToolbarRegistryEntry with normalized matches and loader
 */
export const registerToolbar = ({ id, routes, importFn, exportName }: RegisterToolbarArgs): ToolbarRegistryEntry => ({
  id,
  matches: ensureArray(routes).map(normalizeMatch),
  loader: createLazyLoader(importFn, exportName),
})
