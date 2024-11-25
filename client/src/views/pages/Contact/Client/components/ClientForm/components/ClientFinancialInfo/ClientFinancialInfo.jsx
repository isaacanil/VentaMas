import React, { useEffect, useState } from 'react';
import * as antd from 'antd';
const { Button, Card, Tabs, } = antd;
import styled from 'styled-components';
import { ClientBalanceInfo } from './components/ClientBalanceInfo';
import { CreditLimits } from './components/CreditLimits';
import { AccountCard } from './AccountCard/AccountCard';
import { useSelector } from 'react-redux';
import { selectUser } from '../../../../../../../../features/auth/userSlice';
import { calculateTotalActiveBalance, convertAccountsData } from '../../../../../../../../utils/accountsReceivable/accountsReceivable';
import { fbGetClientAccountsReceivable } from '../../../../../../../../firebase/accountsReceivable/fbGetClientAccountsReceivable';

const ClientFinancialInfo = ({ client, creditLimitForm }) => {
  const [accounts, setAccounts] = useState([])
  const user = useSelector(selectUser);
  const [pendingBalance, setPendingBalance] = useState(0)
  const closedAccounts = accounts.filter((account) => !account.isActive);
  const closedAccountsCount = closedAccounts.length;
  const openAccounts = accounts.filter((account) => account.isActive);
  const openAccountsCount = openAccounts.length;

  const clientId = client?.id;

  const handleConvertAccountsData = (data) => {
    setPendingBalance(calculateTotalActiveBalance(data))
    setAccounts(convertAccountsData(data))
  }

  useEffect(() => {
    const unsubscribe = fbGetClientAccountsReceivable({ user, clientId, onUpdate: handleConvertAccountsData })
    return () => { if (unsubscribe) { unsubscribe() } }
  }, [user, clientId])

  const tabItems = [
    {
      key: '1',
      label: `Abiertas ${openAccountsCount}`,
      children: (
        <Accounts>
          {openAccounts.map((account) => (
            <AccountCard
              key={account.arId}
              account={account}
              accountNumber={account.numberId}
              date={account.date}
              frequency={account.frequency}
              balance={account.balance}
              installments={account.installments}
              installmentAmount={account.installmentAmount}
              lastPayment={account.lastPayment}
              isActive={account.isActive}
            />
          ))}
        </Accounts>
      ),
    },
    {
      key: '2',
      label: `Cerradas ${closedAccountsCount}`,
      children: (
        <Accounts>
          {closedAccounts.map((account) => (
            <AccountCard
              key={account.accountNumber}
              accountNumber={account.accountNumber}
              date={account.date}
              frequency={account.frequency}
              balance={account.balance}
              installments={account.installments}
              installmentAmount={account.installmentAmount}
              lastPayment={account.lastPayment}
              isActive={account.isActive}
              account={account}
            />
          ))}
        </Accounts>
      ),
    },
  ];

  return (
    <Container>
      <ClientBalanceInfo
        client={client}
        pendingBalance={pendingBalance}
      />
       {/* <Line /> */}
      <CreditLimits creditLimitForm={creditLimitForm} client={client} arBalance={pendingBalance || 0}/>
      <AccountsReceivable>
        <SectionTitle>Cuentas por cobrar</SectionTitle>
        <Tabs defaultActiveKey="1" items={tabItems} />
      </AccountsReceivable>  
    </Container>
  );
};

export default ClientFinancialInfo;

export const Container = styled.div`
  display: grid;
  gap: 1em;
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const CodeTitle = styled.p`
  font-weight: bold;
`;

export const ClientName = styled.p`
  font-style: italic;
`;

export const BalanceCard = styled(Card)`
  text-align: center;
`;

export const BalanceTitle = styled.div`
  font-weight: bold;
`;

export const BalanceAmount = styled.div`
  color: red;

`;

export const CreditLimitCard = styled(Card)`
  text-align: center;
`;

export const CreditAvailableCard = styled(Card)`
  text-align: center;
`;

export const LimitTitle = styled.div`
  font-weight: bold;
`;

export const LimitAmount = styled.div`

`;

export const StyledButton = styled(Button)`
  margin-top: 10px;
`;

export const AccountsReceivable = styled.div`

`;

export const SectionTitle = styled.h2`
  font-weight: bold;
  font-size: 18px;
  margin: 0;
`;

export const OpenAccountsTitle = styled.div`
  margin-bottom: 10px;
`;

export const Payments = styled.div`
  margin-top: 10px;
`;

export const PaymentRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
`;

export const Section = styled.section`

`
export const Line = styled.div`
    border-bottom: 1px solid #ccc;
`

const Accounts = styled.div`
  display: grid;
  gap: 0.4em;
 `