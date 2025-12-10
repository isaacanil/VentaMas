import { Button, Modal, Tabs, notification } from 'antd';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '../../../../features/auth/userSlice';
import {
  closeInvoicePreviewModal,
  selectInvoicePreview,
} from '../../../../features/invoice/invoicePreviewSlice';
import { useFbGetAccountReceivableByInvoice } from '../../../../firebase/accountsReceivable/useFbGetAccountReceivableByInvoice';
import { useFbGetCreditNotesByInvoice } from '../../../../firebase/creditNotes/useFbGetCreditNotesByInvoice';
import { syncInvoicePaymentsFromAR } from '../../../../firebase/invoices/syncInvoicePaymentsFromAR';
import { useFbGetCreditNoteApplicationsByInvoice } from '../../../../hooks/creditNote/useFbGetCreditNoteApplicationsByInvoice';


import { AccountReceivableInfoCard } from './components/AccountReceivableInfoCard';
import { ClientInfoCard } from './components/ClientInfo';
import { CreditNotesInfoCard } from './components/CreditNotesInfoCard';
import { PaymentMethodInfoCard } from './components/PaymentMethodInfoCard';
import Products from './components/Products';
import SummaryInfoCard from './components/SummaryInfoCard';

import { formatPrice } from '@/utils/format';

export const InvoicePreview = () => {
  const dispatch = useDispatch();
  const invoicePreviewSelected = useSelector(selectInvoicePreview);
  const user = useSelector(selectUser);
  const isOpen = invoicePreviewSelected?.isOpen;
  const [syncing, setSyncing] = useState(false);

  // Destructuración segura con optional chaining y valores predeterminados
  const {
    id: invoiceId,
    client = {},
    products = [],
    paymentMethod = [],
    sourceOfPurchase = '',
    totalShoppingItems = {},
    totalTaxes = {},
    payment = {},
    change = {},
    totalPurchaseWithoutTaxes = {},
  } = invoicePreviewSelected?.data || {};

  // Obtener aplicaciones de notas de crédito para esta factura
  const { applications: creditNoteApplications } =
    useFbGetCreditNoteApplicationsByInvoice(invoiceId);

  // Obtener notas de crédito generadas desde esta factura
  const { creditNotes: generatedCreditNotes } =
    useFbGetCreditNotesByInvoice(invoiceId);

  // Obtener cuentas por cobrar asociadas a esta factura
  const { accountsReceivable } = useFbGetAccountReceivableByInvoice(invoiceId);

  const handleClose = () => {
    dispatch(closeInvoicePreviewModal());
  };

  const hasGeneratedCreditNotes = generatedCreditNotes.length > 0;
  const hasAccountsReceivable = accountsReceivable.length > 0;

  const handleSyncFromReceivables = async () => {
    if (!invoiceId || !hasAccountsReceivable) {
      notification.warning({
        message: 'Sin cuentas por cobrar',
        description:
          'Esta factura no tiene cuentas por cobrar asociadas para sincronizar.',
      });
      return;
    }

    if (!user?.businessID) {
      notification.error({
        message: 'Falta información de negocio',
        description:
          'Inicia sesión nuevamente para poder actualizar la factura.',
      });
      return;
    }

    try {
      setSyncing(true);
      const result = await syncInvoicePaymentsFromAR(user, invoiceId);
      notification.success({
        message: 'Factura actualizada con CxC',
        description: `Total pagado sincronizado: ${formatPrice(result?.totalPaid || 0)}`,
        duration: 4,
      });
    } catch (error) {
      notification.error({
        message: 'No se pudo actualizar la factura',
        description: error?.message || 'Intenta nuevamente.',
      });
    } finally {
      setSyncing(false);
    }
  };

  const tabs = [
    {
      key: 'payment',
      label: 'Pago y resumen',
      children: (
        <Group>
          <PaymentMethodInfoCard
            paymentMethod={paymentMethod}
            creditNoteApplications={creditNoteApplications}
          />
          <SummaryInfoCard
            summaryData={{
              sourceOfPurchase,
              totalShoppingItems,
              totalPurchaseWithoutTaxes,
              totalTaxes,
              payment,
              change,
            }}
          />
        </Group>
      ),
    },
    {
      key: 'accountsReceivable',
      label: 'Cuentas por cobrar',
      children: hasAccountsReceivable ? (
        <TabSection>
          <ActionsRow>
            <Button
              type="primary"
              onClick={handleSyncFromReceivables}
              loading={syncing}
            >
              Actualizar pagos desde CxC
            </Button>
          </ActionsRow>
          <AccountReceivableInfoCard
            accountsReceivable={accountsReceivable}
            client={client}
          />
        </TabSection>
      ) : (
        <EmptyMessage>No hay cuentas por cobrar asociadas.</EmptyMessage>
      ),
    },
    {
      key: 'creditNotes',
      label: 'Notas de crédito',
      children: hasGeneratedCreditNotes ? (
        <CreditNotesInfoCard creditNotes={generatedCreditNotes} />
      ) : (
        <EmptyMessage>No hay notas de crédito generadas.</EmptyMessage>
      ),
    },
  ];

  return (
    isOpen && (
      <Modal
        open={isOpen}
        onCancel={handleClose}
        title={'Factura'}
        footer={null}
        style={{ top: 10 }}
        width={800}
      >
        <Container>
          <ClientInfoCard client={client} />
          <Products products={products} />
          <StyledTabs defaultActiveKey="payment" items={tabs} />
        </Container>
      </Modal>
    )
  );
};

const Container = styled.div`
  display: grid;
  gap: 1em;
`;

const Group = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  align-items: stretch;
`;

const StyledTabs = styled(Tabs)`
  .ant-tabs-content {
    min-height: 220px;
  }
`;

const TabSection = styled.div`
  display: grid;
  gap: 0.75rem;
`;

const ActionsRow = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const EmptyMessage = styled.div`
  padding: 1rem;
  color: #666;
`;
