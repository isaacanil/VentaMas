import { InputNumber, Space } from 'antd';
import type { InputNumberProps } from 'antd';
import type { ReactNode } from 'react';
import React from 'react';

import { FILTER_CONFIG, ACCESSIBILITY_CONFIG } from '@/modules/invoice/pages/InvoicesPage/components/FilterBar/constants';

import { FilterField } from './FilterField';

type AmountRangeFilterProps = {
  minAmount?: number | null;
  maxAmount?: number | null;
  onMinChange: (value: number | null) => void;
  onMaxChange: (value: number | null) => void;
  label?: ReactNode;
};

export const AmountRangeFilter = ({
  minAmount,
  maxAmount,
  onMinChange,
  onMaxChange,
  label,
}: AmountRangeFilterProps) => {
  const numberInputProps: InputNumberProps<number> = {
    size: 'middle',
    min: 0,
    formatter: (value) =>
      `${value ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, ','),
    parser: (value) => (value ? Number(value.replace(/\$\s?|(,*)/g, '')) : 0),
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
