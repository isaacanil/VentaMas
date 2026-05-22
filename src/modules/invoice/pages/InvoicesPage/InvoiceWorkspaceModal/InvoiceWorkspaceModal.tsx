import { notification } from 'antd';
import { useCallback, useEffect, useRef, useState, type Key } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useReactToPrint } from 'react-to-print';
import styled from 'styled-components';

import { selectBusinessData } from '@/features/auth/businessSlice';
import {
  closeInvoiceWorkspaceModal,
  selectInvoiceWorkspaceModal,
  updateInvoiceWorkspaceModalData,
  type InvoiceWorkspaceModalMode,
} from '@/features/invoice/invoiceWorkspaceModalSlice';
import { selectUser } from '@/features/auth/userSlice';
import { SelectSettingCart } from '@/features/cart/cartSlice';
import { VmButton, VmModal, VmTabs } from '@/components/heroui';
import { downloadInvoicePdf } from '@/firebase/quotation/downloadQuotationPDF';
import { ElectronicTaxReceiptInfoCard } from '@/modules/invoice/components/InvoiceDetailCards/ElectronicTaxReceiptInfoCard';
import { Invoice } from '@/modules/invoice/components/Invoice/components/Invoice/Invoice';
import { useAccountingRolloutEnabled } from '@/hooks/useAccountingRolloutEnabled';
import { useOpenAccountingEntry } from '@/modules/accounting/hooks/useOpenAccountingEntry';
import type { InvoiceData } from '@/types/invoice';
import type { UserIdentity } from '@/types/users';
import { getInvoicePaymentInfo } from '@/utils/invoice';
import { isProgrammaticLetterPdfTemplate } from '@/utils/invoice/template';
import { InvoiceWorkspaceHeader } from './components/InvoiceWorkspaceHeader';
import { InvoiceWorkspaceOperations } from './components/InvoiceWorkspaceOperations';
import { InvoiceWorkspaceOverview } from './components/InvoiceWorkspaceOverview';
import { InvoiceWorkspacePayments } from './components/InvoiceWorkspacePayments';
import { InvoiceWorkspaceProducts } from './components/InvoiceWorkspaceProducts';
import { InvoiceWorkspaceRelations } from './components/InvoiceWorkspaceRelations';
import { resolveInvoiceWorkspaceEditState } from './utils/invoiceWorkspaceEdit';

const WORKSPACE_TAB_KEYS = new Set<InvoiceWorkspaceModalMode>([
  'overview',
  'products',
  'payments',
  'relations',
]);

const normalizeWorkspaceTab = (
  key: Key | InvoiceWorkspaceModalMode,
): InvoiceWorkspaceModalMode => {
  const value = String(key) as InvoiceWorkspaceModalMode;
  return WORKSPACE_TAB_KEYS.has(value) ? value : 'overview';
};

