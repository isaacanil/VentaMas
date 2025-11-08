import { faMagnifyingGlass, faArrowUpLong, faArrowDownLong } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Select } from 'antd';
import React, { useMemo } from 'react';
import styled from 'styled-components';

export const ProductFilterToolbar = ({
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Buscar',
  categoryFilter,
  onCategoryChange,
  categoryStats,
  sortField,
  sortOptions,
  onSortFieldChange,
  sortDirection,
  onToggleSortDirection,
}) => {
  const categoryOptions = useMemo(() => {
    const total = categoryStats?.total ?? 0;
    const entries = categoryStats?.entries ?? [];

    const buildLabel = (name, count) => (
      <CategoryOption>
        <CategoryOptionText title={name}>{name}</CategoryOptionText>
        <CategoryOptionBadge>{count}</CategoryOptionBadge>
      </CategoryOption>
    );

    return [
      { label: buildLabel('Todas las categorías', total), value: 'all' },
      ...entries.map(({ name, count }) => ({
        label: buildLabel(name, count),
        value: name,
      })),
    ];
  }, [categoryStats]);

  return (
    <Toolbar>
      <SearchGroup>
        <FieldLabel>Buscar</FieldLabel>
        <SearchBar>
          <SearchIcon icon={faMagnifyingGlass} />
          <SearchInput
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
          />
        </SearchBar>
      </SearchGroup>

      <CategoryGroup>
        <FieldLabel>Categoría</FieldLabel>
        <SortSelect
          value={categoryFilter}
          onChange={onCategoryChange}
          options={categoryOptions}
        />
      </CategoryGroup>

      <SortGroup>
        <FieldLabel>Ordenar por</FieldLabel>
        <SortSelectors>
          <SortSelect
            value={sortField}
            onChange={onSortFieldChange}
            options={sortOptions}
          />
          <DirectionToggle
            type="button"
            onClick={onToggleSortDirection}
            aria-label={`Cambiar a orden ${sortDirection === 'asc' ? 'descendente' : 'ascendente'}`}
          >
            <DirectionIcon icon={sortDirection === 'asc' ? faArrowUpLong : faArrowDownLong} />
          </DirectionToggle>
        </SortSelectors>
      </SortGroup>
    </Toolbar>
  );
};

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-start;
  padding: 8px 12px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.05);
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 0 1 260px;
  min-width: 200px;
  max-width: 320px;
`;

const SearchGroup = styled(FieldGroup)`
  flex: 0 1 200px;
  max-width: 260px;
`;

const CategoryGroup = styled(FieldGroup)`
  flex: 0 1 200px;
  max-width: 260px;
`;

const FieldLabel = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #4b5563;
`;

const SearchBar = styled.div`
  position: relative;
  width: 100%;
`;

const SearchIcon = styled(FontAwesomeIcon)`
  position: absolute;
  top: 50%;
  left: 14px;
  transform: translateY(-50%);
  color: #9ca3af;
  font-size: 16px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 12px 10px 38px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  font-size: 14px;
  color: #111827;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    background: #ffffff;
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const SortGroup = styled(FieldGroup)`
  flex: 1 1 260px;
  min-width: 240px;
  max-width: 380px;
`;

const SortSelectors = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: nowrap;
  align-items: center;
`;

const SortSelect = styled(Select)`
  min-width: 180px;
  height: 2.8em;

  && .ant-select-selector {
    border-radius: 10px;
    border: 1px solid #e5e7eb;
    background: #f9fafb;
    padding: 6px 12px;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  &&:hover .ant-select-selector {
    border-color: #2563eb;
  }

  &&.ant-select-focused .ant-select-selector {
    border-color: #2563eb !important;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    background: #ffffff;
  }

  && .ant-select-selection-item {
    font-size: 14px;
    color: #111827;
    font-weight: 500;
  }

  && .ant-select-selection-placeholder {
    font-size: 14px;
    color: #9ca3af;
  }
`;

const DirectionToggle = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  padding: 0;

  &:hover {
    background: #eef2ff;
  }

  &:focus-visible {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    background: #ffffff;
  }
`;

const DirectionIcon = styled(FontAwesomeIcon)`
  font-size: 16px;
  color: #2563eb;
`;

const CategoryOption = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
`;

const CategoryOptionText = styled.span`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #111827;
`;

const CategoryOptionBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 30px;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: #e0f2fe;
  color: #0369a1;
`;
