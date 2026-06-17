import {
  createDeepSearchTextPredicate,
  type DeepSearchTextOptions,
} from '@/utils/searchText';

const MAX_DEPTH = 3;

const FILTER_DATA_SEARCH_OPTIONS: DeepSearchTextOptions = {
  includeDates: true,
  maxDepth: MAX_DEPTH,
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

  const searchPredicate = createDeepSearchTextPredicate(
    searchTerm,
    FILTER_DATA_SEARCH_OPTIONS,
  );
  if (!searchPredicate) return array;

  try {
    return array?.filter(searchPredicate);
  } catch (e) {
    console.warn('useFilter: Error filtering data', e);
    return array;
  }
};
