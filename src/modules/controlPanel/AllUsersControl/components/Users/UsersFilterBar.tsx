import { Input, Select, Space } from 'antd';
import { useMemo } from 'react';

import type { ChangeEvent, FC, ReactNode } from 'react';

export interface UsersFilterBarFilters {
  search: string;
  businessID: string;
  role: string;
}

export interface BusinessOption {
  value: string;
  id?: string;
  name?: string;
  label?: ReactNode;
  searchText?: string;
}

export interface RoleOption {
  value: string;
  label?: ReactNode;
  searchText?: string;
}

type RoleOptionInput = RoleOption | string;

interface UsersFilterBarProps {
  filters: UsersFilterBarFilters;
  onFilterChange: (key: keyof UsersFilterBarFilters, value: string) => void;
  businessOptions: BusinessOption[];
  roleOptions: RoleOptionInput[];
}

interface SearchableOption {
  value: string;
  label?: ReactNode;
  name?: ReactNode;
  searchText?: string;
}

const optionContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  lineHeight: 1.2,
};

const optionPrimaryStyle = {
  fontWeight: 500,
};

const optionSecondaryStyle = {
  fontSize: 12,
  color: '#6b7280',
};

export const UsersFilterBar: FC<UsersFilterBarProps> = ({
  filters,
  onFilterChange,
  businessOptions,
  roleOptions,
}) => {
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    onFilterChange('search', event.target.value ?? '');
  };

  const handleBusinessChange = (value: string | undefined) => {
    onFilterChange('businessID', value ?? '');
  };

  const handleRoleChange = (value: string | undefined) => {
    onFilterChange('role', value ?? '');
  };

  const businessSelectOptions = useMemo<SearchableOption[]>(
    () =>
      businessOptions.map((option) => {
        const name = option.name ?? option.label ?? option.value;
        const id = option.id ?? option.value;
        const searchText =
          option.searchText ?? `${name ?? ''} ${id ?? ''}`.toLowerCase();

        return {
          value: option.value,
          label: (
            <div style={optionContainerStyle}>
              <span style={optionPrimaryStyle}>{name}</span>
              <span style={optionSecondaryStyle}>ID: {id}</span>
            </div>
          ),
          name,
          searchText,
        };
      }),
    [businessOptions],
  );

  const roleSelectOptions = useMemo<SearchableOption[]>(
    () =>
      roleOptions.map((option) => {
        const normalized =
          typeof option === 'string' ? { value: option } : option;
        const value = normalized.value;
        const label = normalized.label ?? value;
        const searchText = normalized.searchText ?? String(label).toLowerCase();

        return {
          value,
          label,
          searchText,
        };
      }),
    [roleOptions],
  );

  return (
    <div style={{ margin: '16px 0', padding: '0 16px' }}>
      <Space size="middle" wrap>
        <Input
          placeholder="Buscar por nombre, ID, negocio o rol"
          value={filters.search}
          onChange={handleSearchChange}
          allowClear
        />
        <Select
          placeholder="Filtrar por negocio"
          value={filters.businessID || undefined}
          onChange={handleBusinessChange}
          allowClear
          style={{ minWidth: 240 }}
          options={businessSelectOptions}
          showSearch
          optionLabelProp="name"
          filterOption={(input, option) =>
            (
              (option as SearchableOption | undefined)?.searchText ?? ''
            ).includes(input.trim().toLowerCase())
          }
        />
        <Select
          placeholder="Filtrar por rol"
          value={filters.role || undefined}
          onChange={handleRoleChange}
          allowClear
          style={{ minWidth: 180 }}
          options={roleSelectOptions}
          showSearch
          optionFilterProp="label"
          filterOption={(input, option) =>
            (
              (option as SearchableOption | undefined)?.searchText ?? ''
            ).includes(input.trim().toLowerCase())
          }
        />
      </Space>
    </div>
  );
};
