import { ClearOutlined } from '@/constants/icons/antd';
import { Select, Button } from 'antd';
import React, { useMemo } from 'react';

import { DatePicker } from '@/components/common/DatePicker/DatePicker';
import {
  CREDIT_NOTE_STATUS,
  CREDIT_NOTE_STATUS_LABEL,
} from '@/constants/creditNoteStatus';

import { buildCreditNoteFilterPresets } from './creditNoteFilterPresets';
import {
  Container,
  FilterGroup,
  FilterLabel,
  FiltersRow,
  MobileFilterGroup,
  MobileFilterLabel,
  MobileFiltersContainer,
} from './styles';

import type { CreditNoteFiltersContentProps } from './types';

const { Option } = Select;

const filterSelectOption = (
  input: string,
  option?: { children?: React.ReactNode },
) =>
  String(option?.children ?? '')
    .toLowerCase()
    .includes(input.toLowerCase());

export const CreditNoteFiltersContent = ({
  isMobile,
  clientsLoading,
  clients,
  filters,
  dateRange,
  onDateRangeChange,
  onClientChange,
  onStatusChange,
  onClearFilters,
}: CreditNoteFiltersContentProps) => {
  const presets = useMemo(() => buildCreditNoteFilterPresets(), []);

  const datePicker = (
    <DatePicker
      mode="range"
      value={dateRange}
      onChange={onDateRangeChange}
      format="DD/MM/YYYY"
      placeholder="Seleccionar fechas"
      allowClear
      presets={presets}
    />
  );

  const clientSelect = (
    <Select
      value={filters.clientId || ''}
      onChange={onClientChange}
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
      onChange={onStatusChange}
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
      {Object.entries(CREDIT_NOTE_STATUS).map(([, value]) => (
        <Option key={value} value={value}>
          {CREDIT_NOTE_STATUS_LABEL[value]}
        </Option>
      ))}
    </Select>
  );

  const clearButton = (
    <Button
      icon={<ClearOutlined />}
      onClick={onClearFilters}
      title="Limpiar filtros"
      style={isMobile ? { width: '100%' } : undefined}
    >
      {isMobile ? 'Limpiar filtros' : 'Limpiar'}
    </Button>
  );

  if (isMobile) {
    return (
      <Container>
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
      </Container>
    );
  }

  return (
    <Container>
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
    </Container>
  );
};
