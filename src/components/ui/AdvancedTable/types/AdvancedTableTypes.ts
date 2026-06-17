import type { ReactNode, UIEvent } from 'react';

import type {
  DatePickerProps,
  DateRangeValue,
} from '@/components/common/DatePicker/adapters/MillisRangeDatePicker/DatePicker';
import type {
  ColumnConfig,
  FilterConfig,
  FilterOption,
  TableRow,
} from './ColumnTypes';

export type AdvancedTableColumn<Row = TableRow> = ColumnConfig<Row>;
export type AdvancedTableFilterConfig = FilterConfig;
export type AdvancedTableFilterOption = FilterOption;

export interface ScrollMetrics {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  isAtTop: boolean;
  isAtBottom: boolean;
}

export type AdvancedTableScrollMetrics = ScrollMetrics;

export interface AdvancedTableProps<Row = TableRow> {
  columns?: AdvancedTableColumn<Row>[];
  data?: Row[];
  loading?: boolean;
  numberOfElementsPerPage?: number;
  groupBy?: string | null;
  rowSize?: 'small' | 'medium' | 'large';
  rowBorder?: boolean | string;
  headerComponent?: ReactNode;
  filterUI?: boolean;
  datePicker?: boolean;
  footerLeftSide?: ReactNode;
  footerRightSide?: ReactNode;
  filterConfig?: AdvancedTableFilterConfig[];
  searchTerm?: string;
  elementName?: string;
  tableName?: string;
  dateRange?: DateRangeValue | null;
  defaultDate?: DatePickerProps['datesDefault'];
  datesKeyConfig?: string;
  setDateRange?: (value: DateRangeValue) => void;
  emptyText?: ReactNode;
  onRowClick?: (row: Row) => void;
  title?: ReactNode;
  onScroll?: (event: UIEvent<HTMLDivElement>) => void;
  onScrollMetrics?: (metrics: ScrollMetrics) => void;
  expandedRowRender?: (row: Row) => ReactNode;
  rowExpandable?: (row: Row) => boolean;
  getRowId?: (row: Row, index?: number) => string | number;
  enableVirtualization?: boolean;
  paginateVirtualizedData?: boolean;
  showPagination?: boolean;
}
