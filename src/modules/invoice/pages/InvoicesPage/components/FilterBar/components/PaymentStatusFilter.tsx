import { Select } from 'antd';
import type { ReactNode } from 'react';
import React from 'react';

import {
  FILTER_CONFIG,
  ACCESSIBILITY_CONFIG,
} from '@/modules/invoice/pages/InvoicesPage/components/FilterBar/constants';
import type { PaymentStatusFilter as PaymentStatus } from '@/types/invoiceFilters';

import { FilterField } from './FilterField';

type PaymentStatusFilterProps = {
  value?: PaymentStatus;
  onChange: (value: PaymentStatus) => void;
  label?: ReactNode;
};

export const PaymentStatusFilter = ({
  value,
  onChange,
  label,
}: PaymentStatusFilterProps) => (
  <FilterField label={label ?? FILTER_CONFIG.paymentStatus.label}>
    <Select
      value={value ?? ''}
      onChange={(val) => onChange?.(val ?? '')}
      placeholder="Todos"
      allowClear
      style={{ width: FILTER_CONFIG.paymentStatus.width }}
      size="middle"
      aria-label={ACCESSIBILITY_CONFIG.ariaLabels.paymentStatusSelect}
      options={FILTER_CONFIG.paymentStatus.options}
    />
  </FilterField>
);
