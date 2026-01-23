import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { Fragment, useState } from 'react';
import styled from 'styled-components';

import { useSearchFilterOrderMenuOption } from '@/hooks/useSearchFilter';

import { Input } from './Input';
import { modifyOrderMenuData } from './modifyOrderMenuData';
import type { OrderMenuItem, OrderMenuOption } from './types';

interface ItemProps {
  data: OrderMenuItem;
  array: OrderMenuItem[];
  setArray: React.Dispatch<React.SetStateAction<OrderMenuItem[]>>;
  index: number;
}

interface BodyProps {
  $isOpen: boolean;
  $index: number;
}

interface FilterOptionProps {
  $isSelected: boolean;
}

export const Item = ({ data, array, setArray, index }: ItemProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const optionsFiltered = useSearchFilterOrderMenuOption(
    data.Items,
    searchTerm,
  ) as OrderMenuOption[];

  const [isItemOpen, setIsItemOpen] = useState(false);
  const handleOpenItem = () => setIsItemOpen(!isItemOpen);
  return (
    <Container>
      <Head onClick={handleOpenItem}>
        <FontAwesomeIcon icon={faChevronRight} /> <span>{data.name}</span>
      </Head>
      <Body $isOpen={Boolean(isItemOpen)} $index={index}>
        {
          <Fragment>
            <Input
              data={data}
              onChange={(event) => setSearchTerm(event.target.value)}
              fn={() => setSearchTerm('')}
            />
            <Items>
              {optionsFiltered.map((item, subIndex) =>
                subIndex <= 2 ? (
                  <FilterOption
                    key={`${item.name}-${subIndex}`}
                    $isSelected={Boolean(item.selected)}
                  >
                    <input
                      type="checkbox"
                      name="selected"
                      id={String(subIndex)}
                      onChange={(event) => {
                        modifyOrderMenuData(
                          array,
                          setArray,
                          index,
                          'Items',
                          'selected',
                          subIndex,
                          event.target.checked,
                        );
                      }}
                    />
                    <label htmlFor={String(subIndex)}>{item.name}</label>
                  </FilterOption>
                ) : null,
              )}
              {data.Items.length > 4 && <button>See More</button>}
            </Items>
          </Fragment>
        }
      </Body>
    </Container>
  );
};
const Container = styled.div`
  /* Container for the item */
`;
const Body = styled.div<BodyProps>`
  background-color: rgb(242 242 242);
  display: grid;
  gap: 1em;
  height: auto;
  padding: 0.4em 1em;
  transition: height 2s ease-in-out, transform 2s ease-in-out;
  ${({ $isOpen, $index }) => {
    switch ($isOpen) {
      case true:
        return `
                transform: translate(0, 0px);
                background-color: rgb(242, 242, 242);
                padding: 0.4em 1em;
                position: relative;
                height: auto;
                z-index: 1;
                display: grid;
                gap: 1em;
                transition-property: transform, z-index;
                transition-duration: 400ms, 400ms;
                transition-delay: 0s, 400ms;
                transition-timing-function: easy-in-out;
                `;

      case false:
        return `   
                transform: translate(0, -500px);  
                position: absolute; 
                height: 0px;
                z-index: ${-($index + 3)};
                width: 100%;   
                transition-property: transform, z-index;
                transition-duration: 400ms, 400ms;
                transition-delay: 100ms, 0ms;
                transition-timing-function: easy-in-out, lineal;
        `;

      default:
        break;
    }
  }}
`;

const Head = styled.div`
  display: grid;
  grid-template-columns: min-content 1fr;
  gap: 1em;
  align-items: center;
  height: 2em;
  padding: 0 1em;
  background-color: var(--white);
`;
const Items = styled.ul`
  display: grid;
  gap: 0.4em;
  padding: 0;
  list-style: none;
`;
const FilterOption = styled.li<FilterOptionProps>`
  background-color: rgb(254 254 254);
  border-radius: 0.4em;
  display: grid;
  gap: 1em;
  grid-template-columns: min-content 1fr;
  padding: 0.2em 0.6em;
  position: relative;
  ${({ $isSelected }) => {
    switch ($isSelected) {
      case true:
        return `
                    background-color: rgb(34, 106, 201);
                    
                    `;
      case false:
        return `
                    background-color: rgb(254, 254, 254);
                  
                    `;

      default:
        break;
    }
  }}
`;
