import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { PageLayout, PageShell } from '@/components/layout/PageShell';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';
import ROUTES_NAME from '@/router/routes/routesName';

import { FilterBar } from './components/FilterBar/FilterBar';
import { useInvoiceSorting } from './components/FilterBar/hooks';
import { useInvoicesFilters } from './hooks/useInvoicesFilters';
import SalesAnalyticsPanel from './SalesAnalyticsPanel/SalesAnalyticsPanel';

export const SalesAnalyticsPage = () => {
  const navigate = useNavigate();
  const {
    datesSelected,
    setDatesSelected,
    filters,
    invoices,
    loading,
    setBaseFilters,
  } = useInvoicesFilters();
  const { sortCriteria, sortDirection, handleSortChange, toggleSortDirection } =
    useInvoiceSorting();

  return (
    <PageLayout>
      <MenuApp
        sectionName="Análisis de ventas"
        showNotificationButton
        onBackClick={() => navigate(ROUTES_NAME.SALES_TERM.BILLS)}
      />
      <FilterBar
        invoices={invoices as any}
        datesSelected={datesSelected}
        setDatesSelected={setDatesSelected}
        filters={filters}
        onFiltersChange={setBaseFilters}
        sortCriteria={sortCriteria}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        onToggleDirection={toggleSortDirection}
      />
      <ScrollArea>
        <Content>
          <SalesAnalyticsPanel sales={invoices as any} loading={loading} />
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
