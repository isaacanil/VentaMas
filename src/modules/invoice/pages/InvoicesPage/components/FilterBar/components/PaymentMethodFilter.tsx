import type { ReactNode } from 'react';
import React from 'react';

import {
  FILTER_CONFIG,
  ACCESSIBILITY_CONFIG,
} from '@/modules/invoice/pages/InvoicesPage/components/FilterBar/constants';

import { FilterField } from './FilterField';
import { FilterSelectControl } from './FilterSelectControl';

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
    <FilterSelectControl
      value={value || ''}
      onChange={onChange}
      placeholder="Todos"
      width={FILTER_CONFIG.paymentMethod.width}
      ariaLabel={ACCESSIBILITY_CONFIG.ariaLabels.paymentMethodSelect}
      options={FILTER_CONFIG.paymentMethod.options}
    />
  </FilterField>
);
