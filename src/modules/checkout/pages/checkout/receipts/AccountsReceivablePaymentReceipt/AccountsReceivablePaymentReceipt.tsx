import React, { forwardRef } from 'react';
import styled from 'styled-components';

import { formatNumber, formatPrice } from '@/utils/format';
import { Line } from '@/modules/checkout/pages/checkout/Receipt';
import { Container, HiddenPrintWrapper, InfoItem, Subtitle } from '@/modules/checkout/pages/checkout/Style';
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
                label={'NO. DOCUMENTO'}
                value={`#${account?.arNumber ?? ''}`}
              />
              <ReceiptList
                title={'Pago Aplicado a: '}
                list={account?.paidInstallments}
                formatReceipt={formatReceipt}
              />
              <InfoItem
                label={'FACTURA'}
                value={
                  account?.invoiceNumber !== undefined &&
                  account?.invoiceNumber !== null
                    ? `#${formatNumber(Number(account?.invoiceNumber))}`
                    : 'N/A'
                }
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
