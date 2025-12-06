import { useState, useCallback, useRef, useEffect } from 'react';

export const useFilterBar = (
  defaultFilters = {},
  defaultSort = { isAscending: false },
) => {
  const [state, setState] = useState({
    filters: defaultFilters,
    isAscending: defaultSort.isAscending,
  });

  const initialDefaultValues = useRef(defaultFilters);

  useEffect(() => {
    if (
      JSON.stringify(defaultFilters) !==
      JSON.stringify(initialDefaultValues.current)
    ) {
      setState((prev) => ({
        ...prev,
        filters: defaultFilters,
      }));
      initialDefaultValues.current = defaultFilters;
    }
  }, [defaultFilters]);

  const setFilters = useCallback((newFilters) => {
    const cleanedFilters = Object.fromEntries(
      Object.entries(newFilters).filter(([_, value]) => value !== null),
    );
    setState((prev) => ({
      ...prev,
      filters: cleanedFilters,
    }));
  }, []);

  const setSorting = useCallback((ascending) => {
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
