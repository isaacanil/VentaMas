import styled from 'styled-components';

import {
  VmButton,
  VmCard,
  VmCheckbox,
  VmChip,
  VmInput,
} from '@/components/heroui';
import type { InvoiceData, InvoicePaymentMethod } from '@/types/invoice';
import type { UserIdentity } from '@/types/users';
import { getInvoicePaymentInfo } from '@/utils/invoice';
import { useInvoiceWorkspaceDraftEditor } from '../hooks/useInvoiceWorkspaceDraftEditor';
import { formatWorkspaceAmount } from '../utils/invoiceWorkspaceFormat';
import {
  updateWorkspaceDraftPaymentMethods,
  type InvoiceWorkspaceEditState,
} from '../utils/invoiceWorkspaceEdit';

interface InvoiceWorkspacePaymentsProps {
  editState: InvoiceWorkspaceEditState;
  invoice: InvoiceData;
  isEditing?: boolean;
  onSaved: (invoice: InvoiceData) => void;
  user: UserIdentity | null;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  banktransfer: 'Transferencia',
  card: 'Tarjeta',
  cash: 'Efectivo',
  cheque: 'Cheque',
  check: 'Cheque',
  creditcard: 'Tarjeta',
  creditNote: 'Nota de crédito',
  creditnote: 'Nota de crédito',
  debitcard: 'Tarjeta',
  deposit: 'Depósito',
  deposito: 'Depósito',
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transfer: 'Transferencia',
  transferencia: 'Transferencia',
  transferbank: 'Transferencia',
};

const normalizeLabelKey = (value: unknown) =>
  String(value || '')
    .toLowerCase()
    .replace(/[\s_-]/g, '');

const getPaymentMethodLabel = (method: InvoicePaymentMethod) => {
  const rawLabel = method.name || method.method || 'Pago';
  return PAYMENT_METHOD_LABELS[normalizeLabelKey(rawLabel)] || rawLabel;
};

const parseAmount = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatEditableAmountValue = (value: unknown) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return '0';
  return String(Math.round(parsed * 100) / 100);
};

