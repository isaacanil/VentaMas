import React, { Fragment } from 'react';
import styled from 'styled-components';

import { formatPrice } from '@/utils/format';
import { Paragraph, Spacing, Subtitle } from '@/views/pages/checkout/Style';

import { Col } from '../../../components/Table/Col';
import { Row } from '../../../components/Table/Row';


function calculateTotal(paymentMethods) {
  return paymentMethods?.reduce((total, payment) => total + payment.value, 0);
}

export const PaymentArea = ({ data }) => {
  const paymentLabel = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    transfer: 'Trasferencia',
  };
  const items = [
    ...(data?.paymentMethod
      ?.filter((item) => item?.status === true)
      .map((item) => ({
        label: paymentLabel[item?.method],
        value2: formatPrice(item.value),
        condition: true,
      })) || []),
    {
      subtitle: 'TOTAL PAGADO',
      value2: formatPrice(calculateTotal(data?.paymentMethod)),
      condition: true,
      spacingStart: true,
      spacingEnd: true,
    },
    {
      label: data?.change >= 0 ? 'CAMBIO' : 'FALTANTE',
      value2: formatPrice(data.change),
      condition: true,
    },
  ];
  return (
    <Container>
      {items.map((row, index) => (
        <Item key={index} row={row} />
      ))}
    </Container>
  );
};
const Item = ({
  row: {
    subtitle,
    label,
    value1,
    value2,
    condition,
    textAlign,
    spacingStart,
    spacingEnd,
  },
}) => {
  return (
    <Fragment>
      {spacingStart && <Spacing />}
      {condition && (
        <Row cols="3">
          {subtitle && <Subtitle>{subtitle} : </Subtitle>}
          {label && <Paragraph>{label} : </Paragraph>}
          <Col textAlign={textAlign || 'right'}>{value1}</Col>
          {subtitle ? (
            <Subtitle align={textAlign || 'right'}>{value2}</Subtitle>
          ) : (
            <Col textAlign={textAlign || 'right'}>{value2}</Col>
          )}
        </Row>
      )}
      {spacingEnd && <Spacing />}
    </Fragment>
  );
};

const Container = styled.div`
  padding-top: 0.6em;
`;
