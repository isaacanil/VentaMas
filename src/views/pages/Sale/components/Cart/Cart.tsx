import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { ClientControl } from '../../../../component/contact/ClientControl/ClienteControl';

import InvoiceSummary from './components/InvoiceSummary/InvoiceSummary';
import { ProductsList } from './components/ProductsList/ProductsLit';

type CartStateShape = {
  cart?: {
    isOpen?: boolean;
  };
};

type CartTheme = {
  bg?: {
    shade?: string;
  };
};

export const Cart = () => {
  const isOpen = useSelector<CartStateShape, boolean>((state) =>
    Boolean(state.cart?.isOpen),
  );
  return (
    <Container $isOpen={isOpen}>
      <ClientControl />
      <ProductsList />
      <InvoiceSummary />
    </Container>
  );
};

const Container = styled.div<{ $isOpen: boolean }>`
  position: relative;
  background-color: ${({ theme }) =>
    (theme as CartTheme).bg?.shade ?? 'var(--white)'};

  /* max-width: 30em; */
  width: 26em;
  overflow: hidden;
  display: grid;
  grid-template-rows: min-content 1fr min-content;
  border-left: 1px solid rgb(0 0 0 / 21%);
  padding: 0;
  margin: 0;
  gap: 0.4em;
  transition: width 600ms 0ms linear;

  @media (width <= 800px) {
    height: 100%;
    width: 100%;
    max-width: 100%;
    border: 1px solid rgb(0 0 0 / 12.1%);
    border-top: 0;
    border-bottom: 0;
    position: absolute;
    top: 0;
    z-index: 1000;
    transition: transform 600ms 0ms linear;

    ${({ $isOpen }) => {
      switch ($isOpen) {
        case false:
          return `
              transform: translateX(-100%);
              position: absolute;
              z-index: 1;
            `;

        default:
          break;
      }
    }}
  }
`;
