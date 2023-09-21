import React from 'react'

import { useState } from 'react';

const useTableSorting = (filteredData, columns, config = { key: null, direction: 'asc' }) => {
  const [sortConfig, setSortConfig] = useState(config);

  const sortedData = [...filteredData].sort((a, b) => {
    if (sortConfig.key === null || sortConfig.direction === 'none') return 0;

    const key = sortConfig.key;
    const column = columns.find(col => col.accessor === key);

    const aValue = column.sortableValue ? column.sortableValue(a[key]) : a[key];
    const bValue = column.sortableValue ? column.sortableValue(b[key]) : b[key];

    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const handleSort = (key, sortable) => {
    if (sortable) {
      let direction = 'asc';
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

