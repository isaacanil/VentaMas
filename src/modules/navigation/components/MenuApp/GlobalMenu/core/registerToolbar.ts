import { createLazyLoader } from '@/utils/createLazyLoader';
import { normalizeMatch } from '@/utils/normalizeMatch';

import type {
  RegisterToolbarArgs,
  ToolbarRegistryEntry,
} from '@/modules/navigation/components/MenuApp/GlobalMenu/types';

/**
 * Registers a toolbar component with its route patterns
 * @param args - Configuration for the toolbar registration
 * @returns ToolbarRegistryEntry with normalized matches and loader
 */
export const registerToolbar = ({
  id,
  routes,
  importFn,
  exportName,
}: RegisterToolbarArgs): ToolbarRegistryEntry => ({
  id,
  matches: (Array.isArray(routes) ? routes : [routes]).map(normalizeMatch),
  loader: createLazyLoader(importFn, exportName),
});
