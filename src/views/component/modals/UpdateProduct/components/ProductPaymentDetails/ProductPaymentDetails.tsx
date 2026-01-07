// @ts-nocheck
import React from 'react';
import styled from 'styled-components';

import { formatPrice } from '@/utils/format';
import Typography from '@/views/templates/system/Typografy/Typografy';

const PaymentDetailsContainer = styled.div`
  padding: 20px;
  background-color: #f3f3f3;
  border-radius: 8px;
`;

const PaymentDetailsList = styled.ul`
  display: grid;
  gap: 10px;
  padding: 0;
  list-style-type: none;
`;

const PaymentDetailItem = styled.li`
  display: grid;
  grid-template-columns: 2fr 1fr;
  place-items: center space-between;
`;

const PaymentDetailValue = styled.span`
  text-align: end;
`;

const ProductPaymentDetails = ({ product }) => {
  const paymentDetails = [
    {
      label: `Impuesto ${product?.tax?.ref}`,
      value: (product) =>
        formatPrice(product.cost.unit * product?.tax?.value),
    },
    {
      label: 'Costo',
      value: (product) => formatPrice(product.cost.unit),
    },
    {
      label: 'Costo + Impuestos',
      value: (product) =>
        formatPrice(
          product.cost.unit * product?.tax?.value + product.cost.unit,
        ),
    },
    {
      label: 'Precio Final',
      value: (product) => formatPrice(product.price.unit),
    },
  ];

  return (
    <PaymentDetailsContainer>
      <Typography variant="h4">Resumen</Typography>
      <PaymentDetailsList>
        {paymentDetails.map((detail, index) => (
          <PaymentDetailItem key={index}>
            <span>{detail.label}: </span>
            <PaymentDetailValue>{detail.value(product)}</PaymentDetailValue>
          </PaymentDetailItem>
        ))}
      </PaymentDetailsList>
    </PaymentDetailsContainer>
  );
};

export default ProductPaymentDetails;


