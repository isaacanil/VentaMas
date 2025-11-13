import React, { useState } from 'react';
import styled from 'styled-components';

import { Item } from './Item';

export const OrderMenuFilter = ({ MenuIsOpen }) => {
  const [orderMenuData, setOrderMenuData] = useState([]);
  return (
    <Container isOpen={MenuIsOpen ? true : false}>
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
            key={index}
          ></Item>
        ))}
      </Body>
    </Container>
  );
};

const Container = styled.div`
  overflow: hidden;
  max-height: 350px;
  height: 100%;
  max-width: 300px;
  border-radius: 6px;
  border: 1px solid rgb(0 0 0 / 15%);
  margin-left: 4px;
  width: 100%;
  top: 5.2em;
  position: absolute;
  z-index: 1;
  background-color: #fff;
  transition: transform 400ms ease-in-out;
  transform: perspective();
  box-shadow: 10px 10px 10px 2px rgb(0 0 0 / 15%);
  ${(props) => {
    switch (props.isOpen) {
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
const Body = styled.div``;
