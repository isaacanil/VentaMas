import type { ReactNode } from 'react';
import React from 'react';

import {
  FILTER_CONFIG,
  ACCESSIBILITY_CONFIG,
} from '@/modules/invoice/pages/InvoicesPage/components/FilterBar/constants';
import type { PaymentStatusFilter as PaymentStatus } from '@/types/invoiceFilters';

import { FilterField } from './FilterField';
import { FilterSelectControl } from './FilterSelectControl';

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
    <FilterSelectControl
      value={value ?? ''}
      onChange={(val) => onChange?.((val ?? '') as PaymentStatus)}
      placeholder="Todos"
      width={FILTER_CONFIG.paymentStatus.width}
      ariaLabel={ACCESSIBILITY_CONFIG.ariaLabels.paymentStatusSelect}
      options={FILTER_CONFIG.paymentStatus.options}
    />
  </FilterField>
);
