import {
  FileTextOutlined,
  PrinterOutlined,
  ProfileOutlined,
  WarningOutlined,
} from '@/constants/icons/antd';
import { useMemo } from 'react';
import styled from 'styled-components';

import { VmButton, VmCard, VmChip } from '@/components/heroui';
import type { InvoiceData } from '@/types/invoice';
import type { getInvoicePaymentInfo } from '@/utils/invoice';
import { resolveFiscalDocumentNumber } from '@/utils/invoice/electronicTaxReceipt';
import {
  formatWorkspaceAmount,
  formatWorkspaceDate,
} from '../utils/invoiceWorkspaceFormat';
import { resolveInvoiceWorkspaceEditWindow } from '../utils/invoiceWorkspaceEdit';

type PaymentInfo = ReturnType<typeof getInvoicePaymentInfo>;

interface InvoiceWorkspaceHeaderProps {
  canOpenAccountingEntry?: boolean;
  currentTimeMs?: number;
  invoice: InvoiceData;
  isEditLocked?: boolean;
  isEditing?: boolean;
  isProcessingEdit?: boolean;
  isProcessingPrint?: boolean;
  onEdit: () => void;
  onOpenAccountingEntry?: () => void;
  onPrint?: () => void;
  paymentInfo: PaymentInfo;
}

export const InvoiceWorkspaceHeader = ({
  canOpenAccountingEntry = false,
  currentTimeMs = Date.now(),
  invoice,
  isEditLocked = false,
  isEditing = false,
  isProcessingEdit = false,
  isProcessingPrint = false,
  onEdit,
  onOpenAccountingEntry,
  onPrint,
  paymentInfo,
}: InvoiceWorkspaceHeaderProps) => {
  const rawInvoiceNumber = invoice.numberID ?? invoice.number;
  const invoiceNumber =
    typeof rawInvoiceNumber === 'string' || typeof rawInvoiceNumber === 'number'
      ? rawInvoiceNumber
      : 'N/D';
  const fiscalNumber = resolveFiscalDocumentNumber(invoice) || 'Sin NCF';
  const total = formatWorkspaceAmount(
    invoice.totalPurchase?.value ?? 0,
    invoice,
  );
  const paymentLabel = paymentInfo.isPaidInFull ? 'Pagada' : 'Pago pendiente';
  const editWindow = useMemo(
    () => resolveInvoiceWorkspaceEditWindow(invoice, currentTimeMs),
    [invoice, currentTimeMs],
  );
  const editWindowExpiresAt = editWindow.expiresAtMs
    ? new Intl.DateTimeFormat('es-DO', {
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        month: '2-digit',
      }).format(new Date(editWindow.expiresAtMs))
    : null;

  return (
    <HeaderCard>
      <HeaderMain>
        <DocumentIcon>
          <FileTextOutlined />
        </DocumentIcon>
        <TitleBlock>
          <TitleLine>
            <Title>Factura #{invoiceNumber}</Title>
            <VmChip
              color={paymentInfo.isPaidInFull ? 'success' : 'warning'}
              variant="soft"
            >
              <VmChip.Label>{paymentLabel}</VmChip.Label>
            </VmChip>
            {isEditLocked ? (
              <VmChip color="warning" variant="soft">
                <VmChip.Label>Solo lectura</VmChip.Label>
              </VmChip>
            ) : editWindow.isOpen ? (
              <VmChip color="success" variant="soft">
                <VmChip.Label>Editable {editWindow.label}</VmChip.Label>
              </VmChip>
            ) : null}
          </TitleLine>
          <Subtitle>{fiscalNumber}</Subtitle>
        </TitleBlock>
      </HeaderMain>

      <HeaderStats>
        <Stat>
          <span>Total</span>
          <strong>{total}</strong>
        </Stat>
        <Stat>
          <span>Fecha</span>
          <strong>{formatWorkspaceDate(invoice)}</strong>
        </Stat>
        {!isEditLocked && editWindow.isOpen ? (
          <Stat>
            <span>Ventana edición</span>
            <strong title={editWindowExpiresAt || undefined}>
              {editWindow.label}
              {editWindowExpiresAt ? ` · hasta ${editWindowExpiresAt}` : ''}
            </strong>
          </Stat>
        ) : null}
      </HeaderStats>

      <HeaderActions>
        {canOpenAccountingEntry ? (
          <VmButton
            size="sm"
            variant="secondary"
            onPress={onOpenAccountingEntry}
          >
            <ProfileOutlined />
            Ver asiento
          </VmButton>
        ) : null}
        {onPrint ? (
          <VmButton
            size="sm"
            variant="secondary"
            onPress={onPrint}
            isDisabled={isProcessingPrint}
            isPending={isProcessingPrint}
          >
            <PrinterOutlined />
            Imprimir
          </VmButton>
        ) : null}
        <VmButton
          size="sm"
          variant={isEditing ? 'secondary' : 'primary'}
          onPress={onEdit}
          isDisabled={isProcessingEdit}
          isPending={isProcessingEdit}
        >
          {isEditLocked && !isEditing ? <WarningOutlined /> : null}
          {isEditing ? 'Finalizar edición' : 'Activar edición'}
        </VmButton>
      </HeaderActions>
    </HeaderCard>
  );
};

const HeaderCard = styled(VmCard)`
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(220px, 0.8fr) auto;
  gap: var(--ds-space-4);
  align-items: center;
  padding: var(--ds-space-4);

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const HeaderMain = styled.div`
  display: flex;
  gap: var(--ds-space-3);
  align-items: center;
  min-width: 0;
`;

const DocumentIcon = styled.div`
  display: grid;
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  color: var(--ds-color-action-on-primary-subtle);
  place-items: center;
  background: var(--ds-color-action-primary-subtle);
  border-radius: var(--ds-radius-lg);
`;

const TitleBlock = styled.div`
  display: grid;
  min-width: 0;
  gap: var(--ds-space-1);
`;

const TitleLine = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  align-items: center;
`;

const Title = styled.h2`
  margin: 0;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-lg);
  font-weight: var(--ds-font-weight-semibold);
  line-height: var(--ds-line-height-tight);
`;

const Subtitle = styled.span`
  overflow: hidden;
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-family-mono);
  font-size: var(--ds-font-size-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const HeaderStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--ds-space-3);
  min-width: 0;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const Stat = styled.div`
  display: grid;
  gap: var(--ds-space-1);
  min-width: 0;

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

const HeaderActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  justify-content: flex-end;

  @media (max-width: 900px) {
    justify-content: flex-start;
  }
`;
