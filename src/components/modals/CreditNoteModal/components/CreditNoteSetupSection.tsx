import { Alert } from 'antd';
import React from 'react';
import styled from 'styled-components';

import ClientSelector from './ClientSelector';
import InvoiceSelector from './InvoiceSelector';

import type { CreditNoteRecord } from '@/types/creditNote';
import type { InvoiceClient, InvoiceData } from '@/types/invoice';
import type { DatePickerRangeValue } from '@/components/common/DatePicker/types';

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
}: CreditNoteSetupSectionProps) => (
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
        <NCFLabel>NCF</NCFLabel>
        <NCFValue>{creditNoteData.ncf || 'N/A'}</NCFValue>
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
      </FormSection>
    )}
  </>
);

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
  flex-direction: column;
  align-items: flex-start;
  max-width: 300px;
  padding: 12px 16px;
  background-color: ${(props) =>
    props.theme?.background?.secondary || '#fafafa'};
  border: 1px solid ${(props) => props.theme?.border?.color || '#d9d9d9'};
  border-radius: 8px;
`;

const NCFLabel = styled.span`
  margin-bottom: 4px;
  font-size: 0.75rem;
  color: ${(props) => props.theme?.text?.secondary || '#666'};
`;

const NCFValue = styled.span`
  font-size: 1em;
  font-weight: 600;
  color: ${(props) => props.theme?.text?.primary || '#333'};
  word-break: break-all;
`;