export const InvoiceWorkspaceModal = () => {
  const dispatch = useDispatch();
  const componentToPrintRef = useRef<HTMLDivElement>(null);
  const {
    data: invoice,
    isOpen,
    mode,
  } = useSelector(selectInvoiceWorkspaceModal);
  const business = useSelector(selectBusinessData);
  const cartSettings = useSelector(SelectSettingCart);
  const user = useSelector(selectUser) as UserIdentity | null;
  const openAccountingEntry = useOpenAccountingEntry();
  const [selectedTab, setSelectedTab] = useState<InvoiceWorkspaceModalMode>(
    normalizeWorkspaceTab(mode),
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const invoiceType = cartSettings?.billing?.invoiceType ?? null;
  const businessId =
    user?.businessID ?? user?.businessId ?? user?.activeBusinessId ?? null;
  const invoiceId = typeof invoice?.id === 'string' ? invoice.id : null;
  const isAccountingRolloutEnabled = useAccountingRolloutEnabled(businessId);
  const canOpenAccountingEntry =
    isAccountingRolloutEnabled && Boolean(invoiceId);
  const editState = resolveInvoiceWorkspaceEditState(invoice, now);
  const isEditLocked = !editState.canEditDirectly;
  const paymentInfo = getInvoicePaymentInfo(invoice);

  useEffect(() => {
    if (!isOpen) return undefined;

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 60 * 1000);

    return () => window.clearInterval(timer);
  }, [isOpen]);

  const handleClose = useCallback(() => {
    dispatch(closeInvoiceWorkspaceModal());
  }, [dispatch]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) handleClose();
    },
    [handleClose],
  );

  const handleToggleEditing = useCallback(() => {
    setIsEditing((value) => !value);
  }, []);

  const handleTabSelectionChange = useCallback((key: Key) => {
    setSelectedTab(normalizeWorkspaceTab(key));
  }, []);

  const handleRePrint = useReactToPrint({
    contentRef: componentToPrintRef,
  });

  const handlePrintInvoice = useCallback(async () => {
    if (!invoice || isPrinting) return;

    if (!isProgrammaticLetterPdfTemplate(invoiceType)) {
      handleRePrint();
      return;
    }

    if (!business) {
      notification.warning({
        message: 'No se puede generar el PDF',
        description: 'Faltan los datos del negocio para imprimir la factura.',
        duration: 4,
      });
      return;
    }

    setIsPrinting(true);

    try {
      await downloadInvoicePdf({
        business,
        data: invoice,
        invoiceType,
        onDialogClose: () => {
          notification.success({
            message: 'PDF generado',
            description: 'La factura se generó correctamente.',
            duration: 4,
          });
        },
      });
    } catch (error) {
      console.error('[InvoiceWorkspace] Error generating invoice PDF', error);
      notification.error({
        message: 'No se pudo generar el PDF',
        description:
          error instanceof Error
            ? error.message
            : 'Ocurrió un error al imprimir la factura.',
        duration: 4,
      });
    } finally {
      setIsPrinting(false);
    }
  }, [business, handleRePrint, invoice, invoiceType, isPrinting]);

  const handleSavedInvoice = useCallback(
    (savedInvoice: InvoiceData) => {
      dispatch(updateInvoiceWorkspaceModalData(savedInvoice));
      setIsEditing(false);
    },
    [dispatch],
  );

  const handleInvoiceUpdated = useCallback(
    (updatedInvoice: InvoiceData) => {
      dispatch(updateInvoiceWorkspaceModalData(updatedInvoice));
    },
    [dispatch],
  );

  const handleInvoiceVoided = useCallback(() => {
    dispatch(closeInvoiceWorkspaceModal());
  }, [dispatch]);

  const handleOpenAccountingEntry = useCallback(() => {
    if (!invoiceId) return;

    const opened = openAccountingEntry({
      eventType: 'invoice.committed',
      sourceDocumentId: invoiceId,
      sourceDocumentType: 'invoice',
    });

    if (opened) {
      dispatch(closeInvoiceWorkspaceModal());
    }
  }, [dispatch, invoiceId, openAccountingEntry]);

  if (!isOpen || !invoice) return null;

  const footer = (
    <VmButton variant="secondary" onPress={handleClose}>
      Cerrar
    </VmButton>
  );

  return (
    <>
      <VmModal
        ariaLabel="Workspace de factura"
        isOpen={isOpen}
        onOpenChange={handleOpenChange}
        size="full"
        title="Factura"
        footer={footer}
      >
        <Workspace>
          <InvoiceWorkspaceHeader
            invoice={invoice}
            paymentInfo={paymentInfo}
            isEditLocked={isEditLocked}
            isEditing={isEditing}
            isProcessingEdit={false}
            isProcessingPrint={isPrinting}
            currentTimeMs={now}
            onEdit={handleToggleEditing}
            onPrint={handlePrintInvoice}
            canOpenAccountingEntry={canOpenAccountingEntry}
            onOpenAccountingEntry={handleOpenAccountingEntry}
          />

          <ElectronicTaxReceiptInfoCard
            businessId={businessId}
            invoiceId={invoiceId}
            invoiceData={invoice}
          />

          <WorkspaceTabs
            selectedKey={selectedTab}
            onSelectionChange={handleTabSelectionChange}
          >
            <VmTabs.ListContainer>
              <VmTabs.List aria-label="Secciones de factura">
                <VmTabs.Tab id="overview">
                  <VmTabs.Indicator />
                  Resumen
                </VmTabs.Tab>
                <VmTabs.Tab id="products">
                  <VmTabs.Indicator />
                  Productos
                </VmTabs.Tab>
                <VmTabs.Tab id="payments">
                  <VmTabs.Indicator />
                  Pago
                </VmTabs.Tab>
                <VmTabs.Tab id="relations">
                  <VmTabs.Indicator />
                  Relaciones
                </VmTabs.Tab>
              </VmTabs.List>
            </VmTabs.ListContainer>

            <VmTabs.Panel id="overview">
              <PanelContent>
                <InvoiceWorkspaceOverview
                  key={
                    invoiceId ??
                    String(
                      invoice.numberID ?? invoice.number ?? 'invoice-overview',
                    )
                  }
                  editState={editState}
                  invoice={invoice}
                  isEditing={isEditing}
                  onSaved={handleSavedInvoice}
                  user={user}
                />
                <InvoiceWorkspaceOperations
                  invoice={invoice}
                  onInvoiceUpdated={handleInvoiceUpdated}
                  onInvoiceVoided={handleInvoiceVoided}
                  user={user}
                />
              </PanelContent>
            </VmTabs.Panel>

            <VmTabs.Panel id="products">
              <PanelContent>
                <InvoiceWorkspaceProducts
                  key={
                    invoiceId ??
                    String(
                      invoice.numberID ?? invoice.number ?? 'invoice-products',
                    )
                  }
                  editState={editState}
                  invoice={invoice}
                  isEditing={isEditing}
                  onSaved={handleSavedInvoice}
                  user={user}
                />
              </PanelContent>
            </VmTabs.Panel>

            <VmTabs.Panel id="payments">
              <PanelContent>
                <InvoiceWorkspacePayments
                  key={
                    invoiceId ??
                    String(
                      invoice.numberID ?? invoice.number ?? 'invoice-payments',
                    )
                  }
                  editState={editState}
                  invoice={invoice}
                  isEditing={isEditing}
                  onSaved={handleSavedInvoice}
                  user={user}
                />
              </PanelContent>
            </VmTabs.Panel>

            <VmTabs.Panel id="relations">
              <PanelContent>
                <InvoiceWorkspaceRelations invoice={invoice} />
              </PanelContent>
            </VmTabs.Panel>
          </WorkspaceTabs>
        </Workspace>
      </VmModal>
      <HiddenPrintArea>
        <Invoice
          ref={componentToPrintRef}
          data={invoice}
          template={invoiceType || undefined}
        />
      </HiddenPrintArea>
    </>
  );
};

const Workspace = styled.div`
  display: grid;
  gap: var(--ds-space-4);
`;

const WorkspaceTabs = styled(VmTabs)`
  display: grid;
  gap: var(--ds-space-3);

  > [data-slot='tabs-list-container'] {
    justify-self: start;
    max-width: 100%;
    overflow-x: auto;
  }

  > [data-slot='tabs-list-container'] > [data-slot='tabs-list'] {
    width: fit-content;
    max-width: 100%;
  }

  > [data-slot='tabs-list-container'] [data-slot='tabs-tab'] {
    width: auto;
    white-space: nowrap;
  }
`;

const PanelContent = styled.div`
  display: grid;
  gap: var(--ds-space-3);
  min-width: 0;
`;

const HiddenPrintArea = styled.div`
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
  pointer-events: none;
`;
