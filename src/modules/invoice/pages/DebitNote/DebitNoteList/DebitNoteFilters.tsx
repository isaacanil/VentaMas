import { ClearOutlined, FilterOutlined } from '@/constants/icons/antd';
import { Button, Drawer, Select } from 'antd';
import { DateTime } from 'luxon';
import React, { useMemo, useState } from 'react';

import {
  DatePicker,
  type DatePickerRangeValue,
} from '@/components/common/DatePicker';
import { useFbGetClientsOnOpen } from '@/firebase/client/useFbGetClientsOnOpen';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import {
  DEBIT_NOTE_OPERATIONAL_FILTER_OPTIONS,
  type DebitNoteOperationalFilterStatus,
} from '@/modules/invoice/utils/adjustmentNoteStatusDisplay';
import {
  ELECTRONIC_TAX_RECEIPT_FILTER_OPTIONS,
  type ElectronicTaxReceiptFilterStatus,
} from '@/modules/invoice/utils/electronicTaxReceipt';

import {
  FilterGroup,
  FilterLabel,
  FiltersContainer,
  FiltersRow,
  MobileContainer,
  MobileFilterGroup,
  MobileFilterLabel,
  MobileFiltersContainer,
} from './styles';

const { Option } = Select;

type ClientOption = {
  id?: string;
  name?: string;
  rnc?: string;
};

export type DebitNoteFiltersState = {
  startDate: DateTime;
  endDate: DateTime;
  clientId?: string | number | null;
  operationalStatus?: DebitNoteOperationalFilterStatus | string | null;
  fiscalStatus?: ElectronicTaxReceiptFilterStatus | null;
};

const filterSelectOption = (
  input: string,
  option?: { children?: React.ReactNode },
) =>
  String(option?.children ?? '')
    .toLowerCase()
    .includes(input.toLowerCase());

