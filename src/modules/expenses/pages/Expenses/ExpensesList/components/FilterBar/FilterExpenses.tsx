import PropTypes from 'prop-types';
import { useCallback, useMemo } from 'react';

import { FilterBar as CommonFilterBar } from '@/components/common/FilterBar/FilterBar';

interface DateRangeFilter {
  startDate?: number | Date | null;
  endDate?: number | Date | null;
}

interface FilterOption {
  label: string;
  value: string;
}

interface FilterExpensesProps {
  filters: {
    dateRange?: DateRangeFilter | null;
    category?: string | null;
    status?: string | null;
  };
  onFiltersChange: (filters: FilterExpensesProps['filters']) => void;
  categoryOptions?: FilterOption[];
}

const EMPTY_CATEGORY_OPTIONS: FilterOption[] = [];

export const FilterExpenses = ({
  filters,
  onFiltersChange,
  categoryOptions = EMPTY_CATEGORY_OPTIONS,
}: FilterExpensesProps) => {
  const handleDateChange = useCallback(
    (range: DateRangeFilter | null) => {
      onFiltersChange({ ...filters, dateRange: range });
    },
    [filters, onFiltersChange],
  );

  const handleCategoryChange = useCallback(
    (value: string | null) => {
      onFiltersChange({ ...filters, category: value });
    },
    [filters, onFiltersChange],
  );

  const handleStatusChange = useCallback(
    (value: string | null) => {
      onFiltersChange({ ...filters, status: value });
    },
    [filters, onFiltersChange],
  );

  const handleClearFilters = useCallback(() => {
    onFiltersChange({
      dateRange: null,
      category: null,
      status: null,
    });
  }, [onFiltersChange]);

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        (filters.dateRange?.startDate && filters.dateRange?.endDate) ||
        filters.category ||
        filters.status,
      ),
    [filters],
  );

  const items = useMemo(
    () => [
      {
        key: 'date',
        section: 'main',
        minWidth: 220,
        wrap: false,
        label: 'Fechas',
        type: 'dateRange',
        value: filters.dateRange,
        onChange: handleDateChange,
        isActive: (value: DateRangeFilter) =>
          Boolean(value?.startDate || value?.endDate),
      },
      {
        key: 'category',
        section: 'main',
        label: 'Categoría',
        type: 'select',
        value: filters.category,
        onChange: handleCategoryChange,
        options: categoryOptions,
        placeholder: 'Categoría',
        showSearch: true,
        controlStyle: { width: 180 },
      },
      {
        key: 'status',
        section: 'main',
        label: 'Estado',
        type: 'select',
        value: filters.status,
        onChange: handleStatusChange,
        options: [
          { value: 'active', label: 'Activo' },
          { value: 'canceled', label: 'Cancelado' },
          { value: 'completed', label: 'Completado' },
          { value: 'pending', label: 'Pendiente' },
          { value: 'deleted', label: 'Eliminado' },
        ],
        placeholder: 'Estado',
        controlStyle: { width: 140 },
      },
    ],
    [
      filters,
      categoryOptions,
      handleDateChange,
      handleCategoryChange,
      handleStatusChange,
    ],
  );

  return (
    <CommonFilterBar
      items={items}
      hasActiveFilters={hasActiveFilters}
      onClearFilters={handleClearFilters}
      labels={{
        drawerTrigger: 'Filtros',
        drawerTitle: 'Filtros',
        modalTitle: 'Filtros adicionales',
        more: 'Más filtros',
        clear: 'Limpiar',
      }}
    />
  );
};

FilterExpenses.propTypes = {
  filters: PropTypes.object.isRequired,
  onFiltersChange: PropTypes.func.isRequired,
  categoryOptions: PropTypes.array,
};
