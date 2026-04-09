import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { PageBody } from '@/components/layout/PageShell';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';
import { replacePathParams } from '@/router/routes/replacePathParams';
import { ROUTES } from '@/router/routes/routesName';
import { FilterBar } from '@/modules/orderAndPurchase/pages/OrderAndPurchase/Compra/components/FilterBar/FilterBar';
import { RegisterSupplierPaymentModal } from '@/modules/orderAndPurchase/pages/OrderAndPurchase/Compra/components/PurchasesTable/RegisterSupplierPaymentModal';
import { SupplierPaymentHistoryModal } from '@/modules/orderAndPurchase/pages/OrderAndPurchase/Compra/components/PurchasesTable/components/SupplierPaymentHistoryModal';

import { AccountsPayableDetailDrawer } from './components/AccountsPayableDetailDrawer';
import { AccountsPayableSummaryStrip } from './components/AccountsPayableSummaryStrip';
import { AccountsPayableTable } from './components/AccountsPayableTable';
import {
  buildAccountsPayableToolbarItems,
} from './components/AccountsPayableToolbar';
import { useAccountsPayableViewState } from './hooks/useAccountsPayableViewState';

import type { AccountsPayableRow } from './utils/accountsPayableDashboard';
import type { Purchase } from '@/utils/purchase/types';

export const AccountsPayable = () => {
  const navigate = useNavigate();
  const [selectedRow, setSelectedRow] = useState<AccountsPayableRow | null>(null);
  const [paymentRegistrationPurchase, setPaymentRegistrationPurchase] =
    useState<Purchase | null>(null);
  const [paymentHistoryPurchase, setPaymentHistoryPurchase] =
    useState<Purchase | null>(null);
  const {
    accountsPayableRows,
    agingBucketFilter,
    dataConfig,
    filterConfig,
    groupBy,
    handleFilterChange,
    isLoading,
    searchTerm,
    setAgingBucketFilter,
    setGroupBy,
    setSearchTerm,
    setTraceabilityFilter,
    summary,
    traceabilityFilter,
  } = useAccountsPayableViewState();

  const handleOpenPurchase = (row: AccountsPayableRow) => {
    if (!row.purchase.id) return;

    navigate(
      replacePathParams(ROUTES.PURCHASE_TERM.PURCHASES_COMPLETE, row.purchase.id),
    );
  };

  const handleOpenDetail = (row: AccountsPayableRow) => {
    setSelectedRow(row);
  };

  const handleRegisterPayment = (row: AccountsPayableRow) => {
    setPaymentRegistrationPurchase(row.purchase);
  };

  const handleOpenPayments = (row: AccountsPayableRow) => {
    setPaymentHistoryPurchase(row.purchase);
  };

  const handleClearToolbarFilters = () => {
    setAgingBucketFilter('all');
    setTraceabilityFilter('all');
    setGroupBy('provider');
  };

  const hasActiveToolbarFilters =
    agingBucketFilter !== 'all' ||
    traceabilityFilter !== 'all' ||
    groupBy !== 'provider';

  const extraFilterItems = buildAccountsPayableToolbarItems({
    agingBucketFilter,
    groupBy,
    onAgingBucketChange: setAgingBucketFilter,
    onGroupByChange: setGroupBy,
    onTraceabilityChange: setTraceabilityFilter,
    traceabilityFilter,
  });

  return (
    <>
      <MenuApp sectionName="Cuentas por Pagar" />
      <Container>
        <AccountsPayableSummaryStrip
          activeBucket={agingBucketFilter}
          onSelectBucket={setAgingBucketFilter}
          summary={summary}
        />

        <FilterBarSection>
          <FilterBar
            compactSortButton
            config={filterConfig}
            dataConfig={dataConfig}
            extraItems={extraFilterItems}
            hasActiveExtraFilters={hasActiveToolbarFilters}
            onChange={handleFilterChange}
            onClearExtraFilters={handleClearToolbarFilters}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            sortLabel="Orden"
          />
        </FilterBarSection>

        <TableSection>
          <AccountsPayableTable
            groupBy={groupBy}
            loading={isLoading}
            onOpenDetail={handleOpenDetail}
            onOpenPayments={handleOpenPayments}
            onOpenPurchase={handleOpenPurchase}
            onRegisterPayment={handleRegisterPayment}
            rows={accountsPayableRows}
          />
        </TableSection>
      </Container>

      <AccountsPayableDetailDrawer
        onClose={() => setSelectedRow(null)}
        onOpenPayments={() =>
          selectedRow ? handleOpenPayments(selectedRow) : undefined
        }
        onOpenPurchase={() =>
          selectedRow ? handleOpenPurchase(selectedRow) : undefined
        }
        onRegisterPayment={() =>
          selectedRow ? handleRegisterPayment(selectedRow) : undefined
        }
        open={Boolean(selectedRow)}
        row={selectedRow}
      />

      <RegisterSupplierPaymentModal
        key={paymentRegistrationPurchase?.id ?? 'accounts-payable-register'}
        onCancel={() => setPaymentRegistrationPurchase(null)}
        open={Boolean(paymentRegistrationPurchase)}
        purchase={paymentRegistrationPurchase}
      />

      <SupplierPaymentHistoryModal
        key={paymentHistoryPurchase?.id ?? 'accounts-payable-history'}
        onCancel={() => setPaymentHistoryPurchase(null)}
        open={Boolean(paymentHistoryPurchase)}
        purchase={paymentHistoryPurchase}
      />
    </>
  );
};

const Container = styled(PageBody)`
  display: grid;
  gap: 12px;
  grid-template-rows: repeat(4, min-content);
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
`;

const FilterBarSection = styled.div`
  > div {
    border-bottom: none;
  }
`;

const TableSection = styled.div`
  height: clamp(420px, 55vh, 560px);
  overflow: hidden;

  @media (max-width: 768px) {
    height: clamp(360px, 52vh, 460px);
  }
`;
