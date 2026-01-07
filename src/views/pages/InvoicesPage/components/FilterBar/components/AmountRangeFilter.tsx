// @ts-nocheck
import { InputNumber, Space } from 'antd';
import React from 'react';

import { FILTER_CONFIG, ACCESSIBILITY_CONFIG } from '@/views/pages/InvoicesPage/components/FilterBar/constants';

import { FilterField } from './FilterField';

export const AmountRangeFilter = ({
  minAmount,
  maxAmount,
  onMinChange,
  onMaxChange,
  label,
}) => {
  const numberInputProps = {
    size: 'middle',
    min: 0,
    formatter: (value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ','),
    parser: (value) => value.replace(/\$\s?|(,*)/g, ''),
    style: { width: 90 },
  };

  return (
    <FilterField label={label ?? FILTER_CONFIG.amount.label}>
      <Space.Compact>
        <InputNumber
          {...numberInputProps}
          value={minAmount}
          onChange={onMinChange}
          placeholder="Mín"
          aria-label={ACCESSIBILITY_CONFIG.ariaLabels.minAmount}
        />
        <InputNumber
          {...numberInputProps}
          value={maxAmount}
          onChange={onMaxChange}
          placeholder="Máx"
          aria-label={ACCESSIBILITY_CONFIG.ariaLabels.maxAmount}
        />
      </Space.Compact>
    </FilterField>
  );
};
