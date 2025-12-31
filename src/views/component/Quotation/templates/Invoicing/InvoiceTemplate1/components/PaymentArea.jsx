import React, { Fragment, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';


import { selectUser } from '@/features/auth/userSlice';
import { usePendingBalance } from '@/firebase/accountsReceivable/fbGetPendingBalance';
import { formatPrice } from '@/utils/format';
import {
  getProductsIndividualDiscounts,
  getProductsPrice,
  getProductsTax,
  getTotalDiscount,
} from '@/utils/pricing';
import { Line, SubTitle } from '@/views/component/Quotation/templates/Invoicing/InvoiceTemplate1/InvoiceTemplate1';
import { Paragraph, Spacing, Subtitle } from '@/views/component/Quotation/templates/Invoicing/InvoiceTemplate1/Style';

import { Col } from './Table/Col';
import { Row } from './Table/Row';

export const PaymentArea = ({ data }) => {
  const [pendingBalance, setPendingBalance] = useState(0);
  const user = useSelector(selectUser);
  const businessID = user?.businessID;
  const clientId = data?.client?.id;
  const subtotal =
    getProductsPrice(data?.products || []) +
    getProductsTax(data?.products || []);
  const generalDiscount = getTotalDiscount(
    subtotal,
    data?.discount?.value || 0,
  );
  const individualDiscounts = getProductsIndividualDiscounts(
    data?.products || [],
  );
  const hasIndividualDiscounts = individualDiscounts > 0;
  const formatNumber = (num) => formatPrice(num, '');

  usePendingBalance(businessID, clientId, setPendingBalance);

  const paymentLabel = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    transfer: 'Transferencia',
  };
  const items = [
    {
      label: 'ENVÍO',
      value1: null,
      value2: formatNumber(data?.delivery?.value),
      condition: data?.delivery?.status,
    },
    {
      label: 'SUBTOTAL',
      value2: formatNumber(subtotal),
      condition: true,
    },
    {
      label: 'DESCUENTO GENERAL',
      value2: formatNumber(generalDiscount),
      condition: !hasIndividualDiscounts && generalDiscount > 0,
    },
    {
      label: 'DESCUENTOS PRODUCTOS',
      value2: formatNumber(individualDiscounts),
      condition: hasIndividualDiscounts,
    },
    ...(data?.paymentMethod
      ?.filter((item) => item?.status === true)
      .map((item) => ({
        label: paymentLabel[item?.method],
        value2: formatNumber(item?.value),
        condition: true,
      })) || []),
    {
      subtitle: 'TOTAL',
      value1: formatNumber(data?.totalTaxes?.value),
      value2: formatNumber(data?.totalPurchase?.value),
      condition: true,
      spacingEnd: true,
      spacingStart: true,
    },
    {
      label: data?.change?.value >= 0 ? 'CAMBIO' : 'FALTANTE',
      value2: formatNumber(data?.change?.value),
      condition: true,
    },
    {
      label: 'BALANCE ACTUAL',
      value2: formatNumber(pendingBalance),
      condition: data?.change?.value < 0,
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
    spacingEnd,
    spacingStart,
    line,
  },
}) => {
  return (
    <Fragment>
      {spacingStart && <Spacing />}
      {condition && (
        <Row cols="3">
          {subtitle && <SubTitle>{subtitle} : </SubTitle>}
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
      {line && <Line />}
    </Fragment>
  );
};

const Container = styled.div`
  padding-top: 0.6em;
`;
