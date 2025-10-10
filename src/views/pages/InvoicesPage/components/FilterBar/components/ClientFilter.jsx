import { Select } from 'antd';
import React from 'react';

import { FILTER_CONFIG, ACCESSIBILITY_CONFIG } from '../constants';

import { FilterField } from './FilterField';


const { Option } = Select;

export const ClientFilter = ({ value, onChange, clientOptions, loading }) => (
  <FilterField label={FILTER_CONFIG.client.label}>
    <Select
      value={value || ''}
      onChange={onChange}
      placeholder="Todos"
      allowClear
      showSearch
      optionFilterProp="children"
      loading={loading}
      style={{ width: FILTER_CONFIG.client.width }}
      size="middle"
      aria-label={ACCESSIBILITY_CONFIG.ariaLabels.clientSelect}
      filterOption={(input, option) => 
        option?.searchtext?.includes(input.toLowerCase()) ?? false
      }
    >
      {clientOptions.map((option) => (
        <Option 
          key={option.value} 
          value={option.value}
          searchtext={option.searchText}
        >
          {option.label}
        </Option>
      ))}
    </Select>
  </FilterField>
); 