import { Drawer } from 'antd';
import { Suspense, memo } from 'react';
import styled from 'styled-components';

import { lazyWithRetry } from '../../../../../utils/lazyWithRetry';

import { ExportInvoice } from './components/Header/ExportInvoice';

const SaleReportTable = lazyWithRetry(
  () => import('../../../InvoicesPage/SaleReportTable/SaleReportTable'),
  'SaleReportTable',
);

const Spinner = () => (
  <div style={{ padding: '2em', textAlign: 'center' }}>Cargando...</div>
);

export const CashupInvoicesOverview = memo(
  ({ invoices = [], isOpen, onClose }) => {
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
            <SaleReportTable bills={invoices} />
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
