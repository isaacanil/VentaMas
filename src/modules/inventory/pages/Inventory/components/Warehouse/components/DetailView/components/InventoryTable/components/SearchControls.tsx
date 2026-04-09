import {
  faArrowDownAZ,
  faBroom,
  faFilter,
  faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Form, Tooltip, Dropdown } from 'antd';
import React from 'react';

import {
  SearchContainer,
  SearchInput,
  StyledDatePicker,
  SortButton,
  AdvancedFilterButton,
  ClearButton,
} from '@/modules/inventory/pages/Inventory/components/Warehouse/components/DetailView/components/InventoryTable/styles';

import type {
  DateRangeValue,
  SortMenuItems,
} from '@/modules/inventory/pages/Inventory/components/Warehouse/components/DetailView/components/InventoryTable/types';
import type { DateTime } from 'luxon';

interface DateRangePreset {
  label: string;
  value: [DateTime, DateTime] | null;
}

interface SearchControlsProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  dateFilter: DateRangeValue;
  onDateRangeChange: (dates: DateRangeValue) => void;
  dateRangePresets: DateRangePreset[];
  sortMenuItems: SortMenuItems;
  onOpenAdvancedFilters: () => void;
  hasAdvancedFilters: boolean;
  onClearFilters: () => void;
}

export const SearchControls: React.FC<SearchControlsProps> = ({
  searchTerm,
  onSearchTermChange,
  dateFilter,
  onDateRangeChange,
  dateRangePresets,
  sortMenuItems,
  onOpenAdvancedFilters,
  hasAdvancedFilters,
  onClearFilters,
}) => (
  <SearchContainer layout="vertical">
    <Form.Item>
      <SearchInput
        prefix={<FontAwesomeIcon icon={faMagnifyingGlass} />}
        placeholder="Buscar por Producto"
        value={searchTerm}
        onChange={(event) => onSearchTermChange(event.target.value)}
        allowClear
      />
    </Form.Item>

    <Form.Item label="Fecha de Vencimiento:">
      <StyledDatePicker
        mode="range"
        onChange={(dates) => onDateRangeChange(dates as DateRangeValue)}
        placeholder="Seleccionar rango"
        value={dateFilter ?? undefined}
        format="DD/MM/YYYY"
        allowClear
        presets={dateRangePresets}
        className=""
        style={{}}
      />
    </Form.Item>

    <Form.Item>
      <Tooltip title="Ordenar">
        <Dropdown menu={{ items: sortMenuItems }} placement="bottomRight">
          <SortButton icon={<FontAwesomeIcon icon={faArrowDownAZ} />} />
        </Dropdown>
      </Tooltip>
    </Form.Item>

    <Form.Item>
      <Tooltip title="Filtros avanzados">
        <AdvancedFilterButton
          icon={<FontAwesomeIcon icon={faFilter} />}
          onClick={onOpenAdvancedFilters}
          type={hasAdvancedFilters ? 'primary' : 'default'}
        />
      </Tooltip>
    </Form.Item>

    <Form.Item>
      <Tooltip title="Limpiar filtros">
        <ClearButton
          icon={<FontAwesomeIcon icon={faBroom} />}
          onClick={onClearFilters}
        />
      </Tooltip>
    </Form.Item>
  </SearchContainer>
);
