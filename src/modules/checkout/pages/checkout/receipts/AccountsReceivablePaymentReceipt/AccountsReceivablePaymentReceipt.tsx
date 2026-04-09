import React, { forwardRef } from 'react';
import styled from 'styled-components';

import { formatNumber, formatPrice } from '@/utils/format';
import { Line } from '@/modules/checkout/pages/checkout/Receipt';
import {
  Container,
  HiddenPrintWrapper,
  InfoItem,
  Subtitle,
} from '@/modules/checkout/pages/checkout/Style';
import type {
  AccountsReceivablePaymentReceipt as AccountsReceivablePaymentReceiptData,
  ReceivablePaidInstallment,
  ReceivablePaymentReceiptAccount,
} from '@/utils/accountsReceivable/types';

import { Header } from '../../components/Header/Header';
import { ReceiptList } from '../../components/ReceiptList/ReceiptList';
import { Row } from '../../components/Table/Row';
import { GeneralBalance } from './components/GeneralBalance';
import { PaymentArea } from './components/PaymentArea';

type ReceiptProps = {
  data?: AccountsReceivablePaymentReceiptData | null;
};

export const AccountsReceivablePaymentReceipt = forwardRef<
  HTMLDivElement,
  ReceiptProps
>(({ data }, ref) => {
  const statusSpanish: Record<string, string> = {
    paid: 'Pagado',
    partial: 'Parcial',
  };
  const formatReceipt = (receipt: ReceivablePaidInstallment) =>
    `Cuota #${receipt.number ?? ''}, ${formatPrice(receipt.amount)}, ${statusSpanish[receipt.status ?? ''] ?? receipt.status ?? ''}`;

  const accounts = (data?.accounts ?? []) as ReceivablePaymentReceiptAccount[];
  const formatDocNumber = (value: string | number) => {
    const asNumber = Number(value);
    return Number.isFinite(asNumber) ? formatNumber(asNumber) : String(value);
  };
  const hasDocumentNumber = (value: unknown): value is string | number =>
    value !== undefined && value !== null && value !== '' && value !== 'N/A';
  const getDocumentLabel = (account: ReceivablePaymentReceiptAccount): string => {
    if (account?.documentLabel) return account.documentLabel;
    return account?.documentType === 'preorder' ? 'PREVENTA' : 'FACTURA';
  };
  const getDocumentValue = (account: ReceivablePaymentReceiptAccount): string => {
    if (hasDocumentNumber(account?.documentNumber)) {
      return `#${formatDocNumber(account.documentNumber)}`;
    }
    if (hasDocumentNumber(account?.invoiceNumber)) {
      return `#${formatDocNumber(account.invoiceNumber)}`;
    }
    return 'N/A';
  };

  return (
    <HiddenPrintWrapper>
      <Container ref={ref}>
        <Header data={data} />
        <Section>
          <GeneralBalance data={data} />
          <Line />
          <Row cols={1} space>
            <Subtitle align="center">RECIBO DE PAGO</Subtitle>
          </Row>
          <Line />
          {accounts.map((account, index) => (
            <div key={account.arId ?? index}>
              <InfoItem
                label={'NO. CUENTA POR COBRAR'}
                value={
                  hasDocumentNumber(account?.arNumber)
                    ? `#${formatDocNumber(account.arNumber)}`
                    : 'N/A'
                }
              />
              <ReceiptList
                title={'Pago Aplicado a: '}
                list={account?.paidInstallments}
                formatReceipt={formatReceipt}
              />
              <InfoItem
                label={getDocumentLabel(account)}
                value={getDocumentValue(account)}
              />
              <InfoItem
                label={'PAGO'}
                value={formatPrice(account?.totalPaid)}
                justifyContent="space-between"
              />
              <InfoItem
                label={'BALANCE DE CUENTA'}
                value={formatPrice(account?.arBalance)}
                justifyContent="space-between"
              />
              <Line />
            </div>
          ))}
        </Section>
        <PaymentArea data={data} />
      </Container>
    </HiddenPrintWrapper>
  );
});

AccountsReceivablePaymentReceipt.displayName =
  'AccountsReceivablePaymentReceipt';

export default AccountsReceivablePaymentReceipt;

const Section = styled.div`
  margin-bottom: 20px;
`;
