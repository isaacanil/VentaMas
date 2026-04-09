import { ClearOutlined } from '@/constants/icons/antd';
import { Button } from 'antd';
import type { ReactNode } from 'react';
import React from 'react';

import { FilterField } from './FilterField';

type ClearFiltersButtonProps = {
  onClear: () => void;
  hasActiveFilters: boolean;
  label?: ReactNode;
};

export const ClearFiltersButton = ({
  onClear,
  hasActiveFilters,
}: ClearFiltersButtonProps) => {
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
