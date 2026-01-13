import { AutoComplete } from 'antd';
import type { ReactNode } from 'react';
import React from 'react';

import { FILTER_CONFIG, ACCESSIBILITY_CONFIG } from '@/modules/invoice/pages/InvoicesPage/components/FilterBar/constants';

import { FilterField } from './FilterField';

type ClientOption = {
  value: string;
  label: ReactNode;
  searchText?: string;
};

type ClientFilterProps = {
  value?: string | null;
  onChange: (value: string) => void;
  clientOptions: ClientOption[];
  loading?: boolean;
  label?: ReactNode;
};

export const ClientFilter = ({
  value,
  onChange,
  clientOptions,
  loading,
  label,
}: ClientFilterProps) => (
  <FilterField label={label ?? FILTER_CONFIG.client.label}>
    <AutoComplete
      value={value || ''}
      onChange={onChange}
      placeholder="Todos"
      allowClear
      options={clientOptions}
      style={{ width: FILTER_CONFIG.client.width }}
      popupMatchSelectWidth={false}
      size="middle"
      aria-label={ACCESSIBILITY_CONFIG.ariaLabels.clientSelect}
      filterOption={(inputValue, option) =>
        option?.searchText?.includes?.(inputValue?.toLowerCase?.() ?? '') ??
        false
      }
    />
  </FilterField>
);
