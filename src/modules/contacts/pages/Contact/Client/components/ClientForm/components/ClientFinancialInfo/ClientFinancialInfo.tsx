import {
  faFileInvoiceDollar,
  faReceipt,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Pagination } from 'antd';
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
import type { ClientFinancialSummary } from './types';
import { getAccountCardKey } from './utils/getAccountCardKey';

type UserRootState = Parameters<typeof selectUser>[0];

type DisplayedAccount = ReturnType<typeof convertAccountsData>[number];

type ClientFinancialInfoProps = {
  client: ClientFinancialSummary | null | undefined;
};

const ClientFinancialInfo = ({ client }: ClientFinancialInfoProps) => {
  const user = useSelector<UserRootState, ReturnType<typeof selectUser>>(
    selectUser,
  );

  const [currentPageOpen, setCurrentPageOpen] = useState(1);
  const [currentPageClosed, setCurrentPageClosed] = useState(1);
  const [filterStatus, setFilterStatus] = useState<'open' | 'closed'>('open');
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
      <CreditLimits client={client} arBalance={pendingBalanceValue} />
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
              return (
                <AccountCard
                  key={getAccountCardKey(account)}
                  account={account}
                  frequency={account.frequency}
                  balance={account.balance}
                  installments={account.installments}
                  installmentAmount={account.installmentAmount}
                  isActive={account.isActive}
                  client={client}
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
