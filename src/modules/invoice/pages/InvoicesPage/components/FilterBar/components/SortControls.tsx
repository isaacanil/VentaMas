import type { ReactNode } from 'react';
import React from 'react';
import styled from 'styled-components';

import { VmButton } from '@/components/heroui';
import { icons } from '@/constants/icons/icons';
import {
  FILTER_CONFIG,
  ACCESSIBILITY_CONFIG,
} from '@/modules/invoice/pages/InvoicesPage/components/FilterBar/constants';
import type { SortDirection } from '../hooks';

import { FilterField } from './FilterField';
import { FilterSelectControl } from './FilterSelectControl';

type SortControlsProps = {
  sortCriteria: string;
  sortDirection: SortDirection;
  onSortChange: (value: string) => void;
  onToggleDirection: () => void;
  label?: ReactNode;
};

export const SortControls = ({
  sortCriteria,
  sortDirection,
  onSortChange,
  onToggleDirection,
  label,
}: SortControlsProps) => (
  <FilterField label={label ?? FILTER_CONFIG.sort.label}>
    <SortControlGroup role="group" aria-label="Ordenar facturas">
      <FilterSelectControl
        value={sortCriteria}
        onChange={onSortChange}
        width={FILTER_CONFIG.sort.width}
        ariaLabel={ACCESSIBILITY_CONFIG.ariaLabels.sortCriteria}
        options={FILTER_CONFIG.sort.options}
      />
      <VmButton
        isIconOnly
        size="sm"
        variant="secondary"
        onPress={onToggleDirection}
        isDisabled={sortCriteria === 'defaultCriteria'}
        aria-label={ACCESSIBILITY_CONFIG.ariaLabels.sortDirection}
      >
        {sortDirection === 'asc' ? icons.sort.sortAsc : icons.sort.sortDesc}
      </VmButton>
    </SortControlGroup>
  </FilterField>
);

const SortControlGroup = styled.div`
  display: inline-flex;
  align-items: flex-end;
  gap: 8px;
  min-width: 0;

  @media (max-width: 900px) {
    width: 100%;

    [data-filter-select-control] {
      flex: 1 1 auto;
    }
  }
`;
