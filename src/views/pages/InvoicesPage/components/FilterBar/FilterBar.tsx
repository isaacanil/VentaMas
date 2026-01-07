import React, { useMemo } from 'react';

import { FilterBar as CommonFilterBar } from '@/components/common/FilterBar/FilterBar';
import type {
  DateRangeSelection,
  InvoiceFilters,
} from '@/types/invoiceFilters';

import { useClientOptions, useFilterHandlers } from './hooks';
import type { SortDirection } from './hooks';
import { AmountRangeFilter } from './components/AmountRangeFilter';
import { ClientFilter } from './components/ClientFilter';
import { DateRangeFilter } from './components/DateRangeFilter';
import { PaymentMethodFilter } from './components/PaymentMethodFilter';
import { PaymentStatusFilter } from './components/PaymentStatusFilter';
import { ReceivableFilter } from './components/ReceivableFilter';
import { SortControls } from './components/SortControls';
import { TotalsDisplay } from './components/TotalsDisplay';

interface FilterBarProps {
  invoices: Array<Record<string, unknown>>;
  datesSelected: DateRangeSelection;
  setDatesSelected: (next: DateRangeSelection) => void;
  filters: InvoiceFilters;
  onFiltersChange: (next: InvoiceFilters) => void;
  sortCriteria: string;
  sortDirection: SortDirection;
  onSortChange: (value: string) => void;
  onToggleDirection: () => void;
}

interface FilterItem {
  key: string;
  section: 'main' | 'additional';
  wrap?: boolean;
  minWidth?: number;
  label: string;
  render: (item: FilterItem) => React.ReactNode;
  value?: unknown;
  isActive?: ((value: unknown) => boolean) | boolean;
}

export const FilterBar = ({
  invoices,
  datesSelected,
  setDatesSelected,
  filters,
  onFiltersChange,
  sortCriteria,
  sortDirection,
  onSortChange,
  onToggleDirection,
}: FilterBarProps) => {
  const { clientOptions, clientsLoading } = useClientOptions();
  const { handlers, handleClearFilters, hasActiveFilters } = useFilterHandlers(
    filters,
    onFiltersChange,
  );

  const filterItems = useMemo<FilterItem[]>(
    () => [
      {
        key: 'date',
        section: 'main',
        wrap: false,
        minWidth: 220,
        label: 'Fechas',
        render: (item) => (
          <DateRangeFilter
            label={item.label}
            datesSelected={datesSelected}
            setDatesSelected={setDatesSelected}
          />
        ),
        value: datesSelected,
        isActive: (value) =>
          Boolean(
            (value as DateRangeSelection | undefined)?.startDate ||
              (value as DateRangeSelection | undefined)?.endDate,
          ),
      },
      {
        key: 'client',
        section: 'main',
        wrap: false,
        label: 'Cliente',
        render: (item) => (
          <ClientFilter
            label={item.label}
            value={filters?.clientId}
            onChange={handlers.clientId}
            clientOptions={clientOptions}
            loading={clientsLoading}
          />
        ),
        value: filters?.clientId,
      },
      {
        key: 'payment',
        section: 'additional',
        wrap: false,
        label: 'Método',
        render: (item) => (
          <PaymentMethodFilter
            label={item.label}
            value={filters?.paymentMethod}
            onChange={handlers.paymentMethod}
          />
        ),
        value: filters?.paymentMethod,
      },
      {
        key: 'paymentStatus',
        section: 'main',
        wrap: false,
        label: 'Pago',
        render: (item) => (
          <PaymentStatusFilter
            label={item.label}
            value={filters?.paymentStatus}
            onChange={handlers.paymentStatus}
          />
        ),
        value: filters?.paymentStatus,
      },
      {
        key: 'amount',
        section: 'additional',
        wrap: false,
        label: 'Monto',
        render: (item) => (
          <AmountRangeFilter
            label={item.label}
            minAmount={filters?.minAmount}
            maxAmount={filters?.maxAmount}
            onMinChange={handlers.minAmount}
            onMaxChange={handlers.maxAmount}
          />
        ),
        value: { min: filters?.minAmount, max: filters?.maxAmount },
        isActive: (value) =>
          Boolean(
            (value as { min?: number | null; max?: number | null } | undefined)
              ?.min ||
              (value as { min?: number | null; max?: number | null } | undefined)
                ?.max,
          ),
      },
      {
        key: 'receivable',
        section: 'main',
        label: 'CXC',
        wrap: false,
        render: (item) => (
          <ReceivableFilter
            label={item.label}
            value={filters?.receivablesOnly}
            onChange={handlers.receivablesOnly}
          />
        ),
        value: filters?.receivablesOnly,
      },
      {
        key: 'sort',
        section: 'main',
        wrap: false,
        label: 'Ordenar',
        render: (item) => (
          <SortControls
            label={item.label}
            sortCriteria={sortCriteria}
            sortDirection={sortDirection}
            onSortChange={onSortChange}
            onToggleDirection={onToggleDirection}
          />
        ),
        value: sortCriteria,
      },
    ],
    [
      clientOptions,
      clientsLoading,
      datesSelected,
      filters?.clientId,
      filters?.maxAmount,
      filters?.minAmount,
      filters?.paymentMethod,
      filters?.paymentStatus,
      filters?.receivablesOnly,
      handlers.clientId,
      handlers.minAmount,
      handlers.maxAmount,
      handlers.paymentMethod,
      handlers.paymentStatus,
      handlers.receivablesOnly,
      setDatesSelected,
      sortCriteria,
      sortDirection,
      onSortChange,
      onToggleDirection,
    ],
  );

  return (
    <CommonFilterBar
      items={filterItems}
      hasActiveFilters={hasActiveFilters}
      onClearFilters={handleClearFilters}
      labels={{
        drawerTrigger: 'Filtros',
        drawerTitle: 'Filtros',
        modalTitle: 'Filtros adicionales',
        more: 'Más filtros',
        clear: 'Limpiar',
      }}
      mobileHeaderRight={
        <TotalsDisplay invoices={invoices} className="mobile-extra" />
      }
    />
  );
};
