import { useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import PurchaseCompletionSummary from '@/components/Purchase/PurchaseCompletionSummary';
import type { Purchase } from '@/utils/purchase/types';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';
import { FilterBar } from './components/FilterBar/FilterBar';
import { PurchaseTable } from './components/PurchasesTable/PurchasesTable';
import { usePurchasesViewState } from './hooks/usePurchasesViewState';

interface PurchasesLocationState {
  showSummary?: boolean;
  completedPurchase?: Purchase | null;
}

export const Purchases = () => {
  const location = useLocation();
  const locationState = location.state as PurchasesLocationState | null;

  const [showSummary, setShowSummary] = useState(
    locationState?.showSummary || false,
  );
  const [completedPurchase, setCompletedPurchase] = useState<Purchase | null>(
    locationState?.completedPurchase || null,
  );
  const {
    dataConfig,
    filterConfig,
    filteredPurchases,
    handleFilterChange,
    isLoading,
    searchTerm,
    setSearchTerm,
  } = usePurchasesViewState();

  const handleCloseSummary = useCallback(() => {
    setShowSummary(false);
    setCompletedPurchase(null);
    window.history.replaceState({}, document.title);
  }, []);

  return (
    <>
      <MenuApp sectionName={'Compras'} />
      <Container>
        <ContentArea>
          <FilterBar
            config={filterConfig}
            onChange={handleFilterChange}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            dataConfig={dataConfig}
          />
          <PurchaseTable
            purchases={filteredPurchases}
            loadingPurchases={isLoading}
            enablePayablesActions={false}
          />
        </ContentArea>
        <PurchaseCompletionSummary
          visible={showSummary}
          onClose={handleCloseSummary}
          purchase={completedPurchase}
        />
      </Container>
    </>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background-color: var(--color2);
`;

const ContentArea = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
`;
