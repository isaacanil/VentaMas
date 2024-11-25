import styled from 'styled-components'
import { Item } from './Item'
import { Button } from '../../../Button/Button'
import { icons } from '../../../../../../constants/icons/icons'

export const FilterUI = ({ filterConfig = [], setFilter, filter, defaultFilter, setDefaultFilter }) => {

  const clearFilter = (accessor) => {
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
    return Object.keys(filter).every(key => filter[key] === defaultFilter[key]);
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
              onChange={(e) => setFilter({ ...filter, [filterItem.accessor]: e.target.value })}
              onClear={() => clearFilter(filterItem.accessor)}
              selectedValue={filter[filterItem.accessor]}
            />
          ))}
      </Filters>
      <Button
        onClick={setDefaultFilter}
        disabled={isDefaultFilter()}
        endIcon={icons.operationModes.cancel}
        title='Limpiar Filtros'
      />
    </Container>
  )
}

const FilterLabel = styled.div`
 display: flex;
 gap: 0.5em;
 span > svg{
        font-size: 1.2em;
        color: #696969cc;
 }
  div{
    @media (max-width: 1000px ){
      display: none;
    }
  } 
`
const Filters = styled.div`
  display: flex;
  gap: 0.6em;
  align-items: center;
`
const Container = styled.div`
  display: flex;
  align-items: center;
  padding: 0 1em;
  gap: 2em;
  height: 2.5em;
`