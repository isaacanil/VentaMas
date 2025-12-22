import PropTypes from 'prop-types';
import React, { useMemo } from 'react';

import { FilterBar as CommonFilterBar } from '../../../../../components/common/FilterBar';

import {
  AmountRangeFilter,
  ClientFilter,
  DateRangeFilter,
  PaymentMethodFilter,
  PaymentStatusFilter,
  ReceivableFilter,
  SortControls,
  TotalsDisplay,
} from './components';
import { useClientOptions, useFilterHandlers, useInvoiceSorting } from './hooks';

export const FilterBar = ({
  invoices,
  datesSelected,
  setDatesSelected,
  processedInvoices,
  setProcessedInvoices,
  filters,
  onFiltersChange,
}) => {
  const { clientOptions, clientsLoading } = useClientOptions();
  const { handlers, handleClearFilters, hasActiveFilters } = useFilterHandlers(
    filters,
    onFiltersChange,
  );
  const sortingProps = useInvoiceSorting(
    processedInvoices,
    setProcessedInvoices,
  );

  const filterItems = useMemo(
    () => [
      {
        key: 'date',
        section: 'main',
        minWidth: 260,
        wrap: false,
      
        label: 'Fechas',
        render: (item) => (
          <DateRangeFilter
            label={item.label}
            datesSelected={datesSelected}
            setDatesSelected={setDatesSelected}
          />
        ),
        value: datesSelected,
        isActive: (value) => !!(value?.startDate || value?.endDate),
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
        isActive: (value) => !!(value?.min || value?.max),
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
            sortCriteria={sortingProps.sortCriteria}
            sortDirection={sortingProps.sortDirection}
            onSortChange={sortingProps.handleSortChange}
            onToggleDirection={sortingProps.toggleSortDirection}
          />
        ),
        value: sortingProps.sortCriteria,
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
      sortingProps.handleSortChange,
      sortingProps.sortCriteria,
      sortingProps.sortDirection,
      sortingProps.toggleSortDirection,
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

FilterBar.propTypes = {
  invoices: PropTypes.array.isRequired,
  datesSelected: PropTypes.object.isRequired,
  setDatesSelected: PropTypes.func.isRequired,
  processedInvoices: PropTypes.array.isRequired,
  setProcessedInvoices: PropTypes.func.isRequired,
  filters: PropTypes.object.isRequired,
  onFiltersChange: PropTypes.func.isRequired,
};
