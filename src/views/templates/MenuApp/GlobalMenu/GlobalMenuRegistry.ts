import { lazyWithRetry } from '../../../../utils/lazyWithRetry';

import { toolbarConfigs } from './configs/toolbarConfigs';
import {
  createMatchers,
  findToolbarEntry as findEntry,
} from './core/findToolbarEntry';

import type {
  ToolbarEntryWithMatchers,
  ToolbarRegistryEntry,
} from './types';

/**
 * Main toolbar registry with all configured toolbars
 */
export const toolbarRegistry: ToolbarRegistryEntry[] = toolbarConfigs;

/**
 * Toolbar entries with matcher functions for route matching
 * + Component is created ONCE here (module scope), not during render.
 */
const toolbarEntries: ToolbarEntryWithMatchers[] = toolbarRegistry.map(
  (entry) => ({
    ...entry,
    matchers: createMatchers(entry),
    Component: lazyWithRetry(entry.loader, `GlobalMenu:${entry.id}`),
  }),
);

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
  ToolbarEntryWithMatchers,
} from './types';
