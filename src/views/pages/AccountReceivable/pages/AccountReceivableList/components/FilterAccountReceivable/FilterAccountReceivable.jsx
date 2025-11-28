import { Button, Select, Space } from 'antd';
import PropTypes from 'prop-types';
import React, { useCallback, useMemo, useRef } from 'react';
import styled from 'styled-components';

import { FilterBar as CommonFilterBar } from '../../../../../../../components/common/FilterBar';
import { icons } from '../../../../../../../constants/icons/icons';
import useBusiness from '../../../../../../../hooks/useBusiness';

const DEFAULT_CLIENT_TYPE = 'normal';
const DEFAULT_STATUS = 'active';
const DEFAULT_PAYMENT_STATUS = 'all';

const SORT_OPTIONS = [
  { value: 'defaultCriteria', label: 'Por defecto' },
  { value: 'date', label: 'Fecha' },
  { value: 'invoiceNumber', label: 'No. Factura' },
  { value: 'client', label: 'Cliente' },
  { value: 'balance', label: 'Balance' },
  { value: 'initialAmount', label: 'Monto inicial' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Activas' },
  { value: 'inactive', label: 'Inactivas' },
  { value: 'all', label: 'Todas' },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'paid', label: 'Pagadas' },
  { value: 'unpaid', label: 'No Pagadas' },
  { value: 'partial', label: 'Parcial' },
];

const CLIENT_TYPE_OPTIONS = [
  { value: DEFAULT_CLIENT_TYPE, label: 'Clientes' },
  { value: 'insurance', label: 'Aseguradoras' },
];

const normalizeDateRange = (range) => {
  if (!range) return { startDate: null, endDate: null };
  if (Array.isArray(range)) {
    const [start, end] = range;
    return { startDate: start ?? null, endDate: end ?? null };
  }
  return {
    startDate: range.startDate ?? null,
    endDate: range.endDate ?? null,
  };
};

const isSameRange = (a, b) => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.startDate === b.startDate && a.endDate === b.endDate;
};

