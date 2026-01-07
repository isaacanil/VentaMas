// @ts-nocheck
import { Select } from 'antd';
import React from 'react';

import { FILTER_CONFIG, ACCESSIBILITY_CONFIG } from '@/views/pages/InvoicesPage/components/FilterBar/constants';

import { FilterField } from './FilterField';

export const PaymentMethodFilter = ({ value, onChange, label }) => (
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
