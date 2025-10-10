import { 
    faFileInvoiceDollar,
    faReceipt
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Card, Pagination } from 'antd';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '../../../../../../../../features/auth/userSlice';
import { usePendingBalance } from '../../../../../../../../firebase/accountsReceivable/fbGetPendingBalance';
import { useClientAccountsReceivable } from '../../../../../../../../firebase/accountsReceivable/useClientAccountsReceivable';
import { useClientAccountsReceivableCounts } from '../../../../../../../../firebase/accountsReceivable/useClientAccountsReceivableCounts';
import { useClientPendingBalance } from '../../../../../../../../firebase/accountsReceivable/useClientPendingBalance';
import { convertAccountsData } from '../../../../../../../../utils/accountsReceivable/accountsReceivable';

import { AccountCard } from './AccountCard/AccountCard';
import { ClientBalanceInfo } from './components/ClientBalanceInfo';
import { CreditLimits } from './components/CreditLimits';
import { FilterBar } from './components/FilterBar';



const ClientFinancialInfo = ({ client, creditLimitForm }) => {
  const user = useSelector(selectUser);

  const [currentPageOpen, setCurrentPageOpen] = useState(1);
  const [currentPageClosed, setCurrentPageClosed] = useState(1);
  const [filterStatus, setFilterStatus] = useState('open');
  const isActiveValue = filterStatus === 'open';
  const [pendingBalance2, setPendingBalance2] = useState(0)

  // listener dinámico según filtro
  const { accounts: displayedAccountsRaw } = useClientAccountsReceivable({
    user,
    clientId: client?.id,
    isActive: isActiveValue,
    orderField: 'numberId',
    orderDirection: 'desc',
  });

  const displayedAccounts = convertAccountsData(displayedAccountsRaw);

  // counts para la barra de filtros
  const { open: openAccountsCount, closed: closedAccountsCount } = useClientAccountsReceivableCounts({
    user,
    clientId: client?.id,
  });
  

  const { balance: pendingBalance } = useClientPendingBalance({ user, clientId: client?.id });
  const changePendingBalance = (balance) => {
    setPendingBalance2(balance)
  }
  usePendingBalance(user.businessID, client.id, changePendingBalance);
  

  const pageSize = 4; 
  
  const getPaginatedAccounts = (accountsList, currentPage) => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return accountsList.slice(startIndex, endIndex);
  };

  const handleOpenPageChange = (page) => {
    setCurrentPageOpen(page);
  };

  const handleClosedPageChange = (page) => {
    setCurrentPageClosed(page);
  };

  const paginatedDisplayedAccounts = getPaginatedAccounts(
    displayedAccounts,
    filterStatus === 'open' ? currentPageOpen : currentPageClosed
  );

  const displayedAccountsCount = displayedAccounts.length;
  const currentPage = filterStatus === 'open' ? currentPageOpen : currentPageClosed;
  const handlePageChange = filterStatus === 'open' ? handleOpenPageChange : handleClosedPageChange;

  return (
    <Container>
      <ClientBalanceInfo
        client={client}
        pendingBalance={pendingBalance}
      />
      <CreditLimits creditLimitForm={creditLimitForm} client={client} arBalance={pendingBalance || 0}/>
      <AccountsReceivable>
        <SectionTitle>
          <FontAwesomeIcon icon={faFileInvoiceDollar} />
          <span>Cuentas por cobrar</span>
        </SectionTitle>
        <FilterBar
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          openAccountsCount={openAccountsCount}
          closedAccountsCount={closedAccountsCount}
        />
        <Accounts>
          {paginatedDisplayedAccounts.length > 0 ? (
            paginatedDisplayedAccounts.map((account) => (
              <AccountCard
                key={account.arId || account.accountNumber}
                account={account}
                accountNumber={account.numberId || account.accountNumber}
                date={account.date}
                frequency={account.frequency}
                balance={account.balance}
                installments={account.installments}
                installmentAmount={account.installmentAmount}
                lastPayment={account.lastPayment}
                isActive={account.isActive}
              />
            ))
          ) : (
            <NoAccountsMessage>
              <FontAwesomeIcon icon={faReceipt} />
              <span>No hay cuentas por cobrar {filterStatus === 'open' ? 'abiertas' : 'cerradas'}</span>
            </NoAccountsMessage>
          )}
        </Accounts>
        {displayedAccountsCount > pageSize && (
          <PaginationContainer>
            <Pagination
              current={currentPage}
              total={displayedAccountsCount}
              pageSize={pageSize}
              onChange={handlePageChange}
              showSizeChanger={false}
            />
          </PaginationContainer>
        )}
      </AccountsReceivable>  
    </Container>
  );
};

