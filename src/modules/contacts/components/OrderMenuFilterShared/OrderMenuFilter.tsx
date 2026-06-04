import { useState } from 'react';

import { Item } from './Item';
import { Body, Container, Head } from './OrderMenuFilter.styles';
import type { OrderMenuItem } from './types';

interface OrderMenuFilterProps {
  isOpen?: boolean;
}

export const OrderMenuFilter = ({ isOpen }: OrderMenuFilterProps) => {
  const [orderMenuData, setOrderMenuData] = useState<OrderMenuItem[]>([]);

  return (
    <Container $isOpen={Boolean(isOpen)}>
      <Head>
        <h3>Filtros</h3>
      </Head>
      <Body>
        {orderMenuData.map((item, index) => (
          <Item
            data={item}
            array={orderMenuData}
            setArray={setOrderMenuData}
            index={index}
            key={item.name}
          />
        ))}
      </Body>
    </Container>
  );
};
