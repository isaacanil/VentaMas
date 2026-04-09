import { Select } from 'antd';
import type { ReactNode } from 'react';
import React from 'react';

import {
  FILTER_CONFIG,
  ACCESSIBILITY_CONFIG,
} from '@/modules/invoice/pages/InvoicesPage/components/FilterBar/constants';

import { FilterField } from './FilterField';

type PaymentMethodFilterProps = {
  value?: string | null;
  onChange: (value: string) => void;
  label?: ReactNode;
};

export const PaymentMethodFilter = ({
  value,
  onChange,
  label,
}: PaymentMethodFilterProps) => (
  <FilterField label={label ?? FILTER_CONFIG.paymentMethod.label}>
    <Select
      value={value || ''}
      onChange={onChange}
      placeholder="Todos"
      allowClear
      style={{ width: FILTER_CONFIG.paymentMethod.width }}
      size="middle"
      aria-label={ACCESSIBILITY_CONFIG.ariaLabels.paymentMethodSelect}
      options={FILTER_CONFIG.paymentMethod.options}
    />
  </FilterField>
);
