import { useCallback, useState } from 'react';

export type FilterBarState<TFilters extends Record<string, unknown>> = {
  filters: TFilters;
  isAscending: boolean;
};

export type FilterBarSort = {
  isAscending?: boolean;
};

export const useFilterBar = <TFilters extends Record<string, unknown>>(
  defaultFilters: TFilters = {} as TFilters,
  defaultSort: FilterBarSort = { isAscending: false },
) => {
  const [state, setState] = useState<FilterBarState<TFilters>>({
    filters: defaultFilters,
    isAscending: defaultSort.isAscending ?? false,
  });

  const [prevDefaultFiltersSerialized, setPrevDefaultFiltersSerialized] =
    useState(() => JSON.stringify(defaultFilters));

  // PATR├ôN RECOMENDADO REACT: Ajustar estado durante render al cambiar props
  const currentDefaultFiltersSerialized = JSON.stringify(defaultFilters);
  if (currentDefaultFiltersSerialized !== prevDefaultFiltersSerialized) {
    setPrevDefaultFiltersSerialized(currentDefaultFiltersSerialized);
    setState((prev) => ({
      ...prev,
      filters: defaultFilters,
    }));
  }

  const setFilters = useCallback((newFilters: TFilters) => {
    const cleanedFilters = Object.fromEntries(
      Object.entries(newFilters).filter(([_, value]) => value !== null),
    ) as TFilters;
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
      isAscending: defaultSort.isAscending ?? false,
    });
  }, [defaultFilters, defaultSort.isAscending]);

  return {
    state,
    setFilters,
    setSorting,
    resetAll,
  };
};
