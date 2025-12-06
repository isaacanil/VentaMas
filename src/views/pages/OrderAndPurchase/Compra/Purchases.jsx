import { useState, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';

import PurchaseCompletionSummary from '../../../../components/Purchase/PurchaseCompletionSummary';
import { useFbGetProviders } from '../../../../firebase/provider/useFbGetProvider';
import useFilter from '../../../../hooks/search/useSearch';
import { useListenPurchases } from '../../../../hooks/usePurchases';
import { MenuApp } from '../../../templates/MenuApp/MenuApp';

import { FilterBar } from './components/FilterBar/FilterBar';
import { PurchasesReport } from './components/PurchasesReport/PurchasesReport';
import { PurchaseTable } from './components/PurchasesTable/PurchasesTable';
import createFilterConfig from './config/filterConfig';

export const Purchases = () => {
  const location = useLocation();
  const [showSummary, setShowSummary] = useState(
    location.state?.showSummary || false,
  );
  const [completedPurchase, setCompletedPurchase] = useState(
    location.state?.completedPurchase || null,
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState(() => {
    const config = createFilterConfig();
    return {
      filters: config.defaultValues,
      isAscending: config.defaultSort?.isAscending ?? true,
    };
  });

  const { providers = [] } = useFbGetProviders();

  const dataConfig = useMemo(
    () => ({
      providerId: {
        data: providers,
        accessor: (item) => {
          if (!item) return null;
          return {
            value: item.provider.id || '',
            label: item.provider.name || 'Sin nombre',
          };
        },
      },
    }),
    [providers],
  );

  const filterConfig = useMemo(() => createFilterConfig(), []);

  const handleFilterChange = useCallback((newFilterState) => {
    setFilterState(newFilterState);
  }, []);

  const handleCloseSummary = useCallback(() => {
    setShowSummary(false);
    setCompletedPurchase(null);
    // Limpiar el estado de la navegación
    window.history.replaceState({}, document.title);
  }, []);

  const { purchases, isLoading } = useListenPurchases(filterState);

  const filteredPurchases = useFilter(purchases, searchTerm);

  return (
    <Container>
      <MenuApp sectionName={'Compras'} />
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
        />
      </ContentArea>
      <PurchasesReport />
      <PurchaseCompletionSummary
        visible={showSummary}
        onClose={handleCloseSummary}
        purchase={completedPurchase}
      />
    </Container>
  );
};

const Container = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--color2);
`;

const ContentArea = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr;
  padding: 0.5;
  overflow: hidden;
`;
