import {
  FileTextOutlined,
  PrinterOutlined,
  ProfileOutlined,
  WarningOutlined,
  DownOutlined,
  EditOutlined,
  DeleteOutlined,
  SyncOutlined,
} from '@/constants/icons/antd';
import { useMemo } from 'react';
import styled from 'styled-components';

import { VmButton, VmCard, VmChip, VmDropdown } from '@/components/heroui';
import type { InvoiceData } from '@/types/invoice';
import type { getInvoicePaymentInfo } from '@/utils/invoice';
import { resolveFiscalDocumentNumber } from '@/modules/invoice/utils/electronicTaxReceipt';
import {
  formatWorkspaceAmount,
  formatWorkspaceDate,
} from '../utils/invoiceWorkspaceFormat';
import { resolveInvoiceWorkspaceEditWindow } from '../utils/invoiceWorkspaceEdit';

type PaymentInfo = ReturnType<typeof getInvoicePaymentInfo>;

interface InvoiceWorkspaceHeaderProps {
  canOpenAccountingEntry?: boolean;
  currentTimeMs: number;
  invoice: InvoiceData;
  isEditLocked?: boolean;
  isEditing?: boolean;
  isProcessingEdit?: boolean;
  isProcessingPrint?: boolean;
  onEdit: () => void;
  onOpenAccountingEntry?: () => void;
  onPrint?: () => void;
  paymentInfo: PaymentInfo;

  // Operational actions
  hasAccountsReceivable?: boolean;
  isSyncingReceivables?: boolean;
  onSyncReceivablePayments?: () => void;
  voidState?: { canVoid: boolean; label: string; reason: string };
  onOpenCancelModal?: () => void;
}

