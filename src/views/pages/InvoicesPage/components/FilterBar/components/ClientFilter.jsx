import { AutoComplete } from 'antd';
import React from 'react';

import { FILTER_CONFIG, ACCESSIBILITY_CONFIG } from '../constants';

import { FilterField } from './FilterField';

export const ClientFilter = ({
  value,
  onChange,
  clientOptions,
  loading,
  label,
}) => (
  <FilterField label={label ?? FILTER_CONFIG.client.label}>
    <AutoComplete
      value={value || ''}
      onChange={onChange}
      placeholder="Todos"
      allowClear
      loading={loading}
      options={clientOptions}
      style={{ width: FILTER_CONFIG.client.width }}
      popupMatchSelectWidth={false}
      size="middle"
      aria-label={ACCESSIBILITY_CONFIG.ariaLabels.clientSelect}
      filterOption={(inputValue, option) =>
        option?.searchText?.includes?.(inputValue?.toLowerCase?.() ?? '') ??
        false
      }
    />
  </FilterField>
);
