import React from 'react';
import styled from 'styled-components';
import Typography from '../../../../../templates/system/Typografy/Typografy';
import { useFormatPrice } from '../../../../../../hooks/useFormatPrice';

const PaymentDetailsContainer = styled.div`
  padding: 20px;
  background-color: #f3f3f3;
  border-radius: 8px;
`;

const PaymentDetailsList = styled.ul`
  list-style-type: none;
  padding: 0;
  display: grid;
  gap: 10px;
`;

const PaymentDetailItem = styled.li`
  display: grid;
  grid-template-columns: 2fr 1fr;
  justify-items: space-between;
  align-items: center;
`;

const PaymentDetailValue = styled.span`

  text-align: end;
`;

const ProductPaymentDetails = ({ product}) => {
    const paymentDetails = [
        {
          label: `Impuesto ${product?.tax?.ref}`,
          value: (product) => useFormatPrice(product.cost.unit * product?.tax?.value),
        },
        {
          label: 'Costo',
          value: (product) => useFormatPrice(product.cost.unit),
        },
        {
          label: 'Costo + Impuestos',
          value: (product) => useFormatPrice((product.cost.unit * product?.tax?.value) + product.cost.unit),
        },
        {
          label: 'Precio Final',
          value: (product) => useFormatPrice(product.price.unit),
        },
      ];
      
  return (
    <PaymentDetailsContainer>
    <Typography variant='h4'>Resumen</Typography>
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
