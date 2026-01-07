// @ts-nocheck
import type { MatchConfig } from '@/views/templates/MenuApp/GlobalMenu/types';
import type { PathPattern } from 'react-router-dom';

/**
 * Normalizes a match configuration into a PathPattern
 * @param match - String path or PathPattern object
 * @returns Normalized PathPattern with end: true by default
 */
export const normalizeMatch = (match: MatchConfig): PathPattern => {
  if (typeof match === 'string') {
    return { path: match, end: true };
  }

  if (match && typeof match === 'object' && 'path' in match) {
    return { ...match, end: match.end ?? true };
  }

  throw new Error('Invalid toolbar match configuration');
};
