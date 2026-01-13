import { useState, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import PurchaseCompletionSummary from '@/components/Purchase/PurchaseCompletionSummary';
import { useFbGetProviders } from '@/firebase/provider/useFbGetProvider';
import useFilter from '@/hooks/search/useSearch';
import { useListenPurchases } from '@/hooks/usePurchases';
import type { Purchase } from '@/utils/purchase/types';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';
import { FilterBar } from './components/FilterBar/FilterBar';
import { PurchasesReport } from './components/PurchasesReport/PurchasesReport';
import { PurchaseTable } from './components/PurchasesTable/PurchasesTable';
import type {
  DataConfigMap,
  FilterOption,
  FilterState,
} from './components/FilterBar/types';
import createFilterConfig from './config/filterConfig';

interface PurchasesLocationState {
  showSummary?: boolean;
  completedPurchase?: Purchase | null;
}

interface ProviderRecord {
  provider?: {
    id?: string;
    name?: string;
  };
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState<FilterState>(() => {
    const config = createFilterConfig();
    return {
      filters: config.defaultValues,
      isAscending: config.defaultSort?.isAscending ?? true,
    };
  });

  const { providers = [] } = useFbGetProviders() as {
    providers?: ProviderRecord[];
  };

  const dataConfig = useMemo<DataConfigMap>(
    () => ({
      providerId: {
        data: providers,
        accessor: (item: unknown): FilterOption => {
          const providerItem = item as ProviderRecord;
          return {
            value: providerItem?.provider?.id || '',
            label: providerItem?.provider?.name || 'Sin nombre',
          };
        },
      },
    }),
    [providers],
  );

  const filterConfig = useMemo(() => createFilterConfig(), []);

  const handleFilterChange = useCallback((newFilterState: FilterState) => {
    setFilterState(newFilterState);
  }, []);

  const handleCloseSummary = useCallback(() => {
    setShowSummary(false);
    setCompletedPurchase(null);
    window.history.replaceState({}, document.title);
  }, []);

  const { purchases, isLoading } = useListenPurchases(filterState) as {
    purchases?: Purchase[];
    isLoading?: boolean;
  };

  const filteredPurchases = useFilter(purchases, searchTerm) as Purchase[];

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

