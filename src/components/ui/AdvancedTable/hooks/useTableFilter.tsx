// @ts-nocheck
import { useMemo, useState } from 'react';

export const applyFilters = (data, filters) => {
  if (!Array.isArray(data)) return [];
  if (!filters) return data;

  return data.filter((item) =>
    Object.keys(filters).every((filterKey) => item?.[filterKey] === filters[filterKey]),
  );
};

const generateFilterOptions = (data, accessor) => {
  const uniqueValues = [...new Set(data.map((item) => item?.[accessor]))]
    .filter((v) => v !== undefined && v !== null);

  return uniqueValues.map((value) => ({ label: String(value), value }));
};

export const useDynamicFilterConfig = (initialFilterConfig = [], data = []) => {
  if (!Array.isArray(initialFilterConfig)) {
    throw new Error('initialFilterConfig debe ser un array');
  }
  if (!Array.isArray(data)) {
    throw new Error('data debe ser un array');
  }

  // Derivado: no state, no effect
  return useMemo(() => {
    return initialFilterConfig.map((filter) => ({
      ...filter,
      options: generateFilterOptions(data, filter.accessor),
    }));
  }, [initialFilterConfig, data]);
};

const useTableFiltering = (filterConfig, data) => {
  const defaultFilter = useMemo(() => {
    return filterConfig.reduce((acc, curr) => {
      if (curr.defaultValue !== undefined) {
        acc[curr.accessor] = curr.defaultValue;
      }
      return acc;
    }, {});
  }, [filterConfig]);

  const [filter, setFilter] = useState(defaultFilter);

  const setDefaultFilter = () => {
    setFilter(defaultFilter);
  };

  const filteredData = useMemo(() => applyFilters(data, filter), [data, filter]);

  return [filter, setFilter, setDefaultFilter, defaultFilter, filteredData];
};

export default useTableFiltering;
