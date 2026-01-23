import styled from 'styled-components';
import type { Dispatch, SetStateAction } from 'react';

import { icons } from '@/constants/icons/icons';
import { Button } from '@/components/ui/Button/Button';
import type {
  FilterConfig,
  FilterState,
  FilterValue,
} from '@/components/ui/AdvancedTable/types/ColumnTypes';

import { Item } from './Item';

type FilterChangeEvent = { target: { value: FilterValue } };

interface FilterUIProps {
  filterConfig?: FilterConfig[];
  setFilter: Dispatch<SetStateAction<FilterState>>;
  filter: FilterState;
  defaultFilter: FilterState;
  setDefaultFilter: () => void;
}

export const FilterUI = ({
  filterConfig = [],
  setFilter,
  filter,
  defaultFilter,
  setDefaultFilter,
}: FilterUIProps) => {
  const clearFilter = (accessor: string) => {
    const newFilter = { ...filter };
    if (newFilter[accessor] && defaultFilter[accessor]) {
      delete newFilter[accessor];
      newFilter[accessor] = defaultFilter[accessor];
    }
    if (newFilter[accessor] && !defaultFilter[accessor]) {
      delete newFilter[accessor];
    }
    setFilter(newFilter);
  };

  const isDefaultFilter = () => {
    return Object.keys(filter).every(
      (key) => filter[key] === defaultFilter[key],
    );
  };

  return (
    <Container>
      <FilterLabel>
        <span>{icons.operationModes.filter}</span>
        <div>Filtrar por:</div>
      </FilterLabel>
      <Filters>
        {filterConfig.length > 0 &&
          filterConfig.map((filterItem, index) => (
            <Item
              key={index}
              label={filterItem.label}
              filterOptions={filterItem.options}
              format={filterItem.format}
              onChange={(event: FilterChangeEvent) =>
                setFilter({
                  ...filter,
                  [filterItem.accessor]: event.target.value,
                })
              }
              onClear={() => clearFilter(filterItem.accessor)}
              selectedValue={filter[filterItem.accessor]}
            />
          ))}
      </Filters>
      <Button
        onClick={setDefaultFilter}
        disabled={isDefaultFilter()}
        endIcon={icons.operationModes.cancel}
        title="Limpiar Filtros"
      />
    </Container>
  );
};

const FilterLabel = styled.div`
  display: flex;
  gap: 0.5em;

  span > svg {
    font-size: 1.2em;
    color: #696969cc;
  }

  div {
    @media (width <= 1000px) {
      display: none;
    }
  }
`;
const Filters = styled.div`
  display: flex;
  gap: 0.6em;
  align-items: center;
`;
const Container = styled.div`
  display: flex;
  gap: 2em;
  align-items: center;
  height: 2.5em;
  padding: 0 1em;
`;
