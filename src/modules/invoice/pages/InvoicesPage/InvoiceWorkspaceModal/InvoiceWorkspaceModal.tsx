import { notification } from 'antd';
import { useCallback, useEffect, useRef, useState, useMemo, type Key } from 'react';
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
import { InvoiceWorkspaceOverview } from './components/InvoiceWorkspaceOverview';
import { InvoiceWorkspacePayments } from './components/InvoiceWorkspacePayments';
import { InvoiceWorkspaceProducts } from './components/InvoiceWorkspaceProducts';
import { InvoiceWorkspaceRelations } from './components/InvoiceWorkspaceRelations';
import { resolveInvoiceWorkspaceEditState } from './utils/invoiceWorkspaceEdit';
import { useFbGetAccountReceivableByInvoice } from '@/firebase/accountsReceivable/useFbGetAccountReceivableByInvoice';
import { fbCancelInvoice } from '@/firebase/invoices/fbCancelInvoice';
import { syncInvoicePaymentsFromAR } from '@/firebase/invoices/syncInvoicePaymentsFromAR';
import {
  DGII_608_REASON_OPTIONS,
  getDgii608ReasonOption,
} from '@/utils/fiscal/dgii608ReasonCatalog';
import { formatWorkspaceAmount } from './utils/invoiceWorkspaceFormat';
import { InvoiceWorkspaceSelect } from './components/InvoiceWorkspaceSelect';
import { VmTextArea } from '@/components/heroui';

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

const VOIDED_INVOICE_STATUSES = new Set(['voided', 'canceled', 'cancelled']);

const toSafeNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const resolveInvoiceVoidState = (invoice: InvoiceData) => {
  const status =
    typeof invoice.status === 'string' ? invoice.status.toLowerCase() : '';
  const paymentHistory = invoice.paymentHistory;
  const hasPaymentHistory =
    Array.isArray(paymentHistory) && paymentHistory.length > 0;
  const hasAppliedPayment =
    toSafeNumber(invoice.accumulatedPaid) > 0 || hasPaymentHistory;
  const isAlreadyVoided =
    VOIDED_INVOICE_STATUSES.has(status) || Boolean(invoice.voidedAt);

  if (isAlreadyVoided) {
    return {
      canVoid: false,
      label: 'Ya anulada',
      reason: 'La factura ya está marcada como anulada.',
    };
  }

  if (hasAppliedPayment) {
    return {
      canVoid: false,
      label: 'Bloqueada por pagos',
      reason: 'La factura tiene pagos aplicados o historial de cobros.',
    };
  }

  return {
    canVoid: true,
    label: 'Disponible',
    reason: 'Requiere motivo DGII 608 y confirmación.',
  };
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

  const { accountsReceivable } = useFbGetAccountReceivableByInvoice(invoiceId);
  const [isSyncingReceivables, setIsSyncingReceivables] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [reasonCode, setReasonCode] = useState(
    DGII_608_REASON_OPTIONS[3]?.code ?? DGII_608_REASON_OPTIONS[0]?.code ?? '',
  );
  const [reasonNote, setReasonNote] = useState('');

  const safeAccountsReceivable = useMemo(
    () => (Array.isArray(accountsReceivable) ? accountsReceivable : []),
    [accountsReceivable],
  );
  const hasAccountsReceivable = safeAccountsReceivable.length > 0;
  const voidState = useMemo(
    () => (invoice ? resolveInvoiceVoidState(invoice) : { canVoid: false, label: '', reason: '' }),
    [invoice],
  );

  const handleSyncReceivablePayments = useCallback(async () => {
    if (!invoiceId || !hasAccountsReceivable || !invoice) {
      notification.warning({
        message: 'No se puede sincronizar',
        description: 'Esta factura no tiene cuentas por cobrar asociadas para sincronizar.',
        duration: 4,
      });
      return;
    }
    if (!user?.businessID) {
      notification.error({
        message: 'Sesión expirada',
        description: 'Inicia sesión nuevamente para actualizar la factura.',
        duration: 4,
      });
      return;
    }

    setIsSyncingReceivables(true);
    try {
      const result = await syncInvoicePaymentsFromAR(user, invoiceId);
      const nextInvoice: InvoiceData = {
        ...invoice,
        accumulatedPaid: result.accumulatedPaid,
        balanceDue: result.balanceDue,
        paymentStatus: result.paymentStatus,
        preorderDetails: invoice.preorderDetails
          ? {
              ...invoice.preorderDetails,
              accumulatedPaid: result.accumulatedPaid,
              balanceDue: result.balanceDue,
              paymentStatus: result.paymentStatus,
            }
          : invoice.preorderDetails,
      };

      dispatch(updateInvoiceWorkspaceModalData(nextInvoice));
      notification.success({
        message: 'Pagos CxC sincronizados',
        description: `Sincronizados: ${formatWorkspaceAmount(
          result.arPaid,
          invoice,
        )}. Balance: ${formatWorkspaceAmount(result.balanceDue, invoice)}.`,
        duration: 4,
      });
    } catch (error: any) {
      notification.error({
        message: 'Error de sincronización',
        description: error?.message || 'No se pudo sincronizar la factura.',
        duration: 4,
      });
    } finally {
      setIsSyncingReceivables(false);
    }
  }, [dispatch, hasAccountsReceivable, invoice, invoiceId, user]);

  const handleCancelInvoice = useCallback(async () => {
    if (!voidState.canVoid || !invoice) {
      notification.warning({
        message: 'No se puede anular',
        description: voidState.reason,
        duration: 4,
      });
      return;
    }
    if (!user) {
      notification.error({
        message: 'Error de usuario',
        description: 'No se encontró un usuario válido para anular.',
        duration: 4,
      });
      return;
    }

    const selectedReason = getDgii608ReasonOption(reasonCode);
    if (!selectedReason) {
      notification.error({
        message: 'Motivo inválido',
        description: 'Seleccione un motivo DGII válido.',
        duration: 4,
      });
      return;
    }

    setIsCanceling(true);
    try {
      await fbCancelInvoice(user, invoice, {
        reasonCode: selectedReason.code,
        reasonLabel: selectedReason.label,
        note: reasonNote.trim() || undefined,
      });
      notification.success({
        message: 'Factura anulada',
        description: 'La factura ha sido anulada correctamente.',
        duration: 4,
      });
      setIsCancelModalOpen(false);
      dispatch(closeInvoiceWorkspaceModal());
    } catch (error: any) {
      notification.error({
        message: 'Error al anular',
        description: error?.message || 'Ocurrió un error al anular la factura.',
        duration: 4,
      });
    } finally {
      setIsCanceling(false);
    }
  }, [dispatch, invoice, reasonCode, reasonNote, user, voidState.canVoid, voidState.reason]);

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

  const cancelReasonOptions = useMemo(
    () =>
      DGII_608_REASON_OPTIONS.map((reason) => ({
        value: reason.code,
        label: `${reason.code} - ${reason.label}`,
      })),
    [],
  );

  const cancelFooter = (
    <>
      <VmButton
        variant="secondary"
        onPress={() => setIsCancelModalOpen(false)}
        isDisabled={isCanceling}
      >
        Cancelar
      </VmButton>
      <DangerButton
        variant="primary"
        onPress={handleCancelInvoice}
        isDisabled={!voidState.canVoid || isCanceling}
        isPending={isCanceling}
      >
        Anular factura
      </DangerButton>
    </>
  );

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
        containerClassName="md:p-6 min-[1300px]:p-8"
        dialogClassName="md:w-[min(1120px,calc(100vw-72px))] md:max-w-[1120px] md:h-[calc(100vh-72px)] md:my-auto md:rounded-[28px] min-[1300px]:max-w-[1160px] min-[1300px]:h-[calc(100vh-64px)]"
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
            hasAccountsReceivable={hasAccountsReceivable}
            isSyncingReceivables={isSyncingReceivables}
            onSyncReceivablePayments={handleSyncReceivablePayments}
            voidState={voidState}
            onOpenCancelModal={() => setIsCancelModalOpen(true)}
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
                <ElectronicTaxReceiptInfoCard
                  businessId={businessId}
                  invoiceId={invoiceId}
                  invoiceData={invoice}
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

      <VmModal
        ariaLabel="Anular factura"
        isOpen={isCancelModalOpen}
        onOpenChange={(open) => {
          if (!open && !isCanceling) setIsCancelModalOpen(false);
        }}
        title="Anular factura"
        footer={cancelFooter}
        isDismissable={!isCanceling}
        isKeyboardDismissDisabled={isCanceling}
        size="md"
      >
        <CancelContent>
          <WarningBox>
            <strong>Esta acción es definitiva.</strong>
            <span>
              Los productos volverán al inventario y se guardará el motivo DGII
              608 para auditoría.
            </span>
          </WarningBox>

          <Field>
            <InvoiceWorkspaceSelect
              ariaLabel="Motivo DGII 608"
              label="Motivo DGII 608"
              name="invoice-workspace-cancel-reason"
              options={cancelReasonOptions}
              value={reasonCode}
              isDisabled={isCanceling}
              onChange={setReasonCode}
            />
          </Field>

          <Field>
            <Label htmlFor="invoice-workspace-cancel-note">
              Nota o comentario (opcional)
            </Label>
            <VmTextArea
              id="invoice-workspace-cancel-note"
              name="invoice-workspace-cancel-note"
              placeholder="Describa el motivo de la anulación"
              value={reasonNote}
              disabled={isCanceling}
              onChange={(event) => setReasonNote(event.target.value)}
            />
          </Field>
        </CancelContent>
      </VmModal>
    </>
  );
};

const DangerButton = styled(VmButton)`
  &[data-variant='primary'],
  &[data-variant='secondary'] {
    color: var(--ds-color-state-on-danger);
    background: var(--ds-color-state-danger);
    border-color: var(--ds-color-state-danger);
  }

  &:disabled {
    color: var(--ds-color-text-disabled);
    background: var(--ds-color-bg-subtle);
    border-color: var(--ds-color-border-subtle);
  }
`;

const CancelContent = styled.div`
  display: grid;
  gap: var(--ds-space-4);
`;

const WarningBox = styled.div`
  display: grid;
  gap: var(--ds-space-1);
  padding: var(--ds-space-3);
  color: var(--ds-color-state-warning-text);
  background: var(--ds-color-state-warning-subtle);
  border: 1px solid var(--ds-color-state-warning);
  border-radius: var(--ds-radius-lg);

  strong {
    color: var(--ds-color-text-primary);
  }
`;

const Field = styled.div`
  display: grid;
  gap: var(--ds-space-1);
`;

const Label = styled.label`
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
  color: var(--ds-color-text-secondary);
`;

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
