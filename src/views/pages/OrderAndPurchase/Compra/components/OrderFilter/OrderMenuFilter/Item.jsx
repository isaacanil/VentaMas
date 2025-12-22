import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Fragment, useState } from 'react';
import styled from 'styled-components';


import { useSearchFilterOrderMenuOption } from '@/hooks/useSearchFilter';

import { Input } from './Input';
import { modifyOrderMenuData } from './modifyOrderMenuData';


export const Item = ({ data, array, setArray, index }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isItemOpen, setIsItemOpen] = useState(false);

  const optionsFiltered = useSearchFilterOrderMenuOption(data, searchTerm);

  const toggleItem = () => setIsItemOpen((prev) => !prev);

  return (
    <Container>
      <Head onClick={toggleItem}>
        <FontAwesomeIcon icon={faChevronRight} />
        <span>{data.name}</span>
      </Head>
      <Body $isOpen={isItemOpen} $index={index}>
        <Fragment>
          <Input
            data={data}
            onChange={(e) => setSearchTerm(e.target.value)}
            fn={() => setSearchTerm('')}
          />
          <Items>
            {optionsFiltered.slice(0, 3).map((item, subIndex) => (
              <FilterOption key={subIndex} $isSelected={Boolean(item.selected)}>
                <input
                  type="checkbox"
                  name="selected"
                  id={`${data.name}-${subIndex}`}
                  onChange={(e) => {
                    modifyOrderMenuData(
                      array,
                      setArray,
                      index,
                      'Items',
                      'selected',
                      subIndex,
                      e.target.checked,
                    );
                  }}
                />
                <label htmlFor={`${data.name}-${subIndex}`}>{item.name}</label>
              </FilterOption>
            ))}
            {data.Items.length > 4 && <button>See More</button>}
          </Items>
        </Fragment>
      </Body>
    </Container>
  );
};
const Container = styled.div`
  /* Item container */
`;
const Body = styled.div`
  background-color: rgb(242 242 242);
  display: grid;
  gap: 1em;
  height: auto;
  padding: 0.4em 1em;
  transition: height, transform 2s ease-in-out;
  ${({ $isOpen, $index }) => {
    switch ($isOpen) {
      case true:
        return `
                background-color: rgb(242, 242, 242);
                display: grid;
                gap: 1em;
                height: auto;
                padding: 0.4em 1em;
                position: relative;
                transform: translate(0, 0px);
                transition-delay: 0s, 400ms;
                transition-duration: 400ms, 400ms;
                transition-property: transform, z-index;
                transition-timing-function: easy-in-out;
                z-index: 1;
                `;

      case false:
        return `   
                height: 0px;
                position: absolute; 
                transform: translate(0, -500px);  
                transition-delay: 100ms, 0ms;
                transition-duration: 400ms, 400ms;
                transition-property: transform, z-index;
                transition-timing-function: easy-in-out, lineal;
                width: 100%;   
                z-index: ${-($index + 3)};
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
const FilterOption = styled.li`
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
