import React from 'react';
import styled from 'styled-components';

import { formatPrice } from '@/utils/format';

import {
  abbreviatePaymentMethods,
  getActivePaymentMethods,
} from '../../../../../../utils/invoice';

import { Items } from './Items';


export const Body = ({ data }) => {
  const delivery = data?.delivery;
  const totalPurchaseWithoutTaxes = data?.totalPurchaseWithoutTaxes;
  const discount = data?.discount;
  const totalTaxes = data?.totalTaxes;
  const totalPurchase = data?.totalPurchase;
  const methodActive = getActivePaymentMethods(data);
  const methodActiveArray = methodActive.split(', ');
  const totalShoppingItems = data?.totalShoppingItems;
  const paymentMethods = abbreviatePaymentMethods(methodActiveArray);

  return (
    <Container>
      <OrderDetails>
        <Items
          label="Subtotal"
          value={formatPrice(totalPurchaseWithoutTaxes?.value)}
        />

        <Items
          abbreviate={'Desc'}
          label="Descuento"
          value={`${discount?.value}%`}
          align={'center'}
        />
        <Items
          abbreviate={'Deliv'}
          label="Delivery"
          value={formatPrice(delivery.value)}
          align={'center'}
        />
        <Items
          label="Itbis"
          value={formatPrice(totalTaxes?.value)}
          align="right"
        />
      </OrderDetails>
      <OrderTotal>
        <Items label="Items" value={totalShoppingItems?.value} />
        <Items value={paymentMethods} />
        <Items
          value={
            <TotalAmount>{formatPrice(totalPurchase?.value)}</TotalAmount>
          }
        />
      </OrderTotal>
    </Container>
  );
};
const Container = styled.div`
  height: min-content;
`;
const OrderDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(min-content, 1fr));
  gap: 1rem;
`;
const OrderTotal = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
`;
const TotalAmount = styled.div`
  font-weight: 700;
`;
