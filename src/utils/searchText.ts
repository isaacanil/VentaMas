import { stripDiacritics } from './text';

export const normalizeSearchText = (value: unknown = ''): string =>
  stripDiacritics(String(value)).toLowerCase();

export const normalizeTrimmedSearchText = (value: unknown = ''): string =>
  normalizeSearchText(value).trim();

export interface SearchTextRange {
  end: number;
  start: number;
}

export interface SearchTextIndex {
  normalized: string;
  original: string;
  ranges: SearchTextRange[];
}

export const buildSearchIndex = (value: unknown = ''): SearchTextIndex => {
  const original = String(value);
  const ranges: SearchTextRange[] = [];
  let normalized = '';
  let originalOffset = 0;

  for (const character of original) {
    const start = originalOffset;
    const end = start + character.length;
    const normalizedCharacter = normalizeSearchText(character);

    for (let index = 0; index < normalizedCharacter.length; index += 1) {
      ranges.push({ end, start });
    }

    normalized += normalizedCharacter;
    originalOffset = end;
  }

  return {
    normalized,
    original,
    ranges,
  };
};

export const normalizedIncludes = (
  value: unknown = '',
  searchTerm: unknown = '',
): boolean => {
  const term = normalizeTrimmedSearchText(searchTerm);
  if (!term) return true;

  return normalizeSearchText(value).includes(term);
};

type SearchableRecord = Record<string, unknown>;

export const filterByDeepSearchText = <T extends SearchableRecord>(
  array: T[],
  searchTerm: string,
): T[] => {
  const term = normalizeTrimmedSearchText(searchTerm);

  if (!term) {
    return array;
  }

  return array.filter((item) => hasDeepSearchTextMatch(item, term));
};

const hasDeepSearchTextMatch = (value: unknown, term: string): boolean => {
  if (typeof value === 'string' || typeof value === 'number') {
    return normalizedIncludes(value, term);
  }

  if (Array.isArray(value)) {
    return value.some((item) => hasDeepSearchTextMatch(item, term));
  }

  if (typeof value === 'object' && value !== null) {
    return Object.values(value).some((item) =>
      hasDeepSearchTextMatch(item, term),
    );
  }

  return false;
};
