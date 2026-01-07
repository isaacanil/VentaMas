// @ts-nocheck
import { Switch } from 'antd';
import React from 'react';

import { FILTER_CONFIG, ACCESSIBILITY_CONFIG } from '@/views/pages/InvoicesPage/components/FilterBar/constants';

import { FilterField } from './FilterField';

export const ReceivableFilter = ({ value, onChange, label }) => (
  <FilterField label={label ?? FILTER_CONFIG.receivable.label}>
    <Switch
      checked={Boolean(value)}
      onChange={onChange}
      aria-label={ACCESSIBILITY_CONFIG.ariaLabels.receivablesOnly}
    />
  </FilterField>
);
