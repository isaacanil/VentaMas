import { useMemo, useState } from 'react';
import styled from 'styled-components';

import {
  VmButton,
  VmCard,
  VmChip,
  VmInput,
  VmModal,
} from '@/components/heroui';
import { useFbGetClients } from '@/firebase/client/useFbGetClients';
import type { DiscountType, InvoiceClient, InvoiceData } from '@/types/invoice';
import type { UserIdentity } from '@/types/users';
import { getInvoicePaymentInfo } from '@/utils/invoice';
import { resolveElectronicTaxReceiptSnapshot } from '@/utils/invoice/electronicTaxReceipt';
import { useInvoiceWorkspaceDraftEditor } from '../hooks/useInvoiceWorkspaceDraftEditor';
import {
  formatWorkspaceAmount,
  formatWorkspaceDate,
} from '../utils/invoiceWorkspaceFormat';
import {
  updateWorkspaceDraftClient,
  updateWorkspaceDraftDiscount,
  type InvoiceWorkspaceEditState,
} from '../utils/invoiceWorkspaceEdit';
import { InvoiceWorkspaceSelect } from './InvoiceWorkspaceSelect';

interface InvoiceWorkspaceOverviewProps {
  editState: InvoiceWorkspaceEditState;
  invoice: InvoiceData;
  isEditing?: boolean;
  onSaved: (invoice: InvoiceData) => void;
  user: UserIdentity | null;
}

type ClientRecord = {
  client?: InvoiceClient | null;
};

type PendingHighDiscount = {
  type: DiscountType;
  value: number;
};

const DISCOUNT_TYPE_OPTIONS = [
  { label: 'Porcentaje', value: 'percentage' },
  { label: 'Monto fijo', value: 'fixed' },
];

const resolveClientName = (invoice: InvoiceData) =>
  invoice.client?.name || 'Cliente genérico';

