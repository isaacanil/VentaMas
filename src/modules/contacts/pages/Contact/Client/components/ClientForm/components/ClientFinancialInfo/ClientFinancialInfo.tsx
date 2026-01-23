import {
  faFileInvoiceDollar,
  faReceipt,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Card, Pagination } from 'antd';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import { useClientAccountsReceivable } from '@/firebase/accountsReceivable/useClientAccountsReceivable';
import { useClientAccountsReceivableCounts } from '@/firebase/accountsReceivable/useClientAccountsReceivableCounts';
import { useClientPendingBalance } from '@/firebase/accountsReceivable/useClientPendingBalance';
import { convertAccountsData } from '@/utils/accountsReceivable/accountsReceivable';

import { AccountCard } from './AccountCard/AccountCard';
import { ClientBalanceInfo } from './components/ClientBalanceInfo';
import { CreditLimits } from './components/CreditLimits';
import { FilterBar } from './components/FilterBar';

type UserRootState = Parameters<typeof selectUser>[0];

type ClientSummary = {
  id?: string;
  name?: string;
  numberId?: string | number;
} & Record<string, unknown>;

type DisplayedAccount = ReturnType<typeof convertAccountsData>[number];

type ClientFinancialInfoProps = {
  client: ClientSummary | null | undefined;
};

const ClientFinancialInfo = ({ client }: ClientFinancialInfoProps) => {
  const user = useSelector<UserRootState, ReturnType<typeof selectUser>>(selectUser);

  const [currentPageOpen, setCurrentPageOpen] = useState(1);
  const [currentPageClosed, setCurrentPageClosed] = useState(1);
  const [filterStatus, setFilterStatus] = useState('open');
  const isActiveValue = filterStatus === 'open';

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
  const { open: openAccountsCount, closed: closedAccountsCount } =
    useClientAccountsReceivableCounts({
      user,
      clientId: client?.id,
    });

  const { balance: pendingBalance } = useClientPendingBalance({
    user,
    clientId: client?.id,
  });
  const pendingBalanceValue = pendingBalance ?? 0;

  const pageSize = 4;

  const getPaginatedAccounts = (
    accountsList: DisplayedAccount[],
    currentPage: number,
  ) => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return accountsList.slice(startIndex, endIndex);
  };

  const handleOpenPageChange = (page: number) => {
    setCurrentPageOpen(page);
  };

  const handleClosedPageChange = (page: number) => {
    setCurrentPageClosed(page);
  };

  const paginatedDisplayedAccounts = getPaginatedAccounts(
    displayedAccounts,
    filterStatus === 'open' ? currentPageOpen : currentPageClosed,
  );

  const displayedAccountsCount = displayedAccounts.length;
  const currentPage =
    filterStatus === 'open' ? currentPageOpen : currentPageClosed;
  const handlePageChange =
    filterStatus === 'open' ? handleOpenPageChange : handleClosedPageChange;

  return (
    <Container>
      <ClientBalanceInfo client={client} pendingBalance={pendingBalanceValue} />
      <CreditLimits
        client={client}
        arBalance={pendingBalanceValue}
      />
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
            paginatedDisplayedAccounts.map((account) => {
              const accountNumber =
                account.numberId ??
                (account as { accountNumber?: string | number }).accountNumber;
              const accountKey =
                (account as { arId?: string }).arId ??
                (account as { accountNumber?: string | number }).accountNumber ??
                (account as { id?: string }).id ??
                accountNumber;
              return (
                <AccountCard
                  key={accountKey ?? accountNumber}
                  account={account}
                  accountNumber={accountNumber}
                  date={account.date}
                  frequency={account.frequency}
                  balance={account.balance}
                  installments={account.installments}
                  installmentAmount={account.installmentAmount}
                  lastPayment={account.lastPayment}
                  isActive={account.isActive}
                />
              );
            })
          ) : (
            <NoAccountsMessage>
              <FontAwesomeIcon icon={faReceipt} />
              <span>
                No hay cuentas por cobrar{' '}
                {filterStatus === 'open' ? 'abiertas' : 'cerradas'}
              </span>
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
  align-items: center;
  justify-content: space-between;
`;

// Títulos y texto
export const CodeTitle = styled.p`
  margin: 0;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.4;
  color: ${({ theme }) => theme.text?.primary || 'rgba(0, 0, 0, 0.87)'};
`;

export const ClientName = styled.p`
  margin: 0;
  font-size: 0.875rem;
  font-style: italic;
  font-weight: 400;
  line-height: 1.5;
  color: ${({ theme }) => theme.text?.secondary || 'rgba(0, 0, 0, 0.54)'};
`;

// Cards de balance
export const BalanceCard = styled(Card)`
  text-align: center;

  .ant-card-body {
    padding: 12px;
  }
`;

export const BalanceTitle = styled.div`
  margin-bottom: 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.5;
  color: ${({ theme }) => theme.text?.primary || 'rgba(0, 0, 0, 0.87)'};
`;

export const BalanceAmount = styled.div`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.3;
  color: #ff4d4f;
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
  margin-bottom: 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.5;
  color: ${({ theme }) => theme.text?.primary || 'rgba(0, 0, 0, 0.87)'};
`;

export const LimitAmount = styled.div`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.3;
  color: ${({ theme }) => theme.text?.primary || 'rgba(0, 0, 0, 0.87)'};
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
  gap: 1rem;
  padding: 0 12px;
`;

export const SectionTitle = styled.h2`
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.4;
  color: ${({ theme }) => theme.text?.primary || 'rgba(0, 0, 0, 0.87)'};

  svg {
    font-size: 0.9rem;
    color: #1890ff;
    opacity: 0.8;
  }
`;

export const OpenAccountsTitle = styled.div`
  margin-bottom: 10px;
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.5;
  color: ${({ theme }) => theme.text?.secondary || 'rgba(0, 0, 0, 0.54)'};
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
    line-height: 1.5;
    color: ${({ theme }) => theme.text?.primary || 'rgba(0, 0, 0, 0.87)'};
  }
`;

// Sección general
export const Section = styled.section`
  margin: 0.75rem 0;
`;

// Línea divisoria
export const Line = styled.div`
  margin: 0.5rem 0;
  border-bottom: 1px solid
    ${({ theme }) => theme.divider || 'rgba(0, 0, 0, 0.12)'};
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
  padding: 0.75rem 0;
  margin-top: 1rem;

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
  gap: 16px;
  align-items: center;
  justify-content: center;
  height: 200px;
  margin: 1rem 0;
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.5;
  color: ${({ theme }) => theme.text?.secondary || 'rgba(0, 0, 0, 0.54)'};
  background: #fafafa;
  border: 1px solid ${({ theme }) => theme.divider || 'rgba(0, 0, 0, 0.12)'};
  border-radius: 8px;

  svg {
    font-size: 2.5rem;
    color: #bfbfbf;
    opacity: 0.6;
  }

  span {
    font-size: 1rem;
    color: ${({ theme }) => theme.text?.secondary || 'rgba(0, 0, 0, 0.54)'};
    text-align: center;
  }
`;