export const InvoiceWorkspaceHeader = ({
  canOpenAccountingEntry = false,
  currentTimeMs,
  invoice,
  isEditLocked = false,
  isEditing = false,
  isProcessingEdit = false,
  isProcessingPrint = false,
  onEdit,
  onOpenAccountingEntry,
  onPrint,
  paymentInfo,

  // Operational actions
  hasAccountsReceivable = false,
  isSyncingReceivables = false,
  onSyncReceivablePayments,
  voidState,
  onOpenCancelModal,
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
  const runAction = (key: string) => {
    if (key === 'edit') onEdit();
    if (key === 'print') onPrint?.();
    if (key === 'accounting') onOpenAccountingEntry?.();
    if (key === 'sync-cxc') onSyncReceivablePayments?.();
    if (key === 'void') onOpenCancelModal?.();
  };

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

      <HeaderSide>
        <HeaderStats>
          <StatBlock>
            <TotalText>{total}</TotalText>
            <DateText>{formatWorkspaceDate(invoice)}</DateText>
          </StatBlock>
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
          <DesktopActionBar aria-label="Acciones de factura">
            <VmButton
              size="sm"
              variant={isEditing ? 'secondary' : 'primary'}
              onPress={onEdit}
              isDisabled={isProcessingEdit}
              isPending={isProcessingEdit}
            >
              {isEditLocked && !isEditing ? <WarningOutlined /> : <EditOutlined />}
              {isEditing ? 'Finalizar' : 'Editar'}
            </VmButton>

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

            {canOpenAccountingEntry ? (
              <VmButton
                size="sm"
                variant="secondary"
                onPress={onOpenAccountingEntry}
              >
                <ProfileOutlined />
                Asiento
              </VmButton>
            ) : null}

            <VmButton
              size="sm"
              variant="secondary"
              onPress={onSyncReceivablePayments}
              isDisabled={isSyncingReceivables || !hasAccountsReceivable}
              isPending={isSyncingReceivables}
            >
              <SyncOutlined />
              CxC
            </VmButton>

            <span
              title={!voidState?.canVoid ? voidState?.reason : undefined}
              className="inline-flex"
            >
              <VoidButton
                size="sm"
                variant="secondary"
                onPress={onOpenCancelModal}
                isDisabled={!voidState?.canVoid}
              >
                <DeleteOutlined />
                Anular
              </VoidButton>
            </span>
          </DesktopActionBar>

          <MobileActionMenu>
            <VmDropdown>
              <VmDropdown.Button size="sm" aria-label="Acciones de factura">
                Acciones <DownOutlined />
              </VmDropdown.Button>
              <VmDropdown.Popover placement="bottom end">
                <VmDropdown.Menu
                  aria-label="Acciones de factura"
                  onAction={(key) => runAction(String(key))}
                >
                  <VmDropdown.Item
                    id="edit"
                    textValue={
                      isEditing ? 'Finalizar edición' : 'Activar edición'
                    }
                    isDisabled={isProcessingEdit}
                  >
                    <div className="flex items-center gap-2">
                      {isEditLocked && !isEditing ? (
                        <WarningOutlined />
                      ) : (
                        <EditOutlined />
                      )}
                      <span>
                        {isEditing ? 'Finalizar edición' : 'Activar edición'}
                      </span>
                    </div>
                  </VmDropdown.Item>

                  {onPrint ? (
                    <VmDropdown.Item
                      id="print"
                      textValue="Imprimir"
                      isDisabled={isProcessingPrint}
                    >
                      <div className="flex items-center gap-2">
                        <PrinterOutlined
                          className={isProcessingPrint ? 'animate-spin' : ''}
                        />
                        <span>Imprimir</span>
                      </div>
                    </VmDropdown.Item>
                  ) : null}

                  {canOpenAccountingEntry ? (
                    <VmDropdown.Item id="accounting" textValue="Ver asiento">
                      <div className="flex items-center gap-2">
                        <ProfileOutlined />
                        <span>Ver asiento</span>
                      </div>
                    </VmDropdown.Item>
                  ) : null}

                <VmDropdown.Item
                  id="sync-cxc"
                  textValue="Sincronizar CxC"
                  isDisabled={isSyncingReceivables || !hasAccountsReceivable}
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <SyncOutlined
                        className={isSyncingReceivables ? 'animate-spin' : ''}
                      />
                      <span>Sincronizar CxC</span>
                    </div>
                    {!hasAccountsReceivable ? (
                      <span className="text-xs text-neutral-400 pl-6">
                        Sin CxC asociadas
                      </span>
                    ) : null}
                  </div>
                </VmDropdown.Item>

                  <VmDropdown.Item
                    id="void"
                    textValue="Anular factura"
                    isDisabled={!voidState?.canVoid}
                    className={
                      voidState?.canVoid
                        ? 'text-[var(--ds-color-state-danger-text)]'
                        : ''
                    }
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <DeleteOutlined />
                        <span>Anular factura</span>
                      </div>
                      {!voidState?.canVoid && voidState?.reason ? (
                        <span className="text-xs text-neutral-400 pl-6 max-w-64 whitespace-normal leading-tight">
                          {voidState.reason}
                        </span>
                      ) : null}
                    </div>
                  </VmDropdown.Item>
                </VmDropdown.Menu>
              </VmDropdown.Popover>
            </VmDropdown>
          </MobileActionMenu>
        </HeaderActions>
      </HeaderSide>
    </HeaderCard>
  );
};

const HeaderCard = styled(VmCard)`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
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

const HeaderSide = styled.div`
  display: grid;
  gap: var(--ds-space-2);
  justify-items: end;
  min-width: 220px;

  @media (max-width: 900px) {
    justify-items: start;
    min-width: 0;
  }
`;

const HeaderStats = styled.div`
  display: grid;
  justify-items: end;
  gap: var(--ds-space-3);
  min-width: 0;
  text-align: right;

  @media (max-width: 900px) {
    justify-items: start;
    text-align: left;
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

const StatBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-0.5);
  min-width: 0;
`;

const TotalText = styled.span`
  overflow: hidden;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-lg);
  font-weight: var(--ds-font-weight-semibold);
  line-height: var(--ds-line-height-tight);
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const DateText = styled.span`
  overflow: hidden;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
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

const DesktopActionBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  justify-content: flex-end;

  @media (max-width: 760px) {
    display: none;
  }
`;

const MobileActionMenu = styled.div`
  display: none;

  @media (max-width: 760px) {
    display: block;
  }
`;

const VoidButton = styled(VmButton)`
  color: var(--ds-color-state-danger-text);
`;
