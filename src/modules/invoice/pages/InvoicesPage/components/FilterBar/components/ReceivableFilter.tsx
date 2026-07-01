import type { ReactNode } from 'react';
import React from 'react';
import styled from 'styled-components';

import { VmSwitch } from '@/components/heroui';
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
    <SwitchControlFrame>
      <VmSwitch
        isSelected={Boolean(value)}
        onChange={onChange}
        aria-label={ACCESSIBILITY_CONFIG.ariaLabels.receivablesOnly}
      />
    </SwitchControlFrame>
  </FilterField>
);

const SwitchControlFrame = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
`;
