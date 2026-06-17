import { ClearOutlined, FilterOutlined } from '@/constants/icons/antd';
import { Button, Drawer, Select } from 'antd';
import { DateTime } from 'luxon';
import React, { useMemo, useState } from 'react';

import { DatePicker } from '@/components/common/DatePicker/DatePicker';
import type { DatePickerRangeValue } from '@/components/common/DatePicker/types';
import {
  DEBIT_NOTE_STATUS,
  DEBIT_NOTE_STATUS_LABEL,
} from '@/constants/debitNoteStatus';
import { useFbGetClientsOnOpen } from '@/firebase/client/useFbGetClientsOnOpen';
import { useMediaQuery } from '@/hooks/useMediaQuery';

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

import type { DebitNoteStatus } from '@/modules/invoice/types/debitNote';

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
  status?: DebitNoteStatus | string | null;
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
      status: null,
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
      value={filters.status || ''}
      onChange={(status?: DebitNoteStatus) =>
        onFiltersChange({ ...filters, status: status || null })
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
      {Object.entries(DEBIT_NOTE_STATUS).map(([, value]) => (
        <Option key={value} value={value}>
          {DEBIT_NOTE_STATUS_LABEL[value]}
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
