import { Select, Button, Space } from 'antd';
import React from 'react';

import { icons } from '../../../../../../constants/icons/icons';
import { FILTER_CONFIG, ACCESSIBILITY_CONFIG } from '../constants';

import { FilterField } from './FilterField';

export const SortControls = ({
  sortCriteria,
  sortDirection,
  onSortChange,
  onToggleDirection,
}) => (
  <FilterField label={FILTER_CONFIG.sort.label}>
    <Space.Compact>
      <Select
        value={sortCriteria}
        style={{ width: 130 }}
        onChange={onSortChange}
        options={FILTER_CONFIG.sort.options}
        size="middle"
        aria-label={ACCESSIBILITY_CONFIG.ariaLabels.sortCriteria}
      />
      <Button
        icon={
          sortDirection === 'asc' ? icons.sort.sortAsc : icons.sort.sortDesc
        }
        onClick={onToggleDirection}
        disabled={sortCriteria === 'defaultCriteria'}
        size="middle"
        aria-label={ACCESSIBILITY_CONFIG.ariaLabels.sortDirection}
      />
    </Space.Compact>
  </FilterField>
);
