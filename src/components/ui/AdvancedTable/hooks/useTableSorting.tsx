import { useState } from 'react';
import type {
  ColumnConfig,
  SortConfig,
  SortDirection,
  TableRow,
} from '../types/ColumnTypes';

const toSortableValue = (
  value: unknown,
): string | number | boolean | bigint | Date | null => {
  if (value == null) return null;
  if (value instanceof Date) return value;
  switch (typeof value) {
    case 'number':
    case 'string':
    case 'boolean':
    case 'bigint':
      return value;
    default:
      return String(value);
  }
};

const useTableSorting = <RowData extends TableRow>(
  filteredData: RowData[],
  columns: ColumnConfig<RowData>[],
  config: SortConfig = { key: null, direction: 'asc' },
) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>(config);

  const sortedData = [...filteredData].sort((a, b) => {
    if (sortConfig.key === null || sortConfig.direction === 'none') return 0;

    const key = sortConfig.key;
    const column = columns.find((col) => col.accessor === key);

    const aValue = column?.sortableValue
      ? column.sortableValue(a[key])
      : a[key];
    const bValue = column?.sortableValue
      ? column.sortableValue(b[key])
      : b[key];

    const aComparable = toSortableValue(aValue);
    const bComparable = toSortableValue(bValue);

    if (aComparable == null || bComparable == null) return 0;

    if (aComparable < bComparable) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aComparable > bComparable) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const handleSort = (key: string, sortable?: boolean) => {
    if (sortable) {
      let direction: SortDirection = 'asc';
      if (sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
        direction = 'none';
      }
      setSortConfig({ key, direction });
    }
  };

  return { sortedData, handleSort, sortConfig };
};

export default useTableSorting;
