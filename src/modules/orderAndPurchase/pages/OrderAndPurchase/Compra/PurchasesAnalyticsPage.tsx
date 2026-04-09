import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { PageLayout, PageShell } from '@/components/layout/PageShell';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';
import ROUTES_NAME from '@/router/routes/routesName';

import { FilterBar } from './components/FilterBar/FilterBar';
import { PurchasesAnalyticsPanel } from './components/PurchasesReport/components/PurchasesAnalyticsPanel/PurchasesAnalyticsPanel';
import { usePurchasesViewState } from './hooks/usePurchasesViewState';

export const PurchasesAnalyticsPage = () => {
  const navigate = useNavigate();
  const {
    dataConfig,
    filterConfig,
    filteredPurchases,
    handleFilterChange,
    isLoading,
    searchTerm,
    setSearchTerm,
  } = usePurchasesViewState();

  return (
    <PageLayout>
      <MenuApp
        sectionName="Analisis de compras"
        displayName="Analisis de compras"
        sectionStatus={
          isLoading ? 'Cargando...' : `${filteredPurchases.length} compras`
        }
        showNotificationButton={true}
        onBackClick={() => navigate(ROUTES_NAME.PURCHASE_TERM.PURCHASES)}
      />
      <FilterBar
        config={filterConfig}
        onChange={handleFilterChange}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        dataConfig={dataConfig}
      />
      <ScrollArea>
        <Content>
          <PurchasesAnalyticsPanel
            purchases={filteredPurchases}
            loading={isLoading}
          />
        </Content>
      </ScrollArea>
    </PageLayout>
  );
};

const ScrollArea = styled(PageShell)`
  overflow-y: auto;
  padding: 0 1rem 1.5rem;

  @media (width <= 768px) {
    padding: 0 0.75rem 1rem;
  }
`;

const Content = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;

  & > * {
    flex-shrink: 0;
  }
`;
