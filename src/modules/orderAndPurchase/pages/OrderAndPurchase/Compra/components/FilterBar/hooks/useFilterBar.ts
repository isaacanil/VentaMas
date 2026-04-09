import { useFilterBar as useSharedFilterBar } from '@/components/common/FilterBarLegacy/hooks/useFilterBar';
import type { FilterState } from '../types';

export const useFilterBar = (
  defaultFilters: FilterState['filters'] = {},
  defaultSort: { isAscending: boolean } = { isAscending: false },
) =>
  useSharedFilterBar<FilterState['filters']>(defaultFilters, defaultSort);
