import { useState, useEffect } from 'react';

export const useTableFilter = (initialData) => {
  const [data, setData] = useState(initialData);
  const [filters, setFilters] = useState({});

  const applyFilters = () => {
    let filteredData = [...initialData];
    // Tu lógica para aplicar filtros aquí
    setData(filteredData);
  };

  const handleFilterChange = (column, value) => {
    setFilters({
      ...filters,
      [column]: value,
    });
  };

  useEffect(() => {
    applyFilters();
  }, [filters]);

  return {
    data,
    handleFilterChange,
  };
};
