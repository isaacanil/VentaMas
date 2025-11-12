import { useMemo } from 'react';

const MAX_DEPTH = 3;

const removeAccents = (str) =>
  str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const createSearchPredicate = (normalizedTerm) => {
  const searchInString = (str) => str.includes(normalizedTerm);
  const searchInNumber = (number) => number.toString().includes(normalizedTerm);

  const searchInArray = (array, depth) => {
    if (depth > MAX_DEPTH) return false;
    for (let i = 0; i < array.length; i++) {
      if (searchInItem(array[i], depth + 1)) return true;
    }
    return false;
  };

  const searchInObject = (obj, depth) => {
    if (depth > MAX_DEPTH) return false;
    for (const value of Object.values(obj)) {
      if (searchInItem(value, depth + 1)) return true;
    }
    return false;
  };

  const searchInItem = (item, depthLevel = 0) => {
    if (item == null) return false;

    const searchByType = {
      string: () => searchInString(removeAccents(item.toLowerCase())),
      number: () => searchInNumber(item),
      object: () => {
        if (depthLevel > MAX_DEPTH) return false;
        if (Array.isArray(item)) {
          return searchInArray(item, depthLevel);
        } else if (item instanceof Date) {
          return searchInString(
            removeAccents(item.toISOString().toLowerCase()),
          );
        } else {
          return searchInObject(item, depthLevel);
        }
      },
      default: () => false,
    };

    const type = typeof item;
    return (searchByType[type] || searchByType['default'])();
  };

  return (item) => searchInItem(item);
};

const validateFilterDataParams = (array, searchTerm) => {
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

export const filterData = (array, searchTerm) => {
  if (!validateFilterDataParams(array, searchTerm)) return array;

  const trimmedTerm = searchTerm?.trim() ?? '';
  if (!trimmedTerm) return array;

  const normalizedTerm = removeAccents(trimmedTerm.toLowerCase());
  const searchPredicate = createSearchPredicate(normalizedTerm);

  try {
    return array.filter(searchPredicate);
  } catch (e) {
    console.warn('useFilter: Error filtering data', e);
    return array;
  }
};

const useFilter = (data = [], searchTerm = '') => {
  // Ensure data and searchTerm have default values

  const trimmedTerm = searchTerm.trim();
  const normalizedTerm = removeAccents(trimmedTerm.toLowerCase());

  return useMemo(() => {
    if (!validateFilterDataParams(data, searchTerm)) return data;
    if (!trimmedTerm) return data;

    try {
      const searchPredicate = createSearchPredicate(normalizedTerm);
      return data.filter(searchPredicate);
    } catch (e) {
      console.warn('useFilter: Error in filter operation', e);
      return data;
    }
  }, [data, normalizedTerm]); // Dependencies are now always defined
};

export default useFilter;
