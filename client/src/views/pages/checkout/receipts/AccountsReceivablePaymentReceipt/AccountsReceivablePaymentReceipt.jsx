import React, { forwardRef } from 'react'
import { InfoItem, ReceiptComponent, Subtitle } from '../../Style'
import { Header } from '../../components/Header/Header'
import styled from 'styled-components';
import { Line } from '../../Receipt';
import { Row } from '../../components/Table/Row';
import { PaymentArea } from './components/PaymentArea'
import { GeneralBalance } from './components/GeneralBalance';
import { useFormatPrice } from '../../../../../hooks/useFormatPrice';
import { useFormatNumber } from '../../../../../hooks/useFormatNumber'
import { ReceiptList } from '../../components/ReceiptList/ReceiptList';

export const AccountsReceivablePaymentReceipt = forwardRef(({ data }, ref) => {
  const statusSpanish = {
    paid: 'Pagado',
  }
  const formatReceipt = (receipt) => (
    `Cuota #${receipt.number}, ${useFormatPrice(receipt.amount)}, ${statusSpanish[receipt.status]}`
);
  return (
    <ReceiptComponent.HiddenPrintWrapper>
      <ReceiptComponent.Container ref={ref}>
        <Header data={data} />
        <Section>
          <GeneralBalance data={data} />
          <Line />
          <Row space>
            <Subtitle align='center'>RECIBO DE PAGO</Subtitle>
          </Row>
          <Line />
          {data?.accounts.map((account, index) => (
            <div key={index}>
              <InfoItem label={"NO. DOCUMENTO"} value={`#${account?.arNumber}`} />
              <ReceiptList
                title={"Pago Aplicado a: "}
                list={account?.paidInstallments}
                formatReceipt={formatReceipt}
              />
              <InfoItem label={"FACTURA"} value={`#${useFormatNumber(account?.invoiceNumber)}`} />
              <InfoItem label={"PAGO"} value={useFormatPrice(account?.totalPaid)} justifyContent='space-between' />
              <InfoItem label={"BALANCE DE CUENTA"} value={useFormatPrice(account?.arBalance)} justifyContent='space-between' />
              <Line />
            </div>
          ))}
        </Section>
        <PaymentArea data={data} />
      </ReceiptComponent.Container>
    </ReceiptComponent.HiddenPrintWrapper>
  );
});

export default AccountsReceivablePaymentReceipt;

const ReceiptContainer = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
  border: 1px solid #000;
`;


const Info = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.5em;
`;

const Section = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.span`
  font-weight: bold;
`;
