import { useCallback, useMemo, useState } from 'react';

// Shared state helper for filter bars that keep filters and sort direction together.
export type FilterBarState<TFilters extends Record<string, unknown>> = {
  filters: TFilters;
  isAscending: boolean;
};

export type FilterBarSort = {
  isAscending?: boolean;
};

type FilterBarStateSnapshot<TFilters extends Record<string, unknown>> =
  FilterBarState<TFilters> & {
    defaultFiltersKey: string;
  };

export const useFilterBar = <TFilters extends Record<string, unknown>>(
  defaultFilters: TFilters = {} as TFilters,
  defaultSort: FilterBarSort = { isAscending: false },
) => {
  const currentDefaultFiltersKey = JSON.stringify(defaultFilters);
  const [state, setState] = useState<FilterBarStateSnapshot<TFilters>>({
    filters: defaultFilters,
    isAscending: defaultSort.isAscending ?? false,
    defaultFiltersKey: currentDefaultFiltersKey,
  });

  const effectiveFilters =
    state.defaultFiltersKey === currentDefaultFiltersKey
      ? state.filters
      : defaultFilters;

  const effectiveState = useMemo<FilterBarState<TFilters>>(
    () => ({
      filters: effectiveFilters,
      isAscending: state.isAscending,
    }),
    [effectiveFilters, state.isAscending],
  );

  const setFilters = useCallback((newFilters: TFilters) => {
    const cleanedFilters = Object.fromEntries(
      Object.entries(newFilters).filter(([_, value]) => value !== null),
    ) as TFilters;
    setState((prev) => ({
      ...prev,
      filters: cleanedFilters,
      defaultFiltersKey: currentDefaultFiltersKey,
    }));
  }, [currentDefaultFiltersKey]);

  const setSorting = useCallback((ascending: boolean) => {
    setState((prev) => ({
      ...prev,
      filters:
        prev.defaultFiltersKey === currentDefaultFiltersKey
          ? prev.filters
          : defaultFilters,
      isAscending: ascending,
      defaultFiltersKey: currentDefaultFiltersKey,
    }));
  }, [currentDefaultFiltersKey, defaultFilters]);

  const resetAll = useCallback(() => {
    setState({
      filters: defaultFilters,
      isAscending: defaultSort.isAscending ?? false,
      defaultFiltersKey: currentDefaultFiltersKey,
    });
  }, [currentDefaultFiltersKey, defaultFilters, defaultSort.isAscending]);

  return {
    state: effectiveState,
    setFilters,
    setSorting,
    resetAll,
  };
};
