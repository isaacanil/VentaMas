import React, { forwardRef } from 'react';
import styled from 'styled-components';

import { Header } from '../../components/Header/Header';
import { ReceiptList } from '../../components/ReceiptList/ReceiptList';
import { Row } from '../../components/Table/Row';
import { Line } from '../../Receipt';
import { Container, HiddenPrintWrapper, InfoItem, Subtitle } from '../../Style';

import { GeneralBalance } from './components/GeneralBalance';
import { PaymentArea } from './components/PaymentArea';

import { formatNumber } from '@/utils/format';
import { formatPrice } from '@/utils/format';

export const AccountsReceivablePaymentReceipt = forwardRef(({ data }, ref) => {
  const statusSpanish = {
    paid: 'Pagado',
  };
  const formatReceipt = (receipt) =>
    `Cuota #${receipt.number}, ${formatPrice(receipt.amount)}, ${statusSpanish[receipt.status]}`;
  return (
    <HiddenPrintWrapper>
      <Container ref={ref}>
        <Header data={data} />
        <Section>
          <GeneralBalance data={data} />
          <Line />
          <Row space>
            <Subtitle align="center">RECIBO DE PAGO</Subtitle>
          </Row>
          <Line />
          {data?.accounts.map((account, index) => (
            <div key={index}>
              <InfoItem
                label={'NO. DOCUMENTO'}
                value={`#${account?.arNumber}`}
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
                    ? `#${formatNumber(account?.invoiceNumber)}`
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
