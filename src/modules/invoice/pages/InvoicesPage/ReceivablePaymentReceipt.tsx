import { motion } from 'framer-motion';
import { Fragment, useMemo, useState, Suspense } from 'react';
import styled from 'styled-components';

import { useAccountsReceivablePaymentReceipts } from '@/firebase/accountsReceivable/paymentReceipt/useAccountsReceivablePaymentReceipts';
import type {
  DateRangeSelection,
  InvoiceFilters,
} from '@/types/invoiceFilters';
import type { InvoiceData } from '@/types/invoice';
import { getDateRange } from '@/utils/date/getDateRange';
import { lazyWithRetry } from '@/utils/lazyWithRetry';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';

import { FilterBar } from './components/FilterBar/FilterBar';
import { sortInvoices, useInvoiceSorting } from './components/FilterBar/hooks';
import type { InvoiceRecord } from './types';

const SaleReportTable = lazyWithRetry(
  () => import('./SaleReportTable/SaleReportTable'),
  'SaleReportTable',
);

export const ReceivablePaymentReceipt = () => {
  const [datesSelected, setDatesSelected] = useState<DateRangeSelection>(
    getDateRange('today') as DateRangeSelection,
  );
  const { loading, paymentReceipts } =
    useAccountsReceivablePaymentReceipts(datesSelected);
  const [searchTerm, setSearchTerm] = useState('');

  const [baseFilters, setBaseFilters] = useState<InvoiceFilters>({
    clientId: null,
    receivablesOnly: false,
    paymentStatus: '',
  });

  const filters = useMemo<InvoiceFilters>(
    () => ({
      ...baseFilters,
      startDate: datesSelected.startDate,
      endDate: datesSelected.endDate,
    }),
    [baseFilters, datesSelected.startDate, datesSelected.endDate],
  );

  const {
    sortCriteria,
    sortDirection,
    handleSortChange,
    toggleSortDirection,
  } = useInvoiceSorting();

  const processedInvoices = useMemo(
    () =>
      sortInvoices(
        paymentReceipts || [],
        sortCriteria,
        sortDirection,
      ),
    [paymentReceipts, sortCriteria, sortDirection],
  );

  const receiptInvoices = useMemo<InvoiceRecord[]>(
    () =>
      (processedInvoices || []).map((receipt) => {
        const data: InvoiceData = {
          numberID:
            receipt.receiptId ??
            receipt.paymentId ??
            receipt.id ??
            receipt.clientId ??
            null,
          client: receipt.client ? ({ ...receipt.client } as InvoiceData['client']) : null,
          date: receipt.createdAt ?? null,
          paymentMethod: receipt.paymentMethod ?? [],
          totalPurchase: { value: receipt.totalAmount ?? 0 },
        };
        return {
          id: receipt.id,
          data,
        };
      }),
    [processedInvoices],
  );

  return (
    <Fragment>
      <Container
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 0 }}
      >
        <MenuApp
          displayName="Recibos de Pagos por Cobrar"
          data={paymentReceipts}
          searchData={searchTerm}
          setSearchData={setSearchTerm}
        />
        <FilterBar
          invoices={receiptInvoices}
          datesSelected={datesSelected}
          setDatesSelected={setDatesSelected}
          filters={filters}
          onFiltersChange={setBaseFilters}
          sortCriteria={sortCriteria}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
          onToggleDirection={toggleSortDirection}
        />
        <Suspense
          fallback={
            <div style={{ padding: '2em', textAlign: 'center' }}>
              Cargando...
            </div>
          }
        >
          <SaleReportTable
            bills={receiptInvoices}
            searchTerm={searchTerm}
            loading={loading}
          />
        </Suspense>
      </Container>
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





