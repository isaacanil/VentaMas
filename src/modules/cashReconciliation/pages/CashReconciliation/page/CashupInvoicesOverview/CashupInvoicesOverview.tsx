import { Drawer } from 'antd';
import { Suspense, memo, useMemo } from 'react';
import styled from 'styled-components';

import { lazyWithRetry } from '@/utils/lazyWithRetry';
import type { CashCountInvoice } from '@/utils/cashCount/types';
import type { InvoiceData } from '@/types/invoice';

import { ExportInvoice } from './components/Header/ExportInvoice';

const SaleReportTable = lazyWithRetry(
  () =>
    import('@/modules/invoice/pages/InvoicesPage/SaleReportTable/SaleReportTable'),
  'SaleReportTable',
);

interface CashupInvoicesOverviewProps {
  invoices?: CashCountInvoice[];
  isOpen?: boolean;
  onClose?: () => void;
}

const Spinner = () => (
  <div style={{ padding: '2em', textAlign: 'center' }}>Cargando...</div>
);

export const CashupInvoicesOverview = memo(
  ({
    invoices = [],
    isOpen = true,
    onClose = () => {},
  }: CashupInvoicesOverviewProps) => {
    const invoicesWithData = useMemo(
      () =>
        invoices.filter(
          (invoice): invoice is CashCountInvoice & { data: InvoiceData } =>
            Boolean(invoice?.data),
        ),
      [invoices],
    );

    return (
      <Drawer
        open={isOpen}
        onClose={onClose}
        size="large"
        placement="bottom"
        extra={<ExportInvoice invoices={invoices} />}
        styles={{
          wrapper: {
            height: '100vh',
          },
          header: {
            paddingBlock: 0,
          },
          body: {
            padding: 0,
          },
        }}
      >
        <Suspense fallback={<Spinner />}>
          <Container>
            <SaleReportTable bills={invoicesWithData} searchTerm="" />
          </Container>
        </Suspense>
      </Drawer>
    );
  },
);

CashupInvoicesOverview.displayName = 'CashupInvoicesOverview';
const Container = styled.div`
  display: grid;
  grid-template-rows: 1fr;
  width: 100%;
  height: 100%;
  background-color: var(--color2);
`;
