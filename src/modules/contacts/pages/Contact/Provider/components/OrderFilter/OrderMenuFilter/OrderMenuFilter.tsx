import React, { useState } from 'react';
import styled from 'styled-components';

import { Item } from './Item';
import type { OrderMenuItem } from './types';

interface OrderMenuFilterProps {
  MenuIsOpen?: boolean;
}

interface ContainerProps {
  $isOpen: boolean;
}

export const OrderMenuFilter = ({ MenuIsOpen }: OrderMenuFilterProps) => {
  const [orderMenuData, setOrderMenuData] = useState<OrderMenuItem[]>([]);
  return (
    <Container $isOpen={Boolean(MenuIsOpen)}>
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
            key={`${item.name}-${index}`}
          />
        ))}
      </Body>
    </Container>
  );
};

const Container = styled.div<ContainerProps>`
  background-color: #fff;
  border: 1px solid rgb(0 0 0 / 15%);
  border-radius: 6px;
  box-shadow: 10px 10px 10px 2px rgb(0 0 0 / 15%);
  height: 100%;
  margin-left: 4px;
  max-height: 350px;
  max-width: 300px;
  overflow: hidden;
  position: absolute;
  top: 5.2em;
  transform: none;
  transition: transform 400ms ease-in-out;
  width: 100%;
  z-index: 1;
  ${({ $isOpen }) => {
    switch ($isOpen) {
      case true:
        return `
        transform: scaleX(1) translateX(0px) translateY(0px);
        `;

      case false:
        return `   
        transform: scale(0) translateX(-400px) translateY(-100px);
        `;

      default:
        break;
    }
  }}
`;
const Head = styled.div`
  background-color: var(--white);

  h3 {
    padding: 0.4em 1em;
    margin: 0;
  }
`;
const Body = styled.div`
  /* TODO: Add content to the body */
`;
