import { useMemo, useState, Suspense } from 'react';

import useViewportWidth from '@/hooks/windows/useViewportWidth';
import { lazyWithRetry } from '@/utils/lazyWithRetry';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';
import { PageLayout } from '@/components/layout/PageShell';

import { FilterBar } from './components/FilterBar/FilterBar';
import { sortInvoices, useInvoiceSorting } from './components/FilterBar/hooks';
import { useInvoicesFilters } from './hooks/useInvoicesFilters';
import { SaleRecordList } from './SaleRecordList/RecordList';

const SaleReportTable = lazyWithRetry(
  () => import('./SaleReportTable/SaleReportTable'),
  'SaleReportTable',
);

export const InvoicesPage = () => {
  const {
    datesSelected,
    setDatesSelected,
    filters,
    invoices,
    loading,
    setBaseFilters,
  } = useInvoicesFilters();
  const [searchTerm, setSearchTerm] = useState('');

  const { sortCriteria, sortDirection, handleSortChange, toggleSortDirection } =
    useInvoiceSorting();

  const processedInvoices = useMemo(
    () => sortInvoices(invoices, sortCriteria, sortDirection),
    [invoices, sortCriteria, sortDirection],
  );

  const vw = useViewportWidth();

  return (
    <PageLayout>
      <MenuApp
        displayName="Facturas"
        data={invoices}
        searchData={searchTerm}
        showNotificationButton
        setSearchData={setSearchTerm}
      />
      <FilterBar
        invoices={invoices}
        datesSelected={datesSelected}
        setDatesSelected={setDatesSelected}
        filters={filters}
        onFiltersChange={setBaseFilters}
        sortCriteria={sortCriteria}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        onToggleDirection={toggleSortDirection}
      />
      {vw > 900 ? (
        <Suspense
          fallback={
            <div style={{ padding: '2em', textAlign: 'center' }}>
              Cargando...
            </div>
          }
        >
          <SaleReportTable
            bills={processedInvoices as any}
            searchTerm={searchTerm}
            loading={loading}
          />
        </Suspense>
      ) : (
        <SaleRecordList
          invoices={processedInvoices as any}
          searchTerm={searchTerm}
        />
      )}
    </PageLayout>
  );
};
