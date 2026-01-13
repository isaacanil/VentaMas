import React, { Fragment, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';


import { selectUser } from '@/features/auth/userSlice';
import { usePendingBalance } from '@/firebase/accountsReceivable/fbGetPendingBalance';
import type { QuotationData } from '@/pdf/invoicesAndQuotation/types';
import type { UserIdentity } from '@/types/users';
import { formatPrice } from '@/utils/format';
import {
  resolveInvoicePaymentLabel,
  resolveInvoicePaymentMethods,
} from '@/utils/invoice/paymentMethods';
import { getInvoiceTotalsSnapshot } from '@/utils/invoice/totals';
import { Line, SubTitle } from '@/modules/invoice/components/Quotation/templates/Invoicing/InvoiceTemplate1/InvoiceTemplate1';
import { Paragraph, Spacing, Subtitle } from '@/modules/invoice/components/Quotation/templates/Invoicing/InvoiceTemplate1/Style';

import { Col } from './Table/Col';
import { Row } from './Table/Row';

type PaymentRow = {
  subtitle?: string;
  label?: string;
  value1?: React.ReactNode;
  value2?: React.ReactNode;
  condition?: boolean;
  textAlign?: 'left' | 'center' | 'right';
  spacingEnd?: boolean;
  spacingStart?: boolean;
  line?: boolean;
};

type PaymentAreaProps = {
  data?: QuotationData | null;
  P?: React.ElementType;
};

export const PaymentArea = ({ data }: PaymentAreaProps) => {
  const [pendingBalance, setPendingBalance] = useState(0);
  const user = useSelector(selectUser) as UserIdentity | null;
  const businessID = user?.businessID;
  const clientId = data?.client?.id;
  const totalsSnapshot = getInvoiceTotalsSnapshot(data);
  const subtotalWithTax = totalsSnapshot.subtotalWithTax;
  const generalDiscount = totalsSnapshot.generalDiscount;
  const individualDiscounts = totalsSnapshot.individualDiscounts;
  const hasIndividualDiscounts = individualDiscounts > 0;
  const changeValue = Number(data?.change?.value ?? 0);
  const formatNumber = (num?: number | string | null) =>
    formatPrice(num ?? 0, '');

  usePendingBalance(businessID, clientId, setPendingBalance);

  const paymentRows: PaymentRow[] = resolveInvoicePaymentMethods(
    data?.paymentMethod,
  ).flatMap((item) => {
    if (!item?.status) return [];
    const label = resolveInvoicePaymentLabel(item);
    if (!label) return [];
    return [
      {
        label,
        value2: formatNumber(item?.value),
        condition: true,
      },
    ];
  });

  const items: PaymentRow[] = [
    {
      label: 'ENVÍO',
      value1: null,
      value2: formatNumber(data?.delivery?.value),
      condition: data?.delivery?.status,
    },
    {
      label: 'SUBTOTAL',
      value2: formatNumber(subtotalWithTax),
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
    ...paymentRows,
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
      value2: formatNumber(data?.change?.value),
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
type ItemProps = {
  row: PaymentRow;
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
}: ItemProps) => {
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
