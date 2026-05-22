import { useMemo, useState } from 'react';
import { message } from 'antd';
import styled from 'styled-components';

import {
  VmButton,
  VmCard,
  VmChip,
  VmModal,
  VmTextArea,
} from '@/components/heroui';
import { useFbGetAccountReceivableByInvoice } from '@/firebase/accountsReceivable/useFbGetAccountReceivableByInvoice';
import { fbCancelInvoice } from '@/firebase/invoices/fbCancelInvoice';
import { syncInvoicePaymentsFromAR } from '@/firebase/invoices/syncInvoicePaymentsFromAR';
import type { InvoiceData } from '@/types/invoice';
import type { UserIdentity } from '@/types/users';
import {
  DGII_608_REASON_OPTIONS,
  getDgii608ReasonOption,
} from '@/utils/fiscal/dgii608ReasonCatalog';
import { formatWorkspaceAmount } from '../utils/invoiceWorkspaceFormat';
import { InvoiceWorkspaceSelect } from './InvoiceWorkspaceSelect';

interface InvoiceWorkspaceOperationsProps {
  invoice: InvoiceData;
  onInvoiceUpdated: (invoice: InvoiceData) => void;
  onInvoiceVoided: () => void;
  user: UserIdentity | null;
}

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

export const InvoiceWorkspaceOperations = ({
  invoice,
  onInvoiceUpdated,
  onInvoiceVoided,
  user,
}: InvoiceWorkspaceOperationsProps) => {
  const invoiceId = typeof invoice.id === 'string' ? invoice.id : null;
  const { accountsReceivable } = useFbGetAccountReceivableByInvoice(invoiceId);
  const [isSyncingReceivables, setIsSyncingReceivables] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [reasonCode, setReasonCode] = useState(
    DGII_608_REASON_OPTIONS[3]?.code ?? DGII_608_REASON_OPTIONS[0]?.code ?? '',
  );
  const [reasonNote, setReasonNote] = useState('');
  const reasonOptions = useMemo(
    () =>
      DGII_608_REASON_OPTIONS.map((reason) => ({
        value: reason.code,
        label: `${reason.code} - ${reason.label}`,
      })),
    [],
  );

  const safeAccountsReceivable = useMemo(
    () => (Array.isArray(accountsReceivable) ? accountsReceivable : []),
    [accountsReceivable],
  );
  const hasAccountsReceivable = safeAccountsReceivable.length > 0;
  const voidState = resolveInvoiceVoidState(invoice);

  const handleSyncReceivablePayments = async () => {
    if (!invoiceId || !hasAccountsReceivable) {
      message.warning(
        'Esta factura no tiene cuentas por cobrar asociadas para sincronizar.',
      );
      return;
    }
    if (!user?.businessID) {
      message.error('Inicia sesión nuevamente para actualizar la factura.');
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

      onInvoiceUpdated(nextInvoice);
      message.success(
        `Pagos CxC sincronizados: ${formatWorkspaceAmount(
          result.arPaid,
          invoice,
        )}. Balance: ${formatWorkspaceAmount(result.balanceDue, invoice)}.`,
      );
    } catch (error: any) {
      message.error(error?.message || 'No se pudo sincronizar la factura.');
    } finally {
      setIsSyncingReceivables(false);
    }
  };

  const handleCancelInvoice = async () => {
    if (!voidState.canVoid) {
      message.warning(voidState.reason);
      return;
    }
    if (!user) {
      message.error('No se encontró un usuario válido para anular.');
      return;
    }

    const selectedReason = getDgii608ReasonOption(reasonCode);
    if (!selectedReason) {
      message.error('Seleccione un motivo DGII válido.');
      return;
    }

    setIsCanceling(true);
    try {
      await fbCancelInvoice(user, invoice, {
        reasonCode: selectedReason.code,
        reasonLabel: selectedReason.label,
        note: reasonNote.trim() || undefined,
      });
      message.success('Factura anulada correctamente');
      setIsCancelModalOpen(false);
      onInvoiceVoided();
    } catch (error: any) {
      message.error(error?.message || 'Error al anular factura');
    } finally {
      setIsCanceling(false);
    }
  };

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

  return (
    <>
      <OperationsCard>
        <VmCard.Header>
          <VmCard.Title>Acciones operativas</VmCard.Title>
          <VmCard.Description>
            Cambios controlados relacionados con esta factura.
          </VmCard.Description>
        </VmCard.Header>
        <VmCard.Content>
          <ActionList>
            <ActionItem>
              <ActionCopy>
                <ActionTitle>Actualizar pagos desde CxC</ActionTitle>
                <ActionDescription>
                  Recalcula pagado, pendiente y estado usando las cuentas por
                  cobrar asociadas.
                </ActionDescription>
              </ActionCopy>
              <ActionMeta>
                <VmChip
                  color={hasAccountsReceivable ? 'accent' : 'default'}
                  variant="soft"
                >
                  <VmChip.Label>
                    {hasAccountsReceivable
                      ? `${safeAccountsReceivable.length} CxC`
                      : 'Sin CxC'}
                  </VmChip.Label>
                </VmChip>
                <VmButton
                  size="sm"
                  variant="secondary"
                  onPress={handleSyncReceivablePayments}
                  isDisabled={!hasAccountsReceivable || isSyncingReceivables}
                  isPending={isSyncingReceivables}
                >
                  Sincronizar
                </VmButton>
              </ActionMeta>
            </ActionItem>

            <ActionItem>
              <ActionCopy>
                <ActionTitle>Anular factura</ActionTitle>
                <ActionDescription>{voidState.reason}</ActionDescription>
              </ActionCopy>
              <ActionMeta>
                <VmChip
                  color={voidState.canVoid ? 'warning' : 'default'}
                  variant="soft"
                >
                  <VmChip.Label>{voidState.label}</VmChip.Label>
                </VmChip>
                <DangerButton
                  size="sm"
                  variant="secondary"
                  onPress={() => setIsCancelModalOpen(true)}
                  isDisabled={!voidState.canVoid}
                >
                  Anular
                </DangerButton>
              </ActionMeta>
            </ActionItem>
          </ActionList>
        </VmCard.Content>
      </OperationsCard>

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
              options={reasonOptions}
              value={reasonCode}
              isDisabled={isCanceling}
              onChange={setReasonCode}
            />
          </Field>

          <Field>
            <Label htmlFor="invoice-workspace-cancel-note">Nota interna</Label>
            <TextArea
              id="invoice-workspace-cancel-note"
              name="invoice-workspace-cancel-note"
              value={reasonNote}
              rows={3}
              maxLength={280}
              disabled={isCanceling}
              placeholder="Contexto adicional opcional"
              onChange={(event) => setReasonNote(event.target.value)}
            />
          </Field>
        </CancelContent>
      </VmModal>
    </>
  );
};

