import { Alert, Tag } from 'antd';
import React from 'react';
import styled from 'styled-components';

import { AdjustmentNoteFiscalStatusTag } from '@/modules/invoice/components/AdjustmentNoteFiscalStatusTag';
import { resolveCreditNoteUsageStatusDisplay } from '@/modules/invoice/utils/adjustmentNoteStatusDisplay';

import ClientSelector from './ClientSelector';
import { CreditNoteFiscalReasonSection } from './CreditNoteFiscalReasonSection';
import InvoiceSelector from './InvoiceSelector';

import type { CreditNoteRecord } from '@/types/creditNote';
import type { InvoiceClient, InvoiceData } from '@/types/invoice';
import type { DatePickerRangeValue } from '@/components/common/DatePicker';

type InvoiceWithNcf = InvoiceData & { ncf?: string };

interface CreditNoteSetupSectionProps {
  canUseCreditNotes: boolean;
  taxReceiptEnabled: boolean;
  effectiveIsView: boolean;
  effectiveIsEdit: boolean;
  creditNoteData: CreditNoteRecord | null;
  mode: 'create' | 'edit' | 'view';
  clients: InvoiceClient[];
  currentClient?: InvoiceClient | null;
  onSelectClient: (client: InvoiceClient | null) => void;
  clientsLoading: boolean;
  invoices: InvoiceWithNcf[];
  currentInvoice?: InvoiceWithNcf | null;
  onSelectInvoice: (invoice: InvoiceWithNcf | null) => void;
  invoicesLoading: boolean;
  selectedClientId: string | number | null;
  dateRange: DatePickerRangeValue;
  onDateRangeChange: (range: DatePickerRangeValue) => void;
  reason: string;
  modificationCode: string;
  totalAmount: number;
  onReasonChange: (value: string) => void;
  onModificationCodeChange: (value: string) => void;
}

export const CreditNoteSetupSection = ({
  canUseCreditNotes,
  taxReceiptEnabled,
  effectiveIsView,
  effectiveIsEdit,
  creditNoteData,
  mode,
  clients,
  currentClient,
  onSelectClient,
  clientsLoading,
  invoices,
  currentInvoice,
  onSelectInvoice,
  invoicesLoading,
  selectedClientId,
  dateRange,
  onDateRangeChange,
  reason,
  modificationCode,
  totalAmount,
  onReasonChange,
  onModificationCodeChange,
}: CreditNoteSetupSectionProps) => {
  const usageStatus = creditNoteData
    ? resolveCreditNoteUsageStatusDisplay(creditNoteData)
    : null;

  return (
    <>
      {!canUseCreditNotes && (
        <Alert
          message={
            !taxReceiptEnabled
              ? 'Comprobantes Fiscales Deshabilitados'
              : 'Comprobante de Notas de Crédito no configurado'
          }
          description={
            !taxReceiptEnabled
              ? 'Los comprobantes fiscales están deshabilitados en la configuración. Para crear o editar notas de crédito, debe habilitar los comprobantes fiscales y configurar el comprobante correspondiente (serie 04 - NOTAS DE CRÉDITO).'
              : 'Para crear o editar notas de crédito, debe configurar el comprobante fiscal correspondiente (serie 04 - NOTAS DE CRÉDITO).'
          }
          type="warning"
          showIcon
          style={{ marginBottom: '1rem' }}
        />
      )}

      {(effectiveIsView || effectiveIsEdit) && creditNoteData && (
        <NCFContainer>
          <NCFItem>
            <NCFLabel>NCF</NCFLabel>
            <NCFValue>{creditNoteData.ncf || 'N/A'}</NCFValue>
          </NCFItem>
          <NCFItem>
            <NCFLabel>Uso</NCFLabel>
            <Tag color={usageStatus?.color || 'default'}>
              {usageStatus?.label || 'Sin Aplicar'}
            </Tag>
          </NCFItem>
          <NCFItem>
            <NCFLabel>e-CF/DGII</NCFLabel>
            <AdjustmentNoteFiscalStatusTag
              snapshot={creditNoteData.electronicTaxReceipt}
              fallbackStatus={creditNoteData.status}
            />
          </NCFItem>
        </NCFContainer>
      )}

      {mode === 'create' && (
        <Description>
          Complete los detalles para generar una nueva nota de crédito.
        </Description>
      )}

      {canUseCreditNotes && (
        <FormSection>
          <FormRow>
            <FormField>
              <ClientSelector
                clients={clients}
                selectedClient={currentClient}
                onSelectClient={onSelectClient}
                loading={clientsLoading}
                disabled={effectiveIsView}
              />
            </FormField>

            <FormField>
              <InvoiceSelector
                invoices={invoices}
                selectedInvoice={currentInvoice}
                onSelectInvoice={onSelectInvoice}
                loading={invoicesLoading}
                disabled={!selectedClientId || effectiveIsView}
                dateRange={dateRange}
                onDateRangeChange={onDateRangeChange}
              />
            </FormField>
          </FormRow>
          <CreditNoteFiscalReasonSection
            reason={reason}
            modificationCode={modificationCode}
            totalAmount={totalAmount}
            disabled={effectiveIsView}
            onReasonChange={onReasonChange}
            onModificationCodeChange={onModificationCodeChange}
          />
        </FormSection>
      )}
    </>
  );
};

const Description = styled.p`
  margin: 0;
  color: ${(props) => props.theme?.text?.secondary || '#666'};
`;

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormRow = styled.div`
  display: flex;
  gap: 1rem;

  @media (width <= 768px) {
    flex-direction: column;
    gap: 0.75rem;
  }
`;

const FormField = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.5rem;
`;

const NCFContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  align-items: flex-start;
  padding: 12px 16px;
  background-color: ${(props) =>
    props.theme?.background?.secondary || '#fafafa'};
  border: 1px solid ${(props) => props.theme?.border?.color || '#d9d9d9'};
  border-radius: 8px;
`;

const NCFItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 120px;
`;

const NCFLabel = styled.span`
  font-size: 0.75rem;
  color: ${(props) => props.theme?.text?.secondary || '#666'};
`;

const NCFValue = styled.span`
  font-size: 1em;
  font-weight: 600;
  color: ${(props) => props.theme?.text?.primary || '#333'};
  word-break: break-all;
`;
