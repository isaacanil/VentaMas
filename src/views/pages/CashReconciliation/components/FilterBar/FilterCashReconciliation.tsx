import { faArrowDownAZ, faArrowUpAZ } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'antd';
import React, { useCallback, useMemo } from 'react';
import type { CashCountState } from '@/utils/cashCount/types';
import { FilterBar as CommonFilterBar } from '@/components/common/FilterBar/FilterBar';

interface DateRangeFilter {
  startDate: number | null;
  endDate: number | null;
}

interface CashReconciliationFilters {
  createdAtDateRange: DateRangeFilter | null;
  status: CashCountState | 'active';
  user: string | null;
}

interface FilterOption {
  label: string;
  value: string;
}

interface FilterCashReconciliationProps {
  filters: CashReconciliationFilters;
  onFiltersChange: (filters: CashReconciliationFilters) => void;
  sortAscending: boolean;
  onSortChange: (value: boolean) => void;
  userOptions?: FilterOption[];
}

export const FilterCashReconciliation: React.FC<FilterCashReconciliationProps> = ({
  filters,
  onFiltersChange,
  sortAscending,
  onSortChange,
  userOptions = [],
}) => {
  const handleDateChange = useCallback(
    (range: DateRangeFilter | null) => {
      onFiltersChange({ ...filters, createdAtDateRange: range });
    },
    [filters, onFiltersChange],
  );

  const handleStatusChange = useCallback(
    (value: CashCountState | 'active') => {
      onFiltersChange({ ...filters, status: value });
    },
    [filters, onFiltersChange],
  );

  const handleUserChange = useCallback(
    (value: string | null) => {
      onFiltersChange({ ...filters, user: value });
    },
    [filters, onFiltersChange],
  );

  const handleClearFilters = useCallback(() => {
    onFiltersChange({
      createdAtDateRange: null,
      status: 'active',
      user: null,
    });
  }, [onFiltersChange]);

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      (filters.createdAtDateRange?.startDate &&
        filters.createdAtDateRange?.endDate) ||
        filters.status ||
        filters.user,
    );
  }, [filters]);

  const items = useMemo(
    () => [
      {
        key: 'date',
        section: 'main',
        minWidth: 220,
        wrap: false,
        label: 'Fechas',
        type: 'dateRange',
        value: filters.createdAtDateRange,
        onChange: handleDateChange,
        isActive: (value: DateRangeFilter | null) =>
          value?.startDate || value?.endDate,
      },
      {
        key: 'status',
        section: 'main',
        label: 'Estado',
        type: 'select',
        value: filters.status,
        onChange: handleStatusChange,
        options: [
          { label: 'Abierto y cerrando', value: 'active' },
          { label: 'Cerrado', value: 'closed' },
        ],
        placeholder: 'Estado',
        controlStyle: { width: 150 },
        props: { popupMatchSelectWidth: false },
      },
      {
        key: 'user',
        section: 'main',
        label: 'Usuario',
        type: 'select',
        value: filters.user,
        onChange: handleUserChange,
        options: userOptions,
        placeholder: 'Usuario',
        showSearch: true,
        controlStyle: { width: 180 },
        props: { popupMatchSelectWidth: false },
        filterOption: (input: string, option?: { label?: string }) =>
          (option?.label ?? '').toLowerCase().includes(input.toLowerCase()),
      },
      {
        key: 'sort',
        section: 'main',
        label: 'Ordenar',
        wrap: false,
        render: () => (
          <Button
            icon={
              <FontAwesomeIcon
                icon={sortAscending ? faArrowUpAZ : faArrowDownAZ}
              />
            }
            onClick={() => onSortChange(!sortAscending)}
          >
            {sortAscending ? 'Ascendente' : 'Descendente'}
          </Button>
        ),
        value: sortAscending,
      },
    ],
    [
      filters,
      userOptions,
      sortAscending,
      onSortChange,
      handleDateChange,
      handleStatusChange,
      handleUserChange,
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
        more: 'M?s filtros',
        clear: 'Limpiar',
      }}
    />
  );
};
