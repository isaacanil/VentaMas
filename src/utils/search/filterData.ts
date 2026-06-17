import {
  normalizeSearchText,
  normalizeTrimmedSearchText,
} from '@/utils/searchText';

const MAX_DEPTH = 3;

const createSearchPredicate = (normalizedTerm: string) => {
  const searchInString = (value: string) =>
    normalizeSearchText(value).includes(normalizedTerm);
  const searchInNumber = (number: number) =>
    normalizeSearchText(number).includes(normalizedTerm);

  const searchInArray = (array: unknown[], depth: number) => {
    if (depth > MAX_DEPTH) return false;
    for (const item of array) {
      if (searchInItem(item, depth + 1)) return true;
    }
    return false;
  };

  const searchInObject = (obj: Record<string, unknown>, depth: number) => {
    if (depth > MAX_DEPTH) return false;
    for (const value of Object.values(obj)) {
      if (searchInItem(value, depth + 1)) return true;
    }
    return false;
  };

  const searchInItem = (item: unknown, depthLevel = 0): boolean => {
    if (item == null) return false;

    const searchByType: Record<string, () => boolean> = {
      string: () => searchInString(String(item)),
      number: () => searchInNumber(item as number),
      object: () => {
        if (depthLevel > MAX_DEPTH) return false;
        if (Array.isArray(item)) {
          return searchInArray(item, depthLevel);
        }
        if (item instanceof Date) {
          return searchInString(item.toISOString());
        }
        return searchInObject(item as Record<string, unknown>, depthLevel);
      },
      default: () => false,
    };

    const type = typeof item;
    return (searchByType[type] || searchByType.default)();
  };

  return (item: unknown) => searchInItem(item);
};

const validateFilterDataParams = (
  array: unknown,
  searchTerm: string | null | undefined,
) => {
  if (!array) {
    console.warn('useFilter: The first parameter must be a non-null array');
    return false;
  }
  if (!Array.isArray(array)) {
    console.warn('useFilter: The first parameter must be an array');
    return false;
  }
  if (
    typeof searchTerm !== 'string' &&
    searchTerm !== undefined &&
    searchTerm !== null
  ) {
    console.warn(
      'useFilter: The search term must be a string or null/undefined',
    );
    return false;
  }
  return true;
};

export const filterData = <T>(
  array: T[] | null | undefined,
  searchTerm: string | null | undefined,
) => {
  if (!validateFilterDataParams(array, searchTerm)) return array;

  const normalizedTerm = normalizeTrimmedSearchText(searchTerm);
  if (!normalizedTerm) return array;

  const searchPredicate = createSearchPredicate(normalizedTerm);

  try {
    return array?.filter(searchPredicate);
  } catch (e) {
    console.warn('useFilter: Error filtering data', e);
    return array;
  }
};
