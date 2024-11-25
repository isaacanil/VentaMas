import React from 'react'
import styled from 'styled-components'
import KeyValueDisplay from '@templates/system/KeyValueDisplay/KeyValueDisplay';
import { useFormatPrice } from '@hooks/useFormatPrice';
import { Payment } from './components/Payment';


export const AccountCard = ({  accountNumber, date, frequency, balance, installments, installmentAmount, lastPayment, lastPaymentDate, isActive, account }) => {
  return (
    <Card>
      <AccountInfo>
        <KeyValueDisplay

          title={"#"}
          value={accountNumber}
        />
        <KeyValueDisplay
          title={"Fecha"}
          align={'center'}
          value={date}
        />
        <KeyValueDisplay
          title={"Frecuencia"}
          align={'center'}
          value={frequency}
        />
        <KeyValueDisplay
          title={"Balance"}
          align="right"
          value={useFormatPrice(balance)}
        />
      </AccountInfo>
      <Payments>
        <Payment
          installmentAmount={installmentAmount}
          installments={installments}
          lastPayment={lastPayment}
          lastPaymentDate={lastPaymentDate}
          isActive={isActive}
          balance={balance}
          account={account}
        />
      </Payments>
    </Card>
  );
};

const Card = styled.div`
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 0.4em 0.4em;
    display: grid;

`;

const AccountInfo = styled.div`
  display: grid;
  gap: 1em;
  grid-template-columns: min-content 1fr 1fr 1fr;

  border-bottom: 1px solid #ccc;
`;

export const Payments = styled.div`
 
`;


