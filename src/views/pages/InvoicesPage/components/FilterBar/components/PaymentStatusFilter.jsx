import { Select } from 'antd';
import React from 'react';

import { FILTER_CONFIG, ACCESSIBILITY_CONFIG } from '../constants';

import { FilterField } from './FilterField';

export const PaymentStatusFilter = ({ value, onChange, label }) => (
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
