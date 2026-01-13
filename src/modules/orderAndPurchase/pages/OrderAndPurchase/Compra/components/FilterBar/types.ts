import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export type FilterType = 'select' | 'status' | 'search';

export interface FilterOption {
  value: string;
  label: string;
  icon?: IconDefinition;
}

export interface FilterConfigItem {
  type: FilterType;
  key: string;
  placeholder?: string;
  allowClear?: boolean;
  icon?: IconDefinition;
  options?: FilterOption[];
  visibleStatus?: string[];
  clearText?: string;
  showSearch?: boolean;
}

export interface FilterConfigState {
  filters: FilterConfigItem[];
  defaultValues: Record<string, unknown>;
  defaultSort?: { isAscending: boolean };
  showSortButton?: boolean;
  showResetButton?: boolean;
}

export interface FilterState {
  filters: Record<string, unknown>;
  isAscending: boolean;
}

export interface DataConfigEntry<TData> {
  data: TData[];
  accessor: (item: TData) => FilterOption;
}

export type DataConfigMap = Record<string, DataConfigEntry<unknown>>;

export interface StatusOption extends FilterOption {
  color?: string;
  bgColor?: string;
  borderColor?: string;
}
