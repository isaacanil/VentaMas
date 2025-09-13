import React from 'react';
import { Select } from 'antd';
import { FilterField } from './FilterField';
import { FILTER_CONFIG, ACCESSIBILITY_CONFIG } from '../constants';

export const PaymentMethodFilter = ({ value, onChange }) => (
  <FilterField label={FILTER_CONFIG.paymentMethod.label}>
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