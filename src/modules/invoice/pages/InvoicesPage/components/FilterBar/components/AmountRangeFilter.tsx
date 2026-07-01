import type { ReactNode } from 'react';
import React from 'react';
import styled from 'styled-components';

import { VmNumberField } from '@/components/heroui';
import {
  FILTER_CONFIG,
  ACCESSIBILITY_CONFIG,
} from '@/modules/invoice/pages/InvoicesPage/components/FilterBar/constants';

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
  const handleNumberChange = (
    nextValue: number | null | undefined,
    callback: (value: number | null) => void,
  ) => {
    callback(
      typeof nextValue === 'number' && Number.isFinite(nextValue)
        ? nextValue
        : null,
    );
  };

  return (
    <FilterField label={label ?? FILTER_CONFIG.amount.label}>
      <AmountRangeGroup>
        <AmountNumberField
          fullWidth
          minValue={0}
          step={0.01}
          value={minAmount ?? undefined}
          onChange={(nextValue) => handleNumberChange(nextValue, onMinChange)}
          aria-label={ACCESSIBILITY_CONFIG.ariaLabels.minAmount}
        >
          <VmNumberField.Group>
            <VmNumberField.Input placeholder="Mín" />
          </VmNumberField.Group>
        </AmountNumberField>
        <AmountNumberField
          fullWidth
          minValue={0}
          step={0.01}
          value={maxAmount ?? undefined}
          onChange={(nextValue) => handleNumberChange(nextValue, onMaxChange)}
          aria-label={ACCESSIBILITY_CONFIG.ariaLabels.maxAmount}
        >
          <VmNumberField.Group>
            <VmNumberField.Input placeholder="Máx" />
          </VmNumberField.Group>
        </AmountNumberField>
      </AmountRangeGroup>
    </FilterField>
  );
};

const AmountRangeGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(
    2,
    minmax(0, ${FILTER_CONFIG.amount.inputWidth}px)
  );
  gap: 0;
  max-width: 100%;

  @media (max-width: 900px) {
    width: 100%;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const AmountNumberField = styled(VmNumberField)`
  min-width: 0;

  [data-slot='number-field-group'] {
    border-radius: 0;
  }

  &:first-child [data-slot='number-field-group'] {
    border-radius: 6px 0 0 6px;
  }

  &:last-child [data-slot='number-field-group'] {
    border-left-width: 0;
    border-radius: 0 6px 6px 0;
  }
`;