export const DebitNoteFilters = ({
  filters,
  onFiltersChange,
}: {
  filters: DebitNoteFiltersState;
  onFiltersChange: (next: DebitNoteFiltersState) => void;
}) => {
  const { clients: fetchedClients, loading: clientsLoading } =
    useFbGetClientsOnOpen({
      isOpen: true,
    });
  const clients = fetchedClients.map((c) => c.client) as ClientOption[];
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [draftRange, setDraftRange] = useState<DateTime | null>(null);
  const presets = useMemo(
    () => [
      {
        label: 'Hoy',
        value: [DateTime.local().startOf('day'), DateTime.local().endOf('day')],
      },
      {
        label: 'Este mes',
        value: [
          DateTime.local().startOf('month'),
          DateTime.local().endOf('month'),
        ],
      },
    ],
    [],
  );

  const handleDateRangeChange = (dates: DatePickerRangeValue) => {
    if (!dates || !dates[0]) {
      setDraftRange(null);
      onFiltersChange({
        ...filters,
        startDate: DateTime.local().setLocale('es').startOf('day'),
        endDate: DateTime.local().setLocale('es').endOf('day'),
      });
      return;
    }

    if (dates[0] && !dates[1]) {
      setDraftRange(dates[0]);
      return;
    }

    setDraftRange(null);
    onFiltersChange({
      ...filters,
      startDate: dates[0].startOf('day'),
      endDate: dates[1].endOf('day'),
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      startDate: DateTime.local().setLocale('es').startOf('day'),
      endDate: DateTime.local().setLocale('es').endOf('day'),
      clientId: null,
      operationalStatus: null,
      fiscalStatus: null,
    });
  };

  const dateRange: DatePickerRangeValue | null = draftRange
    ? [draftRange, null]
    : filters.startDate
      ? [filters.startDate, filters.endDate]
      : null;

  const datePicker = (
    <DatePicker
      mode="range"
      value={dateRange}
      onChange={handleDateRangeChange}
      format="DD/MM/YYYY"
      placeholder="Seleccionar fechas"
      allowClear
      presets={presets}
    />
  );

  const clientSelect = (
    <Select
      value={filters.clientId || ''}
      onChange={(clientId?: string) =>
        onFiltersChange({ ...filters, clientId: clientId || null })
      }
      placeholder={isMobile ? 'Seleccionar cliente' : 'Todos'}
      allowClear
      showSearch
      optionFilterProp="children"
      loading={clientsLoading}
      style={
        isMobile
          ? { width: '100%' }
          : { width: '100%', minWidth: 150, maxWidth: 250 }
      }
      size="middle"
      filterOption={filterSelectOption}
    >
      <Option value="">{isMobile ? 'Todos los clientes' : 'Todos'}</Option>
      {clients.map((client) => (
        <Option key={client.id} value={client.id}>
          {client.name}
          {client.rnc && ` (${client.rnc})`}
        </Option>
      ))}
    </Select>
  );

  const statusSelect = (
    <Select
      value={filters.operationalStatus || ''}
      onChange={(operationalStatus?: DebitNoteOperationalFilterStatus) =>
        onFiltersChange({
          ...filters,
          operationalStatus: operationalStatus || null,
        })
      }
      placeholder={isMobile ? 'Todos los estados' : 'Todos'}
      allowClear
      style={
        isMobile
          ? { width: '100%' }
          : { width: '100%', minWidth: 120, maxWidth: 180 }
      }
      size="middle"
    >
      <Option value="">Todos</Option>
      {DEBIT_NOTE_OPERATIONAL_FILTER_OPTIONS.map((option) => (
        <Option key={option.value} value={option.value}>
          {option.label}
        </Option>
      ))}
    </Select>
  );

  const fiscalStatusSelect = (
    <Select
      value={filters.fiscalStatus || ''}
      onChange={(fiscalStatus?: ElectronicTaxReceiptFilterStatus) =>
        onFiltersChange({ ...filters, fiscalStatus: fiscalStatus || null })
      }
      placeholder={isMobile ? 'Todos los e-CF' : 'Todos'}
      allowClear
      style={
        isMobile
          ? { width: '100%' }
          : { width: '100%', minWidth: 140, maxWidth: 190 }
      }
      size="middle"
    >
      <Option value="">Todos</Option>
      {ELECTRONIC_TAX_RECEIPT_FILTER_OPTIONS.map((option) => (
        <Option key={option.value} value={option.value}>
          {option.label}
        </Option>
      ))}
    </Select>
  );

  const clearButton = (
    <Button
      icon={<ClearOutlined />}
      onClick={handleClearFilters}
      title="Limpiar filtros"
      style={isMobile ? { width: '100%' } : undefined}
    >
      {isMobile ? 'Limpiar filtros' : 'Limpiar'}
    </Button>
  );

  const content = isMobile ? (
    <FiltersContainer>
      <MobileFiltersContainer>
        <MobileFilterGroup>
          <MobileFilterLabel>Rango de fechas:</MobileFilterLabel>
          {datePicker}
        </MobileFilterGroup>
        <MobileFilterGroup>
          <MobileFilterLabel>Cliente:</MobileFilterLabel>
          {clientSelect}
        </MobileFilterGroup>
        <MobileFilterGroup>
          <MobileFilterLabel>Estado:</MobileFilterLabel>
          {statusSelect}
        </MobileFilterGroup>
        <MobileFilterGroup>
          <MobileFilterLabel>e-CF/DGII:</MobileFilterLabel>
          {fiscalStatusSelect}
        </MobileFilterGroup>
        <MobileFilterGroup>{clearButton}</MobileFilterGroup>
      </MobileFiltersContainer>
    </FiltersContainer>
  ) : (
    <FiltersContainer>
      <FiltersRow>
        <FilterGroup>
          <FilterLabel>Rango de fechas:</FilterLabel>
          {datePicker}
        </FilterGroup>
        <FilterGroup>
          <FilterLabel>Cliente:</FilterLabel>
          {clientSelect}
        </FilterGroup>
        <FilterGroup>
          <FilterLabel>Estado:</FilterLabel>
          {statusSelect}
        </FilterGroup>
        <FilterGroup>
          <FilterLabel>e-CF/DGII:</FilterLabel>
          {fiscalStatusSelect}
        </FilterGroup>
        <FilterGroup>{clearButton}</FilterGroup>
      </FiltersRow>
    </FiltersContainer>
  );

  if (!isMobile) return content;

  return (
    <MobileContainer>
      <Button icon={<FilterOutlined />} onClick={() => setDrawerVisible(true)}>
        Filtros
      </Button>
      <Drawer
        title="Filtros"
        placement="bottom"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        height="70%"
      >
        {content}
      </Drawer>
    </MobileContainer>
  );
};
