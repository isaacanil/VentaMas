import type { ReactNode } from 'react';
import React from 'react';

import {
  FILTER_CONFIG,
  ACCESSIBILITY_CONFIG,
} from '@/modules/invoice/pages/InvoicesPage/components/FilterBar/constants';

import { FilterField } from './FilterField';
import { FilterSelectControl } from './FilterSelectControl';

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
    <FilterSelectControl
      value={value || ''}
      onChange={onChange}
      placeholder="Todos"
      options={clientOptions}
      width={FILTER_CONFIG.client.width}
      isDisabled={loading}
      ariaLabel={ACCESSIBILITY_CONFIG.ariaLabels.clientSelect}
    />
  </FilterField>
);
