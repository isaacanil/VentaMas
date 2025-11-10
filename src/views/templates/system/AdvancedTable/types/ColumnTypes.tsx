import React from 'react';

export type CellType = 'text' | 'number' | 'image' | 'status' | 'badge' | 'custom' | 'date' | 'dateStatus' | 'note' | 'price' | 'file';

export interface ColumnConfig {
  Header: string;
  accessor: string;
  status?: 'active' | 'inactive';
  sortable?: boolean;
  align?: string;
  fixed?: 'left' | 'right';
  minWidth?: string;
  maxWidth?: string;
  keepWidth?: boolean;
  clickable?: boolean;
  cell?: (props: { value: any }) => React.ReactNode;
  type?: CellType;
  cellProps?: Record<string, any>;
  format?: 'price' | 'percentage' | 'currency';
}
