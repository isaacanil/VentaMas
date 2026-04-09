import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import type {
  FilterConfig,
  FilterOption,
  FilterState,
  TableRow,
} from '../types/ColumnTypes';

export const applyFilters = <RowData extends TableRow>(
  data: RowData[],
  filters?: FilterState | null,
): RowData[] => {
  if (!Array.isArray(data)) return [];
  if (!filters) return data;

  return data.filter((item) =>
    Object.keys(filters).every(
      (filterKey) => item?.[filterKey] === filters[filterKey],
    ),
  );
};

const generateFilterOptions = <RowData extends TableRow>(
  data: RowData[],
  accessor: string,
): FilterOption[] => {
  const uniqueValues = [
    ...new Set(data.map((item) => item?.[accessor])),
  ].filter((v) => v !== undefined && v !== null);

  return uniqueValues.map((value) => ({ label: String(value), value }));
};

export const useDynamicFilterConfig = <RowData extends TableRow>(
  initialFilterConfig: FilterConfig[] = [],
  data: RowData[] = [],
): FilterConfig[] => {
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
      // Preserve explicit options if provided; otherwise auto-generate from data
      options:
        filter.options && filter.options.length > 0
          ? filter.options
          : generateFilterOptions(data, filter.accessor),
    }));
  }, [initialFilterConfig, data]);
};

const useTableFiltering = <RowData extends TableRow>(
  filterConfig: FilterConfig[],
  data: RowData[],
): [
  FilterState,
  Dispatch<SetStateAction<FilterState>>,
  () => void,
  FilterState,
  RowData[],
] => {
  const defaultFilter = useMemo<FilterState>(() => {
    return filterConfig.reduce<FilterState>((acc, curr) => {
      if (curr.defaultValue !== undefined) {
        acc[curr.accessor] = curr.defaultValue;
      }
      return acc;
    }, {});
  }, [filterConfig]);

  const [filter, setFilter] = useState<FilterState>(defaultFilter);

  const setDefaultFilter = () => {
    setFilter(defaultFilter);
  };

  const filteredData = useMemo(
    () => applyFilters(data, filter),
    [data, filter],
  );

  return [filter, setFilter, setDefaultFilter, defaultFilter, filteredData];
};

export default useTableFiltering;
