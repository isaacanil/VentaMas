import { SearchOutlined } from '@/constants/icons/antd';
import { Input, Select } from 'antd';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import type { PreorderClientOption } from '../../types';

const FiltersWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const StyledInput = styled(Input)`
  width: 320px;
  min-width: 240px;
`;

const StyledSelect = styled(Select)`
  width: 260px;
  min-width: 200px;
`;

type SearchBarProps = {
  searchTerm: string;
  onSearch: (term: string) => void;
  clients?: PreorderClientOption[];
  selectedClient?: string;
  onClientChange?: (clientId?: string | null) => void;
};

export const SearchBar = ({
  searchTerm,
  onSearch,
  clients = [],
  selectedClient,
  onClientChange,
}: SearchBarProps) => {
  const enhancedOptions = useMemo(() => {
    const baseOptions = clients.map((client) => ({
      value: client.value,
      label: client.label,
    }));
    return [{ value: 'all', label: 'Todos los clientes' }, ...baseOptions];
  }, [clients]);

  return (
    <FiltersWrapper>
      <StyledInput
        allowClear
        value={searchTerm}
        onChange={(event) => onSearch(event.target.value)}
        placeholder="Buscar preventa..."
        prefix={<SearchOutlined />}
      />
      <StyledSelect
        showSearch
        value={selectedClient}
        onChange={(value) => onClientChange?.(value)}
        options={enhancedOptions}
        placeholder="Filtrar por cliente"
        optionFilterProp="label"
        allowClear={false}
      />
    </FiltersWrapper>
  );
};

export default SearchBar;