export const FilterAccountReceivable = ({
  datesSelected,
  setDatesSelected,
  clientType = DEFAULT_CLIENT_TYPE,
  onClientTypeChange,
  statusFilter = DEFAULT_STATUS,
  onStatusFilterChange,
  sortCriteria,
  sortDirection,
  onSortChange,
  onToggleSortDirection,
  totalCount = 0,
  selectedClient = 'all',
  onClientChange,
  clientOptions = [],
  paymentStatusFilter = DEFAULT_PAYMENT_STATUS,
  onPaymentStatusChange,
}) => {
  const { isPharmacy } = useBusiness();
  const initialDateRange = useRef(
    datesSelected ?? { startDate: null, endDate: null },
  ).current;

  const handleDateRangeChange = useCallback(
    (range) => {
      setDatesSelected(normalizeDateRange(range));
    },
    [setDatesSelected],
  );

  const handleStatusChange = useCallback(
    (value) => {
      onStatusFilterChange(value || DEFAULT_STATUS);
    },
    [onStatusFilterChange],
  );

  const handleClientTypeChange = useCallback(
    (value) => {
      onClientTypeChange(value || DEFAULT_CLIENT_TYPE);
    },
    [onClientTypeChange],
  );

  const handleClientChange = useCallback(
    (value) => {
      onClientChange(value || 'all');
    },
    [onClientChange],
  );

  const handlePaymentStatusChange = useCallback(
    (value) => {
      onPaymentStatusChange(value || DEFAULT_PAYMENT_STATUS);
    },
    [onPaymentStatusChange],
  );

  const handleSortChange = useCallback(
    (value) => {
      onSortChange(value);
    },
    [onSortChange],
  );

  const hasActiveFilters = useMemo(() => {
    const dateChanged = !isSameRange(datesSelected, initialDateRange);
    const statusChanged = statusFilter !== DEFAULT_STATUS;
    const clientTypeChanged =
      isPharmacy && clientType !== DEFAULT_CLIENT_TYPE;
    const clientChanged = selectedClient !== 'all';
    const paymentStatusChanged = paymentStatusFilter !== DEFAULT_PAYMENT_STATUS;
    return (
      dateChanged ||
      statusChanged ||
      clientTypeChanged ||
      clientChanged ||
      paymentStatusChanged
    );
  }, [
    clientType,
    datesSelected,
    initialDateRange,
    isPharmacy,
    statusFilter,
    selectedClient,
    paymentStatusFilter,
  ]);

  const handleClearFilters = useCallback(() => {
    setDatesSelected(initialDateRange);
    onStatusFilterChange(DEFAULT_STATUS);
    onClientTypeChange(DEFAULT_CLIENT_TYPE);
    onClientChange('all');
    onPaymentStatusChange(DEFAULT_PAYMENT_STATUS);
  }, [
    initialDateRange,
    onClientTypeChange,
    onStatusFilterChange,
    onClientChange,
    onPaymentStatusChange,
    setDatesSelected,
  ]);

  const sortOptions = useMemo(() => {
    if (!isPharmacy) return SORT_OPTIONS;
    return [
      ...SORT_OPTIONS.slice(0, 4),
      { value: 'insurance', label: 'Aseguradora' },
      ...SORT_OPTIONS.slice(4),
    ];
  }, [isPharmacy]);

  const items = useMemo(
    () =>
      [
        {
          key: 'date',
          label: 'Fechas',
          type: 'dateRange',
          value: datesSelected,
          onChange: handleDateRangeChange,
          isActive: (value) => !isSameRange(value, initialDateRange),
        },
        isPharmacy
          ? {
            key: 'clientType',
            label: 'Tipo',
            type: 'select',
            value: clientType,
            onChange: handleClientTypeChange,
            options: CLIENT_TYPE_OPTIONS,
            allowClear: false,
            controlStyle: { width: '100%' },
            minWidth: 150,
          }
          : null,
        {
          key: 'client',
          label: 'Cliente',
          type: 'select',
          value: selectedClient,
          onChange: handleClientChange,
          options: [{ value: 'all', label: 'Todos' }, ...clientOptions],
          allowClear: false,
          controlStyle: { width: 200 },
          showSearch: true,
          filterOption: (input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase()),
        },
        {
          key: 'paymentStatus',
          label: 'Pago',
          type: 'select',
          value: paymentStatusFilter,
          onChange: handlePaymentStatusChange,
          options: PAYMENT_STATUS_OPTIONS,
          allowClear: false,
          controlStyle: { width: 140 },
          minWidth: 140,
        },
        {
          key: 'status',
          label: 'Estado',
          type: 'select',
          value: statusFilter,
          onChange: handleStatusChange,
          options: STATUS_OPTIONS,
          allowClear: false,
          controlStyle: { width: '100%' },
          minWidth: 150,
        },
        {
          key: 'sort',
          label: 'Ordenar',
          wrap: true,
          render: () => (
            <Space.Compact>
              <Select
                value={sortCriteria}
                style={{ width: 160 }}
                onChange={handleSortChange}
                options={sortOptions}
              />
              <Button
                icon={
                  sortDirection === 'asc'
                    ? icons.sort.sortAsc
                    : icons.sort.sortDesc
                }
                onClick={onToggleSortDirection}
                disabled={sortCriteria === 'defaultCriteria'}
              />
            </Space.Compact>
          ),
          value: { sortCriteria, sortDirection },
          isActive: (value) =>
            value?.sortCriteria && value.sortCriteria !== 'defaultCriteria',
          wrapperStyle: { marginLeft: 'auto' },
        },
      ].filter(Boolean),
    [
      clientType,
      datesSelected,
      handleClientTypeChange,
      handleDateRangeChange,
      handleSortChange,
      handleStatusChange,
      initialDateRange,
      isPharmacy,
      sortCriteria,
      sortDirection,
      sortOptions,
      statusFilter,
      onToggleSortDirection,
      selectedClient,
      handleClientChange,
      clientOptions,
      paymentStatusFilter,
      handlePaymentStatusChange,
    ],
  );

  const mobileTotals = useMemo(
    () => <TotalBadge>Total: {totalCount}</TotalBadge>,
    [totalCount],
  );

  return (
    <CommonFilterBar
      items={items}
      hasActiveFilters={hasActiveFilters}
      onClearFilters={hasActiveFilters ? handleClearFilters : null}
      mobileHeaderRight={mobileTotals}
      labels={{
        drawerTrigger: 'Filtros',
        drawerTitle: 'Filtros',
        modalTitle: 'Filtros adicionales',
        more: 'Más filtros',
        clear: 'Limpiar filtros',
      }}
    />
  );
};

FilterAccountReceivable.defaultProps = {
  datesSelected: { startDate: null, endDate: null },
  setDatesSelected: () => { },
  clientType: DEFAULT_CLIENT_TYPE,
  onClientTypeChange: () => { },
  statusFilter: DEFAULT_STATUS,
  onStatusFilterChange: () => { },
  sortCriteria: 'defaultCriteria',
  sortDirection: 'asc',
  onSortChange: () => { },
  onToggleSortDirection: () => { },
  totalCount: 0,
  selectedClient: 'all',
  onClientChange: () => { },
  clientOptions: [],
  paymentStatusFilter: DEFAULT_PAYMENT_STATUS,
  onPaymentStatusChange: () => { },
};

FilterAccountReceivable.propTypes = {
  datesSelected: PropTypes.shape({
    startDate: PropTypes.number,
    endDate: PropTypes.number,
  }),
  setDatesSelected: PropTypes.func,
  clientType: PropTypes.string,
  onClientTypeChange: PropTypes.func,
  statusFilter: PropTypes.string,
  onStatusFilterChange: PropTypes.func,
  sortCriteria: PropTypes.string,
  sortDirection: PropTypes.string,
  onSortChange: PropTypes.func,
  onToggleSortDirection: PropTypes.func,
  totalCount: PropTypes.number,
  selectedClient: PropTypes.string,
  onClientChange: PropTypes.func,
  clientOptions: PropTypes.array,
  paymentStatusFilter: PropTypes.string,
  onPaymentStatusChange: PropTypes.func,
};

const TotalBadge = styled.div`
  padding: 4px 10px;
  background-color: #f3f4f6;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #4b5563;
  white-space: nowrap;
  border: 1px solid #e5e7eb;
`;
