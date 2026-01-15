import React, { Fragment, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import { usePendingBalance } from '@/firebase/accountsReceivable/fbGetPendingBalance';
import { formatPrice } from '@/utils/format';
import {
  getProductsPrice,
  getProductsTax,
  getTotalDiscount,
} from '@/utils/pricing';
import { toNumber } from '@/utils/number/toNumber';
import { Line, SubTitle } from '@/modules/checkout/pages/checkout/Receipt';
import { Paragraph, Spacing, Subtitle } from '@/modules/checkout/pages/checkout/Style';
import type { InvoiceData, InvoicePaymentMethod } from '@/types/invoice';
import type { UserIdentity } from '@/types/users';

import { Col } from './Table/Col';
import { Row } from './Table/Row';

type PaymentRow = {
  subtitle?: string;
  label?: string;
  value1?: string;
  value2?: string;
  condition?: boolean;
  textAlign?: 'left' | 'right' | 'center';
  spacingEnd?: boolean;
  spacingStart?: boolean;
  line?: boolean;
};

type PaymentAreaProps = {
  data?: InvoiceData | null;
};

export const PaymentArea = ({ data }: PaymentAreaProps) => {
  const [pendingBalance, setPendingBalance] = useState(0);
  const user = useSelector(selectUser) as UserIdentity | null;
  const businessID = user?.businessID ?? null;
  const clientId = data?.client?.id ?? null;

  const products = Array.isArray(data?.products) ? data?.products : [];
  const subtotal = getProductsPrice(products as any[]) + getProductsTax(products as any[]);
  const discount = getTotalDiscount(
    subtotal,
    toNumber(data?.discount?.value, 0),
  );
  const formatNumber = (num?: number | string | null) => formatPrice(num, '');

  usePendingBalance(businessID, clientId as any, setPendingBalance as any);

  const paymentLabel: Record<string, string> = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    transfer: 'Tranferencia',
  };

  const paymentMethods: InvoicePaymentMethod[] = Array.isArray(data?.paymentMethod)
    ? data?.paymentMethod
    : [];

  const changeValue = toNumber(data?.change?.value, 0);
  const items: PaymentRow[] = [
    {
      label: 'ENVIO',
      value1: undefined,
      value2: formatNumber(data?.delivery?.value),
      condition: Boolean(data?.delivery?.status),
    },
    {
      label: 'SUBTOTAL',
      value2: formatNumber(subtotal),
      condition: true,
    },
    {
      label: 'DESCUENTO',
      value2: formatNumber(discount),
      condition: discount > 0,
    },
    ...paymentMethods
      .filter((item) => item?.status === true)
      .map((item) => ({
        label: paymentLabel[item?.method ?? ''] ?? item?.method ?? '',
        value2: formatNumber(item?.value ?? 0),
        condition: true,
      })),
    {
      subtitle: 'TOTAL',
      value1: formatNumber(data?.totalTaxes?.value),
      value2: formatNumber(data?.totalPurchase?.value),
      condition: true,
      spacingEnd: true,
      spacingStart: true,
    },
    {
      label: changeValue >= 0 ? 'CAMBIO' : 'FALTANTE',
      value2: formatNumber(changeValue),
      condition: true,
    },
    {
      label: 'BALANCE ACTUAL',
      value2: formatNumber(pendingBalance),
      condition: changeValue < 0,
    },
  ];

  return (
    <Container>
      {items.map((row, index) => (
        <Item key={`${row.label ?? row.subtitle ?? 'row'}-${index}`} row={row} />
      ))}
    </Container>
  );
};

const Item = ({ row }: { row: PaymentRow }) => {
  const {
    subtitle,
    label,
    value1,
    value2,
    condition,
    textAlign,
    spacingEnd,
    spacingStart,
    line,
  } = row;

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
