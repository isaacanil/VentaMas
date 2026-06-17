import { useFilterBar as useSharedFilterBar } from '@/components/common/FilterBar';
import type { FilterState } from '../../../filterBarTypes';

export const useFilterBar = (
  defaultFilters: FilterState['filters'] = {},
  defaultSort: { isAscending: boolean } = { isAscending: false },
) =>
  useSharedFilterBar<FilterState['filters']>(defaultFilters, defaultSort);
