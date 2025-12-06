import { motion } from 'framer-motion';
import { Fragment, useEffect, useState, Suspense } from 'react';
import styled from 'styled-components';

import { useAccountsReceivablePaymentReceipts } from '../../../firebase/accountsReceivable/paymentReceipt/useAccountsReceivablePaymentReceipts';
import { getDateRange } from '../../../utils/date/getDateRange';
import { lazyWithRetry } from '../../../utils/lazyWithRetry';
import { MenuApp } from '../../templates/MenuApp/MenuApp';

import { FilterBar } from './components/FilterBar/FilterBar';

const SaleReportTable = lazyWithRetry(
  () => import('./SaleReportTable/SaleReportTable'),
  'SaleReportTable',
);

export const ReceivablePaymentReceipt = () => {
  const [datesSelected, setDatesSelected] = useState(getDateRange('today'));

  const { loading, paymentReceipts } =
    useAccountsReceivablePaymentReceipts(datesSelected);

  const [isReportSaleOpen, setIsReportSaleOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [processedInvoices, setProcessedInvoices] = useState(
    paymentReceipts || [],
  );

  const onReportSaleOpen = () => setIsReportSaleOpen(!isReportSaleOpen);

  useEffect(() => {
    setProcessedInvoices(paymentReceipts);
  }, [paymentReceipts]);

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
          invoices={paymentReceipts}
          processedInvoices={processedInvoices}
          setProcessedInvoices={setProcessedInvoices}
          datesSelected={datesSelected}
          setDatesSelected={setDatesSelected}
          onReportSaleOpen={onReportSaleOpen}
        />{' '}
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