const parseAmount = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const InvoiceWorkspaceOverview = ({
  editState,
  invoice,
  isEditing = false,
  onSaved,
  user,
}: InvoiceWorkspaceOverviewProps) => {
  const [pendingHighDiscount, setPendingHighDiscount] =
    useState<PendingHighDiscount | null>(null);
  const { clients } = useFbGetClients();
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
    successMessage: 'Resumen de factura actualizado',
    user,
  });
  const visibleInvoice = isEditing ? draft : invoice;
  const visiblePaymentInfo = getInvoicePaymentInfo(visibleInvoice);
  const electronic = resolveElectronicTaxReceiptSnapshot(visibleInvoice);
  const total = visibleInvoice.totalPurchase?.value ?? 0;
  const taxes = visibleInvoice.totalTaxes?.value ?? 0;
  const subtotal = visibleInvoice.totalPurchaseWithoutTaxes?.value ?? 0;
  const items =
    visibleInvoice.totalShoppingItems?.value ??
    visibleInvoice.products?.length ??
    0;
  const client = visibleInvoice.client;

  const clientOptions = useMemo(() => {
    const records = Array.isArray(clients) ? (clients as ClientRecord[]) : [];
    return records
      .map((record) => record.client)
      .filter((item): item is InvoiceClient => Boolean(item?.id));
  }, [clients]);
  const clientSelectOptions = useMemo(
    () => [
      { label: 'Cliente genérico', value: '' },
      ...clientOptions.map((item) => ({
        label: item.name || item.personalID || item.rnc || 'Cliente',
        value: String(item.id),
      })),
    ],
    [clientOptions],
  );
  const selectedClientId =
    draft.client?.id === undefined || draft.client?.id === null
      ? ''
      : String(draft.client.id);

  const handleClientChange = (value: string) => {
    if (!canEditDirectly) return;
    if (!value) {
      setDraft((current) => updateWorkspaceDraftClient(current, {}));
      return;
    }

    const selectedClient = clientOptions.find(
      (item) => String(item.id) === value,
    );
    if (selectedClient) {
      setDraft((current) =>
        updateWorkspaceDraftClient(current, selectedClient),
      );
    }
  };

  const handleDiscountTypeChange = (value: string) => {
    if (!canEditDirectly) return;
    const type: DiscountType = value === 'fixed' ? 'fixed' : 'percentage';
    setDraft((current) =>
      updateWorkspaceDraftDiscount(
        current,
        Number(current.discount?.value) || 0,
        type,
      ),
    );
  };

  const handleDiscountValueChange = (value: string) => {
    if (!canEditDirectly) return;
    const discountType: DiscountType =
      draft.discount?.type === 'fixed' ? 'fixed' : 'percentage';
    const previousValue = Number(draft.discount?.value) || 0;
    const maxValue =
      discountType === 'percentage'
        ? 99
        : Number(draft.totalPurchaseWithoutTaxes?.value ?? 0);
    const nextValue = Math.min(Math.max(parseAmount(value), 0), maxValue);

    if (
      discountType === 'percentage' &&
      nextValue > 90 &&
      nextValue !== previousValue
    ) {
      setPendingHighDiscount({
        type: discountType,
        value: nextValue,
      });
      return;
    }

    setDraft((current) =>
      updateWorkspaceDraftDiscount(current, nextValue, discountType),
    );
  };

  const handleConfirmHighDiscount = () => {
    if (!pendingHighDiscount) return;

    const discount = pendingHighDiscount;
    setDraft((current) =>
      updateWorkspaceDraftDiscount(current, discount.value, discount.type),
    );
    setPendingHighDiscount(null);
  };

  return (
    <>
      <OverviewGrid>
        <SectionCard>
          <VmCard.Header>
            <HeaderContent>
              <div>
                <VmCard.Title>Cliente</VmCard.Title>
                <VmCard.Description>
                  {resolveClientName(visibleInvoice)}
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
            {isEditing ? (
              <FieldBlock>
                <InvoiceWorkspaceSelect
                  ariaLabel="Cliente"
                  label="Cliente"
                  name="invoice-workspace-overview-client"
                  options={clientSelectOptions}
                  value={selectedClientId}
                  isDisabled={!canEditDirectly}
                  onChange={handleClientChange}
                />
              </FieldBlock>
            ) : null}
            <InfoGrid>
              <InfoPair>
                <span>RNC / Cédula</span>
                <strong>{client?.rnc || client?.personalID || 'N/D'}</strong>
              </InfoPair>
              <InfoPair>
                <span>Teléfono</span>
                <strong>{client?.tel || client?.tel2 || 'N/D'}</strong>
              </InfoPair>
              <InfoPair>
                <span>Dirección</span>
                <strong>{client?.address || 'N/D'}</strong>
              </InfoPair>
            </InfoGrid>
          </VmCard.Content>
        </SectionCard>

        <SectionCard>
          <VmCard.Header>
            <VmCard.Title>Totales</VmCard.Title>
            <VmCard.Description>{items} artículos vendidos</VmCard.Description>
          </VmCard.Header>
          <VmCard.Content>
            {isEditing ? (
              <DiscountGrid>
                <FieldBlock>
                  <InvoiceWorkspaceSelect
                    ariaLabel="Tipo descuento"
                    label="Tipo descuento"
                    name="invoice-workspace-overview-discount-type"
                    options={DISCOUNT_TYPE_OPTIONS}
                    value={draft.discount?.type || 'percentage'}
                    isDisabled={!canEditDirectly}
                    onChange={handleDiscountTypeChange}
                  />
                </FieldBlock>
                <FieldBlock>
                  <FieldLabel htmlFor="invoice-workspace-overview-discount-value">
                    Descuento
                  </FieldLabel>
                  <TextInput
                    id="invoice-workspace-overview-discount-value"
                    name="invoice-workspace-overview-discount-value"
                    type="number"
                    min="0"
                    step="0.01"
                    value={Number(draft.discount?.value ?? 0)}
                    disabled={!canEditDirectly}
                    onChange={(event) =>
                      handleDiscountValueChange(event.target.value)
                    }
                  />
                </FieldBlock>
              </DiscountGrid>
            ) : null}
            <InfoGrid>
              <InfoPair>
                <span>Subtotal</span>
                <strong>
                  {formatWorkspaceAmount(subtotal, visibleInvoice)}
                </strong>
              </InfoPair>
              <InfoPair>
                <span>Descuento</span>
                <strong>
                  {Number(visibleInvoice.discount?.value ?? 0)}
                  {visibleInvoice.discount?.type === 'fixed' ? '' : '%'}
                </strong>
              </InfoPair>
              <InfoPair>
                <span>ITBIS</span>
                <strong>{formatWorkspaceAmount(taxes, visibleInvoice)}</strong>
              </InfoPair>
              <InfoPair>
                <span>Total</span>
                <strong>{formatWorkspaceAmount(total, visibleInvoice)}</strong>
              </InfoPair>
              <InfoPair>
                <span>Pagado</span>
                <strong>
                  {formatWorkspaceAmount(
                    visiblePaymentInfo.paid,
                    visibleInvoice,
                  )}
                </strong>
              </InfoPair>
              <InfoPair>
                <span>Pendiente</span>
                <strong>
                  {formatWorkspaceAmount(
                    visiblePaymentInfo.pending,
                    visibleInvoice,
                  )}
                </strong>
              </InfoPair>
            </InfoGrid>
          </VmCard.Content>
        </SectionCard>

        <SectionCard>
          <VmCard.Header>
            <VmCard.Title>Documento</VmCard.Title>
            <VmCard.Description>
              {formatWorkspaceDate(visibleInvoice)}
            </VmCard.Description>
          </VmCard.Header>
          <VmCard.Content>
            <InfoGrid>
              <InfoPair>
                <span>Origen</span>
                <strong>{visibleInvoice.sourceOfPurchase || 'N/D'}</strong>
              </InfoPair>
              <InfoPair>
                <span>Formato</span>
                <strong>
                  {visibleInvoice.documentFormat ||
                    visibleInvoice.fiscalMode ||
                    'N/D'}
                </strong>
              </InfoPair>
              <InfoPair>
                <span>e-CF</span>
                <strong>
                  {electronic ? electronic.eNcf || 'Pendiente' : 'No aplica'}
                </strong>
              </InfoPair>
              <InfoPair>
                <span>Estado interno</span>
                <strong>{visibleInvoice.status || 'N/D'}</strong>
              </InfoPair>
            </InfoGrid>
          </VmCard.Content>
        </SectionCard>
      </OverviewGrid>

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
              <span>Total</span>
              <strong>{formatWorkspaceAmount(total, visibleInvoice)}</strong>
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
                Guardar resumen
              </VmButton>
            </FooterActions>
          </EditFooter>
        </EditFooterCard>
      ) : null}

      <VmModal
        ariaLabel="Confirmar descuento alto"
        isOpen={Boolean(pendingHighDiscount)}
        onOpenChange={(open) => {
          if (!open) setPendingHighDiscount(null);
        }}
        size="sm"
        title="Confirmar descuento alto"
        footer={
          <>
            <VmButton
              variant="secondary"
              onPress={() => setPendingHighDiscount(null)}
            >
              Cancelar
            </VmButton>
            <VmButton variant="primary" onPress={handleConfirmHighDiscount}>
              Aplicar descuento
            </VmButton>
          </>
        }
      >
        <HighDiscountContent>
          <HighDiscountWarning>
            <strong>Descuento superior al 90%</strong>
            <span>
              Este descuento reduce drásticamente el total de la factura.
              Confirma que el ajuste es intencional antes de guardarlo.
            </span>
          </HighDiscountWarning>
          <DiscountPreview>
            <span>Descuento solicitado</span>
            <strong>{pendingHighDiscount?.value ?? 0}%</strong>
          </DiscountPreview>
        </HighDiscountContent>
      </VmModal>
      {authorizationModal}
    </>
  );
};

const OverviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
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

const FieldBlock = styled.div`
  display: grid;
  gap: var(--ds-space-1);
  min-width: 0;
  margin-bottom: var(--ds-space-3);
`;

const FieldLabel = styled.label`
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
  text-transform: uppercase;
`;

const TextInput = styled(VmInput)`
  width: 100%;
  min-width: 0;
  height: 32px;
`;

const DiscountGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--ds-space-3);
`;

const InfoGrid = styled.div`
  display: grid;
  gap: var(--ds-space-3);
`;

const InfoPair = styled.div`
  display: grid;
  min-width: 0;
  gap: 2px;

  span {
    color: var(--ds-color-text-muted);
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-medium);
    text-transform: uppercase;
  }

  strong {
    overflow: hidden;
    color: var(--ds-color-text-primary);
    font-size: var(--ds-font-size-sm);
    font-weight: var(--ds-font-weight-semibold);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
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

const HighDiscountContent = styled.div`
  display: grid;
  gap: var(--ds-space-3);
`;

const HighDiscountWarning = styled.div`
  display: grid;
  gap: var(--ds-space-1);

  strong {
    color: var(--ds-color-text-primary);
  }

  span {
    color: var(--ds-color-text-secondary);
    font-size: var(--ds-font-size-sm);
  }
`;

const DiscountPreview = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--ds-space-3);
  background: var(--ds-color-bg-subtle);
  border: 1px solid var(--ds-color-border-subtle);
  border-radius: var(--ds-radius-lg);
`;
