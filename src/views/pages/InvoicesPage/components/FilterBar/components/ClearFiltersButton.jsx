import React from 'react';
import { Button } from 'antd';
import { ClearOutlined } from '@ant-design/icons';
import { FilterField } from './FilterField';

export const ClearFiltersButton = ({ onClear, hasActiveFilters }) => {
  if (!hasActiveFilters) return null;
  
  return (
    <FilterField label=" ">
      <Button
        icon={<ClearOutlined />}
        onClick={onClear}
        size="middle"
        type="text"
      >
        Limpiar
      </Button>
    </FilterField>
  );
}; 