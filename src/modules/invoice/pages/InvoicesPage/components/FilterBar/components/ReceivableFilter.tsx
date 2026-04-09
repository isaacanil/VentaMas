import { Switch } from 'antd';
import type { ReactNode } from 'react';
import React from 'react';

import {
  FILTER_CONFIG,
  ACCESSIBILITY_CONFIG,
} from '@/modules/invoice/pages/InvoicesPage/components/FilterBar/constants';

import { FilterField } from './FilterField';

type ReceivableFilterProps = {
  value?: boolean | null;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
};

export const ReceivableFilter = ({
  value,
  onChange,
  label,
}: ReceivableFilterProps) => (
  <FilterField label={label ?? FILTER_CONFIG.receivable.label}>
    <Switch
      checked={Boolean(value)}
      onChange={onChange}
      aria-label={ACCESSIBILITY_CONFIG.ariaLabels.receivablesOnly}
    />
  </FilterField>
);