const OperationsCard = styled(VmCard)`
  min-width: 0;
`;

const ActionList = styled.div`
  display: grid;
  gap: var(--ds-space-3);
`;

const ActionItem = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--ds-space-3);
  align-items: center;
  padding: var(--ds-space-3);
  background: var(--ds-color-bg-subtle);
  border: 1px solid var(--ds-color-border-subtle);
  border-radius: var(--ds-radius-lg);

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const ActionCopy = styled.div`
  display: grid;
  min-width: 0;
  gap: var(--ds-space-1);
`;

const ActionTitle = styled.strong`
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
`;

const ActionDescription = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);
`;

const ActionMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  justify-content: flex-end;

  @media (max-width: 640px) {
    justify-content: flex-start;
  }
`;

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
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
  text-transform: uppercase;
`;

const controlStyles = `
  width: 100%;
  min-width: 0;
  padding: var(--ds-space-2);
  color: var(--ds-color-text-primary);
  font: inherit;
  font-size: var(--ds-font-size-sm);
  background: var(--ds-color-bg-surface);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);

  &:disabled {
    color: var(--ds-color-text-disabled);
    cursor: not-allowed;
    background: var(--ds-color-bg-subtle);
  }
`;

const TextArea = styled(VmTextArea)`
  ${controlStyles}
  resize: vertical;
`;
