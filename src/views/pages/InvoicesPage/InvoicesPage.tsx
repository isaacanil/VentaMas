import { motion } from 'framer-motion';
import { Fragment, useMemo, useState, Suspense } from 'react';
import styled from 'styled-components';

import { useFbGetInvoicesWithFilters } from '@/firebase/invoices/useFbGetInvoicesWithFilters';
import useViewportWidth from '@/hooks/windows/useViewportWidth';
import type {
  DateRangeSelection,
  InvoiceFilters,
} from '@/types/invoiceFilters';
import { getDateRange } from '@/utils/date/getDateRange';
import { lazyWithRetry } from '@/utils/lazyWithRetry';
import { MenuApp } from '@/views/templates/MenuApp/MenuApp';

import { FilterBar } from './components/FilterBar/FilterBar';
import { sortInvoices, useInvoiceSorting } from './components/FilterBar/hooks';
import { SaleRecordList } from './SaleRecordList/RecordList';
import SalesAnalyticsPanel from './SalesAnalyticsPanel/SalesAnalyticsPanel';

const SaleReportTable = lazyWithRetry(
  () => import('./SaleReportTable/SaleReportTable'),
  'SaleReportTable',
);

export const InvoicesPage = () => {
  const [isReportSaleOpen, setIsReportSaleOpen] = useState(false);
  const [datesSelected, setDatesSelected] = useState<DateRangeSelection>(
    getDateRange('today') as DateRangeSelection,
  );
  const [searchTerm, setSearchTerm] = useState('');

  // Estado base de filtros (sin fechas, se derivarán después)
  const [baseFilters, setBaseFilters] = useState<InvoiceFilters>({
    clientId: null,
    receivablesOnly: false,
    paymentStatus: '',
  });

  // Derivar filtros completos durante render - incluye fechas actualizadas
  const filters = useMemo<InvoiceFilters>(
    () => ({
      ...baseFilters,
      startDate: datesSelected.startDate,
      endDate: datesSelected.endDate,
    }),
    [baseFilters, datesSelected.startDate, datesSelected.endDate],
  );

  const { invoices, loading } = useFbGetInvoicesWithFilters(filters);

  const {
    sortCriteria,
    sortDirection,
    handleSortChange,
    toggleSortDirection,
  } = useInvoiceSorting();

  const processedInvoices = useMemo(
    () =>
      sortInvoices(
        invoices as Array<Record<string, unknown>>,
        sortCriteria,
        sortDirection,
      ),
    [invoices, sortCriteria, sortDirection],
  );

  const onReportSaleOpen = () => setIsReportSaleOpen(!isReportSaleOpen);

  const vw = useViewportWidth();

  return (
    <Fragment>
      <Container>
        <MenuApp
          displayName="Facturas"
          data={invoices}
          searchData={searchTerm}
          showNotificationButton={true}
          setSearchData={setSearchTerm}
          onReportSaleOpen={onReportSaleOpen}
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
              bills={processedInvoices}
              searchTerm={searchTerm}
              loading={loading}
            />
          </Suspense>
        ) : (
          <SaleRecordList invoices={processedInvoices} searchTerm={searchTerm} />
        )}
      </Container>
      <SalesAnalyticsPanel
        isOpen={isReportSaleOpen}
        onOpen={onReportSaleOpen}
        sales={invoices}
      />
    </Fragment>
  );
};

const Container = styled(motion.div)`
  box-sizing: border-box;
  display: grid;
  grid-template-rows: min-content min-content 1fr;
  height: 100%;
  overflow: hidden;
  background-color: var(--color2);
`;
