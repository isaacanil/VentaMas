import { useState, useCallback } from 'react';
import type { FilterState } from '../types';

export const useFilterBar = (
  defaultFilters: FilterState['filters'] = {},
  defaultSort: { isAscending: boolean } = { isAscending: false },
) => {
  const [state, setState] = useState<FilterState>({
    filters: defaultFilters,
    isAscending: defaultSort.isAscending,
  });

  const setFilters = useCallback((newFilters: FilterState['filters']) => {
    const cleanedFilters = Object.fromEntries(
      Object.entries(newFilters).filter(([_, value]) => value !== null),
    ) as FilterState['filters'];
    setState((prev) => ({
      ...prev,
      filters: cleanedFilters,
    }));
  }, []);

  const setSorting = useCallback((ascending: boolean) => {
    setState((prev) => ({
      ...prev,
      isAscending: ascending,
    }));
  }, []);

  const resetAll = useCallback(() => {
    setState({
      filters: defaultFilters,
      isAscending: defaultSort.isAscending,
    });
  }, [defaultFilters, defaultSort.isAscending]);

  return {
    state,
    setFilters,
    setSorting,
    resetAll,
  };
};