export default ClientFinancialInfo;

// Contenedor principal
export const Container = styled.div`
  display: grid;
  gap: 1rem;
`;

// Encabezado de sección
export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

// Títulos y texto
export const CodeTitle = styled.p`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text?.primary || 'rgba(0, 0, 0, 0.87)'};
  line-height: 1.4;
  margin: 0;
`;

export const ClientName = styled.p`
  font-size: 0.875rem;
  font-weight: 400;
  color: ${({ theme }) => theme.text?.secondary || 'rgba(0, 0, 0, 0.54)'};
  line-height: 1.5;
  margin: 0;
  font-style: italic;
`;

// Cards de balance
export const BalanceCard = styled(Card)`
  text-align: center;
  
  .ant-card-body {
    padding: 12px;
  }
`;

export const BalanceTitle = styled.div`
  font-size: 0.75rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text?.primary || 'rgba(0, 0, 0, 0.87)'};
  line-height: 1.5;
  margin-bottom: 0.5rem;
`;

export const BalanceAmount = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #ff4d4f;
  line-height: 1.3;
  margin: 0;
`;

// Cards de límite de crédito
export const CreditLimitCard = styled(Card)`
  text-align: center;
  
  .ant-card-body {
    padding: 12px;
  }
`;

export const CreditAvailableCard = styled(Card)`
  text-align: center;
  
  .ant-card-body {
    padding: 12px;
  }
`;

export const LimitTitle = styled.div`
  font-size: 0.75rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text?.primary || 'rgba(0, 0, 0, 0.87)'};
  line-height: 1.5;
  margin-bottom: 0.5rem;
`;

export const LimitAmount = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text?.primary || 'rgba(0, 0, 0, 0.87)'};
  line-height: 1.3;
  margin: 0;
`;

// Botón estilizado
export const StyledButton = styled(Button)`
  margin-top: 10px;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.4;
`;

// Sección de cuentas por cobrar
export const AccountsReceivable = styled.div`
  display: grid;
  padding: 0 12px;  
  gap: 1rem;
`;

export const SectionTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text?.primary || 'rgba(0, 0, 0, 0.87)'};
  line-height: 1.4;
  margin: 0;
  
  svg {
    font-size: 0.9rem;
    opacity: 0.8;
    color: #1890ff;
  }
`;

export const OpenAccountsTitle = styled.div`
  font-size: 0.875rem;
  font-weight: 400;
  color: ${({ theme }) => theme.text?.secondary || 'rgba(0, 0, 0, 0.54)'};
  line-height: 1.5;
  margin-bottom: 10px;
`;

// Sección de pagos
export const Payments = styled.div`
  margin-top: 10px;
`;

export const PaymentRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  
  span {
    font-size: 0.875rem;
    font-weight: 400;
    color: ${({ theme }) => theme.text?.primary || 'rgba(0, 0, 0, 0.87)'};
    line-height: 1.5;
  }
`;

// Sección general
export const Section = styled.section`
  margin: 0.75rem 0;
`;

// Línea divisoria
export const Line = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.divider || 'rgba(0, 0, 0, 0.12)'};
  margin: 0.5rem 0;
`;

// Contenedor de cuentas
const Accounts = styled.div`
  display: grid;
  gap: 0.4rem;
`;

// Contenedor de paginación
const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 1rem;
  padding: 0.75rem 0;
  
  .ant-pagination {
    font-size: 0.875rem;
    
    .ant-pagination-item {
      font-weight: 400;
      line-height: 1.5;
    }
    
    .ant-pagination-total-text {
      font-size: 0.875rem;
      font-weight: 400;
      color: ${({ theme }) => theme.text?.secondary || 'rgba(0, 0, 0, 0.54)'};
    }
  }
`;

export const NoAccountsMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  height: 200px;
  color: ${({ theme }) => theme.text?.secondary || 'rgba(0, 0, 0, 0.54)'};
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.5;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.divider || 'rgba(0, 0, 0, 0.12)'};
  margin: 1rem 0;

  svg {
    font-size: 2.5rem;
    opacity: 0.6;
    color: #bfbfbf;
  }
  
  span {
    text-align: center;
    font-size: 1rem;
    color: ${({ theme }) => theme.text?.secondary || 'rgba(0, 0, 0, 0.54)'};
  }
`;