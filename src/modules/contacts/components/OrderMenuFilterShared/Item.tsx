import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';

import { useSearchFilterOrderMenuOption } from '@/hooks/useSearchFilter';

import { Input } from './Input';
import { Body, Container, FilterOption, Head, Items } from './Item.styles';
import { modifyOrderMenuData } from './modifyOrderMenuData';
import type { OrderMenuItem, OrderMenuOption } from './types';

interface ItemProps {
  data: OrderMenuItem;
  array: OrderMenuItem[];
  setArray: React.Dispatch<React.SetStateAction<OrderMenuItem[]>>;
  index: number;
}

export const Item = ({ data, array, setArray, index }: ItemProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const optionsFiltered = useSearchFilterOrderMenuOption(
    data.Items,
    searchTerm,
  ) as OrderMenuOption[];
  const [isItemOpen, setIsItemOpen] = useState(false);

  return (
    <Container>
      <Head onClick={() => setIsItemOpen((prev) => !prev)}>
        <FontAwesomeIcon icon={faChevronRight} /> <span>{data.name}</span>
      </Head>
      <Body $isOpen={Boolean(isItemOpen)} $index={index}>
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
      </Body>
    </Container>
  );
};
