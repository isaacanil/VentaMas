import { Button, Modal as AntdModal, Select } from 'antd';
import { useMemo } from 'react';
import styled from 'styled-components';

import type { AutoCompleteModalState } from '../utils/paymentFormTypes';
import type { TaxReceiptItem } from '@/types/taxReceipt';
import { formatPrice } from '@/utils/format';

type AutoCompleteResultModalProps = {
  open: boolean;
  state: AutoCompleteModalState | null;
  clientName?: string;
  onClose: () => void;
  onPreview: () => void;
  onPrint: () => void;
  taxReceipts?: TaxReceiptItem[];
  currentReceipt?: string | null;
  selectedReceipt?: string | null;
  onSelectReceipt?: (value: string) => void;
  retryLoading?: boolean;
  onRetryWithReceipt?: (receiptType: string) => void | Promise<void>;
};

const EMPTY_TAX_RECEIPTS: TaxReceiptItem[] = [];

export const AutoCompleteResultModal = ({
  open,
  state,
  clientName,
  onClose,
  onPreview,
  onPrint,
  taxReceipts = EMPTY_TAX_RECEIPTS,
  currentReceipt = null,
  selectedReceipt = null,
  onSelectReceipt,
  retryLoading = false,
  onRetryWithReceipt,
}: AutoCompleteResultModalProps) => {
  const isNcfUnavailable = state?.errorCode === 'ncf-unavailable';

  const options = useMemo(() => {
    return (taxReceipts || [])
      .map((receipt) =>
        typeof receipt === 'object' && receipt && 'data' in receipt
          ? receipt.data
          : receipt,
      )
      .filter(
        (receipt) =>
          Boolean(receipt?.name) &&
          !receipt?.disabled &&
          !isCreditNoteReceipt(
            receipt?.name,
            (receipt as { serie?: unknown; series?: unknown }).serie ??
              (receipt as { serie?: unknown; series?: unknown }).series,
          ),
      )
      .map((receipt) => {
        const rawQuantity = Number(receipt?.quantity ?? 0);
        const rawIncrease = Number(receipt?.increase ?? 1);
        const safeIncrease =
          Number.isFinite(rawIncrease) && rawIncrease > 0 ? rawIncrease : 1;
        const remaining = Number.isFinite(rawQuantity)
          ? Math.max(0, Math.floor(rawQuantity / safeIncrease))
          : 0;

        return {
          label: String(receipt?.name),
          value: String(receipt?.name),
          remaining,
        };
      })
      .filter((option) => option.remaining > 0);
  }, [taxReceipts]);

  const effectiveSelection =
    selectedReceipt ||
    currentReceipt ||
    options.find((option) => option.value === currentReceipt)?.value ||
    options[0]?.value ||
    null;

  return (
    <AntdModal
      open={open}
      zIndex={2100}
      title={
        state?.success
          ? 'Preventa convertida en factura'
          : isNcfUnavailable
            ? 'Comprobante fiscal agotado'
            : 'No se pudo convertir la preventa'
      }
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Cerrar
        </Button>,
        ...(isNcfUnavailable
          ? [
              <Button
                key="retry"
                type="primary"
                onClick={() => {
                  if (!effectiveSelection || !onRetryWithReceipt) return;
                  void onRetryWithReceipt(effectiveSelection);
                }}
                disabled={!effectiveSelection}
                loading={retryLoading}
              >
                Reintentar con comprobante
              </Button>,
            ]
          : []),
        <Button key="preview" onClick={onPreview} disabled={!state?.invoice}>
          Ver factura
        </Button>,
        <Button
          key="print"
          type="primary"
          onClick={onPrint}
          disabled={!state?.invoice}
        >
          Imprimir factura
        </Button>,
      ]}
    >
      <AutoCompleteInfo>
        <InfoRow>
          <InfoLabel>Cliente</InfoLabel>
          <InfoValue>{clientName || 'N/A'}</InfoValue>
        </InfoRow>
        <InfoRow>
          <InfoLabel>No. cuenta por cobrar</InfoLabel>
          <InfoValue>{state?.arNumber ? `#${state.arNumber}` : 'N/A'}</InfoValue>
        </InfoRow>
        <InfoRow>
          <InfoLabel>{state?.sourceDocumentLabel || 'Documento origen'}</InfoLabel>
          <InfoValue>
            {state?.sourceDocumentNumber
              ? `#${state.sourceDocumentNumber}`
              : `#${state?.preorderId || 'N/A'}`}
          </InfoValue>
        </InfoRow>
        <InfoRow>
          <InfoLabel>No. factura generada</InfoLabel>
          <InfoValue>
            {state?.invoiceNumber
              ? `#${state.invoiceNumber}`
              : state?.invoiceId || 'N/A'}
          </InfoValue>
        </InfoRow>
        <InfoRow>
          <InfoLabel>NCF</InfoLabel>
          <InfoValue>{state?.invoiceNcf || 'N/A'}</InfoValue>
        </InfoRow>
        <InfoRow>
          <InfoLabel>Total pagado</InfoLabel>
          <InfoValue>{formatPrice(state?.paidAmount || 0)}</InfoValue>
        </InfoRow>
        {!state?.success && isNcfUnavailable && (
          <AutoCompleteWarning>
            Selecciona otro tipo de comprobante para finalizar la factura de
            esta preventa.
          </AutoCompleteWarning>
        )}
        {!state?.success && isNcfUnavailable && options.length > 0 && (
          <ReceiptSelectorWrapper>
            <Select
              value={effectiveSelection ?? undefined}
              onChange={(value) => onSelectReceipt?.(value)}
              placeholder="Selecciona un comprobante"
              options={options.map((option) => ({
                value: option.value,
                label: `${option.label} (Disponibles: ${option.remaining})`,
              }))}
              style={{ width: '100%' }}
              showSearch
              optionFilterProp="label"
              disabled={retryLoading}
            />
          </ReceiptSelectorWrapper>
        )}
        {!state?.success && state?.error && (
          <AutoCompleteError>{state.error}</AutoCompleteError>
        )}
      </AutoCompleteInfo>
    </AntdModal>
  );
};

const isCreditNoteReceipt = (
  name: string | null | undefined,
  serie: string | number | null | undefined,
) => {
  const normalizedName = (name || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
  const normalizedSerie = String(serie ?? '').padStart(2, '0');

  const containsNota = normalizedName.includes('nota');
  const containsCredito = normalizedName.includes('credito');
  const isCreditNoteBySerie = normalizedSerie === '04';
  const isCreditNoteByName = containsNota && containsCredito;

  return isCreditNoteBySerie || isCreditNoteByName;
};

const AutoCompleteInfo = styled.div`
  display: grid;
  gap: 10px;
`;

const InfoRow = styled.div`
  display: grid;
  grid-template-columns: minmax(180px, 220px) 1fr;
  gap: 12px;
`;

const InfoLabel = styled.span`
  color: #555;
  font-weight: 600;
`;

const InfoValue = styled.span`
  color: #111;
  font-weight: 500;
`;

const AutoCompleteError = styled.div`
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #fff1f0;
  color: #cf1322;
  border: 1px solid #ffa39e;
`;

const AutoCompleteWarning = styled.div`
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #fffbe6;
  color: #ad6800;
  border: 1px solid #ffe58f;
`;

const ReceiptSelectorWrapper = styled.div`
  margin-top: 4px;
`;