export const InvoiceWorkspacePayments = ({
  editState,
  invoice,
  isEditing = false,
  onSaved,
  user,
}: InvoiceWorkspacePaymentsProps) => {
  const {
    authorizationModal,
    canEditDirectly,
    draft,
    handleAuthorizedSave,
    handleReset,
    hasChanges,
    isBusy,
    setDraft,
  } = useInvoiceWorkspaceDraftEditor({
    editState,
    invoice,
    isEditing,
    onSaved,
    successMessage: 'Pagos de la factura actualizados',
    user,
  });
  const visibleInvoice = isEditing ? draft : invoice;
  const paymentInfo = getInvoicePaymentInfo(visibleInvoice);
  const paymentMethods = Array.isArray(visibleInvoice.paymentMethod)
    ? visibleInvoice.paymentMethod
    : [];
  const activeMethods = paymentMethods.filter((method) => method.status);

  const updatePaymentMethod = (
    index: number,
    updater: (method: InvoicePaymentMethod) => InvoicePaymentMethod,
  ) => {
    if (!canEditDirectly) return;
    const updatedMethods = paymentMethods.map((method, currentIndex) =>
      currentIndex === index ? updater(method) : method,
    );
    setDraft((current) =>
      updateWorkspaceDraftPaymentMethods(current, updatedMethods),
    );
  };

  const handlePaymentStatusChange = (index: number, status: boolean) => {
    if (!canEditDirectly) return;

    const totalPurchase = Number(draft.totalPurchase?.value ?? 0) || 0;
    const otherTotal = paymentMethods.reduce((sum, method, currentIndex) => {
      if (currentIndex === index || !method.status) return sum;
      return sum + Math.max(0, Number(method.value) || 0);
    }, 0);
    const remaining = Math.max(0, totalPurchase - otherTotal);

    updatePaymentMethod(index, (current) => {
      const currentValue = Number(current.value);
      return {
        ...current,
        status,
        value:
          status && Number.isFinite(currentValue) && currentValue > 0
            ? currentValue
            : status
              ? remaining
              : 0,
      };
    });
  };

  return (
    <>
      <PaymentsGrid>
        <SectionCard>
          <VmCard.Header>
            <HeaderContent>
              <div>
                <VmCard.Title>Estado de pago</VmCard.Title>
                <VmCard.Description>
                  {paymentInfo.isPaidInFull
                    ? 'Pagada completa'
                    : 'Balance pendiente'}
                </VmCard.Description>
              </div>
              {isEditing ? (
                <VmChip
                  color={editState.canEditDirectly ? 'success' : 'warning'}
                  variant="soft"
                >
                  <VmChip.Label>
                    {editState.canEditDirectly ? 'Editable' : 'Solo lectura'}
                  </VmChip.Label>
                </VmChip>
              ) : null}
            </HeaderContent>
          </VmCard.Header>
          <VmCard.Content>
            <SummaryGrid>
              <InfoPair>
                <span>Total</span>
                <strong>
                  {formatWorkspaceAmount(paymentInfo.total, visibleInvoice)}
                </strong>
              </InfoPair>
              <InfoPair>
                <span>Pagado</span>
                <strong>
                  {formatWorkspaceAmount(paymentInfo.paid, visibleInvoice)}
                </strong>
              </InfoPair>
              <InfoPair>
                <span>Pendiente</span>
                <strong>
                  {formatWorkspaceAmount(paymentInfo.pending, visibleInvoice)}
                </strong>
              </InfoPair>
              <InfoPair>
                <span>Cambio</span>
                <strong>
                  {formatWorkspaceAmount(
                    visibleInvoice.change?.value ?? 0,
                    visibleInvoice,
                  )}
                </strong>
              </InfoPair>
            </SummaryGrid>
          </VmCard.Content>
        </SectionCard>

        <SectionCard>
          <VmCard.Header>
            <VmCard.Title>
              {isEditing ? 'Métodos de pago' : 'Métodos usados'}
            </VmCard.Title>
            <VmCard.Description>
              {isEditing
                ? `${paymentMethods.length || 0} configurados`
                : `${activeMethods.length || 0} activos`}
            </VmCard.Description>
          </VmCard.Header>
          <VmCard.Content>
            {isEditing ? (
              paymentMethods.length > 0 ? (
                <PaymentEditorList>
                  {paymentMethods.map((method, index) => {
                    const paymentLabel = getPaymentMethodLabel(method);
                    const paymentStatusId = `invoice-workspace-payment-${index}-active`;
                    const paymentAmountId = `invoice-workspace-payment-${index}-amount`;
                    const paymentReferenceId = `invoice-workspace-payment-${index}-reference`;

                    return (
                      <PaymentEditorRow
                        key={`${method.method || method.name}-${index}`}
                      >
                        <CheckboxLabel
                          aria-label={paymentLabel}
                          isDisabled={!canEditDirectly}
                          isSelected={Boolean(method.status)}
                          name={paymentStatusId}
                          onChange={(selected) =>
                            handlePaymentStatusChange(index, selected)
                          }
                        >
                          <VmCheckbox.Control>
                            <VmCheckbox.Indicator />
                          </VmCheckbox.Control>
                          <span>{paymentLabel}</span>
                        </CheckboxLabel>
                        <TextInput
                          id={paymentAmountId}
                          name={paymentAmountId}
                          type="number"
                          min="0"
                          step="0.01"
                          aria-label={`Monto ${paymentLabel}`}
                          value={formatEditableAmountValue(method.value)}
                          disabled={!canEditDirectly || !method.status}
                          onChange={(event) =>
                            updatePaymentMethod(index, (current) => ({
                              ...current,
                              value: parseAmount(event.target.value),
                            }))
                          }
                        />
                        <TextInput
                          id={paymentReferenceId}
                          name={paymentReferenceId}
                          value={String(method.reference || '')}
                          disabled={!canEditDirectly || !method.status}
                          aria-label={`Referencia ${paymentLabel}`}
                          placeholder="Referencia"
                          onChange={(event) =>
                            updatePaymentMethod(index, (current) => ({
                              ...current,
                              reference: event.target.value,
                            }))
                          }
                        />
                      </PaymentEditorRow>
                    );
                  })}
                </PaymentEditorList>
              ) : (
                <EmptyMessage>No hay métodos de pago registrados.</EmptyMessage>
              )
            ) : activeMethods.length > 0 ? (
              <MethodList>
                {activeMethods.map((method, index) => (
                  <MethodItem
                    key={`${method.method}-${method.reference ?? index}`}
                  >
                    <MethodName>{getPaymentMethodLabel(method)}</MethodName>
                    <MethodAmount>
                      {formatWorkspaceAmount(method.value ?? 0, visibleInvoice)}
                    </MethodAmount>
                    {method.reference ? (
                      <MethodReference>{method.reference}</MethodReference>
                    ) : null}
                  </MethodItem>
                ))}
              </MethodList>
            ) : (
              <EmptyMessage>Sin métodos de pago registrados.</EmptyMessage>
            )}
          </VmCard.Content>
        </SectionCard>
      </PaymentsGrid>

      {isEditing ? (
        <EditFooterCard>
          {!editState.canEditDirectly ? (
            <LockNotice>
              <strong>Esta factura no permite edición directa.</strong>
              <ReasonList>
                {editState.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ReasonList>
            </LockNotice>
          ) : null}
          <EditFooter>
            <SummaryItem>
              <span>Pagado</span>
              <strong>
                {formatWorkspaceAmount(paymentInfo.paid, visibleInvoice)}
              </strong>
            </SummaryItem>
            <FooterActions>
              <VmButton
                variant="secondary"
                onPress={handleReset}
                isDisabled={!hasChanges || isBusy}
              >
                Deshacer cambios
              </VmButton>
              <VmButton
                variant="primary"
                onPress={handleAuthorizedSave}
                isDisabled={!canEditDirectly || !hasChanges || isBusy}
                isPending={isBusy}
              >
                Guardar pago
              </VmButton>
            </FooterActions>
          </EditFooter>
        </EditFooterCard>
      ) : null}
      {authorizationModal}
    </>
  );
};

const PaymentsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--ds-space-3);
`;

const SectionCard = styled(VmCard)`
  min-width: 0;
