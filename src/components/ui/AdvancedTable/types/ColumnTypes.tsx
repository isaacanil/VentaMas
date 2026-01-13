// @ts-nocheck
import type { ReactNode } from 'react';

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

export interface ColumnConfig {
  Header: string;
  accessor: string;
  status?: string;
  sortable?: boolean;
  align?: string;
  fixed?: 'left' | 'right';
  minWidth?: string;
  maxWidth?: string;
  keepWidth?: boolean;
  clickable?: boolean;
  cell?: (props: { value: unknown }) => ReactNode;
  type?: CellType;
  cellProps?: Record<string, unknown>;
  format?: 'price' | 'percentage' | 'currency';
}
