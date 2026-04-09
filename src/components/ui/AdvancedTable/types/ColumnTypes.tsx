import type { ReactNode } from 'react';

export type TableRow = Record<string, unknown>;

export type FilterValue = unknown;
export type FilterState = Record<string, FilterValue>;

export interface FilterOption {
  label: ReactNode;
  value: FilterValue;
  [key: string]: unknown;
}

export interface FilterConfig {
  label?: ReactNode;
  accessor: string;
  defaultValue?: FilterValue;
  options?: FilterOption[];
  format?: (value: FilterValue) => ReactNode;
  [key: string]: unknown;
}

export type SortDirection = 'asc' | 'desc' | 'none';

export interface SortConfig {
  key: string | null;
  direction: SortDirection;
}

export type CellType =
  | 'text'
  | 'number'
  | 'image'
  | 'status'
  | 'badge'
  | 'custom'
  | 'date'
  | 'dateStatus'
  | 'note'
  | 'price'
  | 'file';

export type ColumnStatus = 'active' | 'deleted' | string | boolean;

export type ColumnAlign =
  | 'left'
  | 'center'
  | 'right'
  | 'flex-start'
  | 'flex-end'
  | 'start'
  | 'end'
  | string;

export interface ColumnConfig<Row = TableRow> {
  Header: ReactNode;
  accessor: string;
  status?: ColumnStatus;
  sortable?: boolean;
  align?: ColumnAlign;
  fixed?: 'left' | 'right';
  right?: string;
  minWidth?: string;
  maxWidth?: string;
  keepWidth?: boolean;
  clickable?: boolean;
  reorderable?: boolean;
  originalPosition?: number;
  sortableValue?: (value: unknown) => unknown;
  cell?: (props: { value: unknown; row?: Row; rowIndex?: number }) => ReactNode;
  type?: CellType;
  cellProps?: Record<string, unknown>;
  format?: 'price' | 'percentage' | 'currency';
}
