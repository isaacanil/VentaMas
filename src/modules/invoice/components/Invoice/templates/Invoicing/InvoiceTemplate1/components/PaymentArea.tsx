import React, { Fragment, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';


import { selectUser } from '@/features/auth/userSlice';
import { selectInsuranceEnabled } from '@/features/cart/cartSlice';
import { usePendingBalance } from '@/firebase/accountsReceivable/fbGetPendingBalance';
import { formatPrice } from '@/utils/format';
import {
  getInvoiceGeneralDiscount,
  getInvoiceIndividualDiscounts,
  getInvoiceSubtotalWithTax,
  getInvoiceTotalsSnapshot,
} from '@/utils/invoice/totals';
import { toNumber } from '@/utils/number/toNumber';
import type { InvoiceData } from '@/types/invoice';
import type { UserIdentity } from '@/types/users';
import { Line, SubTitle } from '@/modules/invoice/components/Invoice/templates/Invoicing/InvoiceTemplate1/InvoiceTemplate1';
import { Paragraph, Spacing, Subtitle } from '@/modules/invoice/components/Invoice/templates/Invoicing/InvoiceTemplate1/Style';

import { Col } from './Table/Col';
import { Row } from './Table/Row';

interface PaymentAreaProps {
  data?: InvoiceData | null;
}

interface PaymentAreaRow {
  subtitle?: string;
  label?: string;
  value1?: string | number | null;
  value2?: string | number | null;
  condition?: boolean;
  textAlign?: 'left' | 'center' | 'right';
  spacingEnd?: boolean;
  spacingStart?: boolean;
  line?: boolean;
}

export const PaymentArea = ({ data }: PaymentAreaProps) => {
  const [pendingBalance, setPendingBalance] = useState(0);
  const user = useSelector(selectUser) as UserIdentity | null;
  const insuranceEnabled = useSelector(selectInsuranceEnabled);
  const businessID = user?.businessID;
  const clientId = data?.client?.id;
  const subtotal = getInvoiceSubtotalWithTax(data?.products);
  const individualDiscounts = getInvoiceIndividualDiscounts(data?.products);
  const generalDiscount = getInvoiceGeneralDiscount(
    subtotal,
    data?.discount?.value,
  );
  const hasIndividualDiscounts = individualDiscounts > 0;
  const formatNumber = (num: unknown) => formatPrice(toNumber(num), '');
  const totals = getInvoiceTotalsSnapshot(data);
  const totalInsuranceValue = totals.totalInsurance;
  const changeValue = totals.change;

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
      value2: formatNumber(totals.delivery),
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
    {
      label: 'COBERTURA SEGURO',
      value2: formatNumber(totalInsuranceValue),
      condition: insuranceEnabled && totalInsuranceValue > 0,
    },
    ...(data?.paymentMethod
      ?.filter((item) => item?.status === true)
      .map((item) => ({
        label: paymentLabel[item?.method ?? 'cash'],
        value2: formatNumber(item?.value),
        condition: true,
      })) || []),
    {
      subtitle: 'TOTAL',
      value1: formatNumber(totals.totalTaxes),
      value2: formatNumber(totals.totalPurchase),
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
        <Item key={index} row={row} />
      ))}
    </Container>
  );
};
const Item = ({ row }: { row: PaymentAreaRow }) => {
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
