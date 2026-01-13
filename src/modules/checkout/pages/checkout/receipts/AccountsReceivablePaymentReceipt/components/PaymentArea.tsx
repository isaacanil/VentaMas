import React, { Fragment } from 'react';
import styled from 'styled-components';

import { formatPrice } from '@/utils/format';
import { Paragraph, Spacing, Subtitle } from '@/modules/checkout/pages/checkout/Style';
import type {
  AccountsReceivablePaymentReceipt,
  ReceivablePaymentMethod,
} from '@/utils/accountsReceivable/types';
import { Col } from '../../../components/Table/Col';
import { Row } from '../../../components/Table/Row';

type PaymentAreaProps = {
  data?: AccountsReceivablePaymentReceipt | null;
};

type PaymentRow = {
  subtitle?: string;
  label?: string;
  value1?: string;
  value2?: string;
  condition?: boolean;
  textAlign?: 'left' | 'right' | 'center';
  spacingStart?: boolean;
  spacingEnd?: boolean;
};

function calculateTotal(paymentMethods: ReceivablePaymentMethod[] = []) {
  return paymentMethods.reduce(
    (total, payment) => total + (payment?.value ?? 0),
    0,
  );
}

export const PaymentArea = ({ data }: PaymentAreaProps) => {
  const paymentLabel: Record<string, string> = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    transfer: 'Trasferencia',
  };
  const changeValue = data?.change ?? 0;
  const paymentMethods = Array.isArray(data?.paymentMethod)
    ? data?.paymentMethod
    : [];

  const items: PaymentRow[] = [
    ...paymentMethods
      .filter((item) => item?.status === true)
      .map((item) => ({
        label: paymentLabel[item?.method ?? ''] ?? item?.method ?? '',
        value2: formatPrice(item.value),
        condition: true,
      })),
    {
      subtitle: 'TOTAL PAGADO',
      value2: formatPrice(calculateTotal(paymentMethods)),
      condition: true,
      spacingStart: true,
      spacingEnd: true,
    },
    {
      label: changeValue >= 0 ? 'CAMBIO' : 'FALTANTE',
      value2: formatPrice(changeValue),
      condition: true,
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
    spacingStart,
    spacingEnd,
  } = row;

  return (
    <Fragment>
      {spacingStart && <Spacing />}
      {condition && (
        <Row cols="3" space={false}>
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
