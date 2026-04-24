import { Button, Modal, Tabs, notification } from 'antd';
import type { TabsProps } from 'antd';
import React, { useState } from 'react';
import type {
  InvoiceClient,
  InvoiceData,
  InvoicePaymentMethod,
  InvoiceProduct,
} from '@/types/invoice';
import type { AccountsReceivableDoc } from '@/utils/accountsReceivable/types';
import type { UserIdentity } from '@/types/users';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import {
  closeInvoicePreviewModal,
  selectInvoicePreview,
} from '@/features/invoice/invoicePreviewSlice';
import { useFbGetAccountReceivableByInvoice } from '@/firebase/accountsReceivable/useFbGetAccountReceivableByInvoice';
import { useFbGetCreditNotesByInvoice } from '@/firebase/creditNotes/useFbGetCreditNotesByInvoice';
import { syncInvoicePaymentsFromAR } from '@/firebase/invoices/syncInvoicePaymentsFromAR';
import { useFbGetCreditNoteApplicationsByInvoice } from '@/hooks/creditNote/useFbGetCreditNoteApplicationsByInvoice';
import { useAccountingRolloutEnabled } from '@/hooks/useAccountingRolloutEnabled';
import { useOpenAccountingEntry } from '@/modules/accounting/hooks/useOpenAccountingEntry';
import { CreditNotesInfoCard } from '@/modules/invoice/components/InvoiceDetailCards/CreditNotesInfoCard';
import { PaymentMethodInfoCard } from '@/modules/invoice/components/InvoiceDetailCards/PaymentMethodInfoCard';
import { ReceivablePaymentsInfoCard } from '@/modules/invoice/components/InvoiceDetailCards/ReceivablePaymentsInfoCard';
import { InvoiceDocumentHeader } from '@/modules/invoice/components/InvoiceDocumentHeader/InvoiceDocumentHeader';
import { formatPrice } from '@/utils/format';

type InvoicePreviewState = {
  isOpen?: boolean;
  data?: InvoiceData | null;
};

import { AccountReceivableInfoCard } from './components/AccountReceivableInfoCard';
import { ClientInfoCard } from './components/ClientInfo';
import Products from './components/Products';
import SummaryInfoCard from './components/SummaryInfoCard';

export const InvoicePreview = () => {
  const dispatch = useDispatch();
  const invoicePreviewSelected = useSelector(
    selectInvoicePreview,
  ) as InvoicePreviewState;
  const user = useSelector(selectUser) as UserIdentity | null;
  const openAccountingEntry = useOpenAccountingEntry();
  const isOpen = invoicePreviewSelected?.isOpen;
  const invoiceData = invoicePreviewSelected?.data || null;
  const [syncing, setSyncing] = useState(false);
  const businessId =
    user?.businessID ?? user?.businessId ?? user?.activeBusinessId ?? null;
  const isAccountingRolloutEnabled = useAccountingRolloutEnabled(businessId);

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
    totalPurchase = {},
    totalPurchaseWithoutTaxes = {},
  } = invoiceData || {};

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
  const canOpenAccountingEntry =
    isAccountingRolloutEnabled && typeof invoiceId === 'string' && invoiceId.length > 0;

  const handleOpenAccountingEntry = () => {
    if (!invoiceId) return;

    openAccountingEntry({
      eventType: 'invoice.committed',
      sourceDocumentId: invoiceId,
      sourceDocumentType: 'invoice',
    });
  };

  const handleSyncFromReceivables = () => {
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

    setSyncing(true);
    void syncInvoicePaymentsFromAR(user, invoiceId).then(
      (result) => {
        notification.success({
          message: 'Factura actualizada con CxC',
          description: `Total pagado por CxC sincronizado: ${formatPrice(result?.arPaid || 0)} (Balance: ${formatPrice(result?.balanceDue || 0)})`,
          duration: 4,
        });
        setSyncing(false);
      },
      (error) => {
        notification.error({
          message: 'No se pudo actualizar la factura',
          description: error?.message || 'Intenta nuevamente.',
        });
        setSyncing(false);
      },
    );
  };

  const tabs: TabsProps['items'] = [
    {
      key: 'payment',
      label: 'Pago y resumen',
      children: (
        <Group>
          <PaymentMethodInfoCard
            invoiceData={invoiceData}
            paymentMethod={paymentMethod as InvoicePaymentMethod[]}
            creditNoteApplications={creditNoteApplications}
          />
          <SummaryInfoCard
            invoiceData={invoiceData}
            summaryData={{
              sourceOfPurchase,
              totalShoppingItems,
              totalPurchaseWithoutTaxes,
              totalTaxes,
              payment,
              change,
            }}
          />
          {hasAccountsReceivable && (
            <ReceivablePaymentsInfoCard
              user={user}
              invoiceId={invoiceId}
              invoiceData={invoiceData}
              accountsReceivable={accountsReceivable as AccountsReceivableDoc[]}
              invoiceTotal={Number((totalPurchase as any)?.value ?? 0)}
              invoicePayment={payment as any}
              invoiceChange={change as any}
            />
          )}
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
            accountsReceivable={accountsReceivable as AccountsReceivableDoc[]}
            client={client as InvoiceClient}
            invoiceData={invoiceData}
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
        <CreditNotesInfoCard
          creditNotes={generatedCreditNotes}
          invoiceData={invoiceData}
        />
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
          <InvoiceDocumentHeader
            invoice={invoiceData}
            canOpenAccountingEntry={canOpenAccountingEntry}
            onOpenAccountingEntry={handleOpenAccountingEntry}
          />
          <ClientInfoCard client={client as InvoiceClient} />
          <Products
            products={products as InvoiceProduct[]}
            invoiceData={invoiceData}
          />
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
