import { toolbarConfigs } from './configs/toolbarConfigs';
import {
  createMatchers,
  findToolbarEntry as findEntry,
} from './core/findToolbarEntry';

import type {
  ToolbarEntryWithMatchers,
  ToolbarRegistryEntry,
} from './types/types';

/**
 * Main toolbar registry with all configured toolbars
 */
export const toolbarRegistry: ToolbarRegistryEntry[] = toolbarConfigs;

/**
 * Toolbar entries with matcher functions for route matching
 */
const toolbarEntries: ToolbarEntryWithMatchers[] = toolbarRegistry.map(
  (entry) => ({
    ...entry,
    matchers: createMatchers(entry),
  }),
);

/**
 * Finds the toolbar entry that matches the current pathname
 * @param pathname - The current route pathname
 * @returns The matching toolbar entry or undefined
 */
export const findToolbarEntry = (
  pathname: string,
): ToolbarEntryWithMatchers | undefined => findEntry(pathname, toolbarEntries);

export default toolbarRegistry;

// Re-export types for convenience
export type {
  ToolbarSide,
  ToolbarComponentProps,
  ToolbarComponent,
  ToolbarRegistryEntry,
} from './types/types';