`;

const HeaderContent = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--ds-space-3);
`;

const InfoPair = styled.div`
  display: grid;
  gap: 2px;

  span {
    color: var(--ds-color-text-muted);
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-medium);
    text-transform: uppercase;
  }

  strong {
    color: var(--ds-color-text-primary);
    font-size: var(--ds-font-size-sm);
    font-weight: var(--ds-font-weight-semibold);
  }
`;

const PaymentEditorList = styled.div`
  display: grid;
  gap: var(--ds-space-2);
`;

const PaymentEditorRow = styled.div`
  display: grid;
  grid-template-columns: minmax(120px, 1fr) minmax(110px, 0.6fr) minmax(
      150px,
      1fr
    );
  gap: var(--ds-space-2);
  align-items: center;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const CheckboxLabel = styled(VmCheckbox)`
  display: inline-flex;
  gap: var(--ds-space-2);
  align-items: center;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
`;

const TextInput = styled(VmInput)`
  width: 100%;
  min-width: 0;
  height: 32px;
`;

const MethodList = styled.div`
  display: grid;
  gap: var(--ds-space-2);
`;

const MethodItem = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--ds-space-1) var(--ds-space-3);
  padding: var(--ds-space-3);
  background: var(--ds-color-bg-subtle);
  border: 1px solid var(--ds-color-border-subtle);
  border-radius: var(--ds-radius-md);
`;

const MethodName = styled.span`
  color: var(--ds-color-text-primary);
  font-weight: var(--ds-font-weight-semibold);
`;

const MethodAmount = styled.strong`
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-mono);
`;

const MethodReference = styled.span`
  grid-column: 1 / -1;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
`;

const EditFooterCard = styled(VmCard)`
  display: grid;
  gap: var(--ds-space-3);
  padding: var(--ds-space-3);
`;

const EditFooter = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-3);
  align-items: center;
  justify-content: space-between;
`;

const SummaryItem = styled.div`
  display: grid;
  gap: 2px;

  span {
    color: var(--ds-color-text-muted);
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-medium);
    text-transform: uppercase;
  }

  strong {
    color: var(--ds-color-text-primary);
    font-size: var(--ds-font-size-sm);
    font-weight: var(--ds-font-weight-semibold);
  }
`;

const FooterActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  justify-content: flex-end;
`;

const LockNotice = styled.div`
  display: grid;
  gap: var(--ds-space-2);
  padding: var(--ds-space-3);
  color: var(--ds-color-text-primary);
  background: var(--ds-color-state-warning-subtle);
  border: 1px solid var(--ds-color-state-warning);
  border-radius: var(--ds-radius-lg);
`;

const ReasonList = styled.ul`
  display: grid;
  gap: var(--ds-space-1);
  padding-left: var(--ds-space-5);
  margin: 0;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
`;

const EmptyMessage = styled.div`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
`;
