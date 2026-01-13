import { matchPath } from 'react-router-dom';

import type {
  ToolbarEntryWithMatchers,
  ToolbarRegistryEntry,
} from '@/modules/navigation/components/MenuApp/GlobalMenu/types';

/**
 * Finds the toolbar entry that matches the current pathname
 * @param pathname - The current route pathname
 * @param toolbarEntries - Array of toolbar entries with matchers
 * @returns The matching toolbar entry or undefined
 */
export const findToolbarEntry = (
  pathname: string,
  toolbarEntries: ToolbarEntryWithMatchers[],
): ToolbarEntryWithMatchers | undefined =>
  toolbarEntries.find(({ matchers }) =>
    matchers.some((matcher) => matcher(pathname)),
  );

/**
 * Creates matcher functions for each pattern in a toolbar entry
 * @param entry - The toolbar registry entry
 * @returns Array of matcher functions
 */
export const createMatchers = (
  entry: Pick<ToolbarRegistryEntry, 'matches'>,
) =>
  entry.matches.map(
    (pattern) => (pathname: string) => Boolean(matchPath(pattern, pathname)),
  );

