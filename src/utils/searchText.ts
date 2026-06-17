import { normalizeText } from './text';

export const normalizeSearchText = (value: unknown = ''): string =>
  normalizeText(String(value));

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

export interface DeepSearchTextOptions {
  includeDates?: boolean;
  maxDepth?: number;
}

const canTraverseDeepSearchValue = (
  depthLevel: number,
  maxDepth: number | undefined,
): boolean => maxDepth === undefined || depthLevel <= maxDepth;

const matchesNormalizedDeepSearchText = (
  value: unknown,
  normalizedTerm: string,
  options: DeepSearchTextOptions,
  depthLevel = 0,
): boolean => {
  if (typeof value === 'string' || typeof value === 'number') {
    return normalizeSearchText(value).includes(normalizedTerm);
  }

  if (options.includeDates && value instanceof Date) {
    return normalizeSearchText(value.toISOString()).includes(normalizedTerm);
  }

  if (Array.isArray(value)) {
    if (!canTraverseDeepSearchValue(depthLevel, options.maxDepth)) {
      return false;
    }

    return value.some((item) =>
      matchesNormalizedDeepSearchText(
        item,
        normalizedTerm,
        options,
        depthLevel + 1,
      ),
    );
  }

  if (typeof value === 'object' && value !== null) {
    if (!canTraverseDeepSearchValue(depthLevel, options.maxDepth)) {
      return false;
    }

    return Object.values(value).some((item) =>
      matchesNormalizedDeepSearchText(
        item,
        normalizedTerm,
        options,
        depthLevel + 1,
      ),
    );
  }

  return false;
};

export const matchesDeepSearchText = (
  value: unknown,
  searchTerm: unknown = '',
  options: DeepSearchTextOptions = {},
): boolean => {
  const term = normalizeTrimmedSearchText(searchTerm);
  if (!term) return true;

  return matchesNormalizedDeepSearchText(value, term, options);
};

export const createDeepSearchTextPredicate = (
  searchTerm: unknown = '',
  options: DeepSearchTextOptions = {},
): ((value: unknown) => boolean) | null => {
  const term = normalizeTrimmedSearchText(searchTerm);
  if (!term) return null;

  return (value) => matchesNormalizedDeepSearchText(value, term, options);
};

export const filterByDeepSearchText = <T extends SearchableRecord>(
  array: T[],
  searchTerm: string,
): T[] => {
  const searchPredicate = createDeepSearchTextPredicate(searchTerm);

  if (!searchPredicate) {
    return array;
  }

  return array.filter(searchPredicate);
};
