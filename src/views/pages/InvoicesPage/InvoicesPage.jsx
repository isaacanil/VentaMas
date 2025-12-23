import { motion } from 'framer-motion';
import { Fragment, useMemo, useState, Suspense } from 'react';
import styled from 'styled-components';

import { useFbGetInvoicesWithFilters } from '@/firebase/invoices/useFbGetInvoicesWithFilters';
import useViewportWidth from '@/hooks/windows/useViewportWidth';
import { getDateRange } from '@/utils/date/getDateRange';
import { lazyWithRetry } from '@/utils/lazyWithRetry';
import { MenuApp } from '@/views/templates/MenuApp/MenuApp';

import { FilterBar } from './components/FilterBar/FilterBar';
import { SaleRecordList } from './SaleRecordList/RecordList';
import SalesAnalyticsPanel from './SalesAnalyticsPanel/SalesAnalyticsPanel';

const SaleReportTable = lazyWithRetry(
  () => import('./SaleReportTable/SaleReportTable'),
  'SaleReportTable',
);

export const InvoicesPage = () => {
  const [isReportSaleOpen, setIsReportSaleOpen] = useState(false);
  const [datesSelected, setDatesSelected] = useState(getDateRange('today'));
  const [searchTerm, setSearchTerm] = useState('');

  // Estado base de filtros (sin fechas, se derivarán después)
  const [baseFilters, setBaseFilters] = useState({
    clientId: null,
    receivablesOnly: false,
    paymentStatus: '',
  });

  // Derivar filtros completos durante render - incluye fechas actualizadas
  const filters = useMemo(
    () => ({
      ...baseFilters,
      startDate: datesSelected.startDate,
      endDate: datesSelected.endDate,
    }),
    [baseFilters, datesSelected.startDate, datesSelected.endDate],
  );

  const { invoices, loading } = useFbGetInvoicesWithFilters(filters);

  // processedInvoices es simplemente una copia de invoices
  const processedInvoices = useMemo(() => [...invoices], [invoices]);

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
          processedInvoices={processedInvoices}
          datesSelected={datesSelected}
          setDatesSelected={setDatesSelected}
          onReportSaleOpen={onReportSaleOpen}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filters={filters}
          onFiltersChange={setBaseFilters}
        />{' '}
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
          <SaleRecordList
            invoices={processedInvoices}
            searchTerm={searchTerm}
          />
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
