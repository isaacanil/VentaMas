import type { PathPattern } from 'react-router-dom';

export type MatchConfig = string | PathPattern;

export const normalizeMatch = (match: MatchConfig): PathPattern => {
  if (typeof match === 'string') {
    return { path: match, end: true };
  }

  if (match && typeof match === 'object' && 'path' in match) {
    return { ...match, end: match.end ?? true };
  }

  throw new Error('Invalid toolbar match configuration');
};
