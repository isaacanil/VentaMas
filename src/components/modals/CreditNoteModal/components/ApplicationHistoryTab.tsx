import { DateTime } from 'luxon';
import React from 'react';
import styled from 'styled-components';

import type {
  CreditNoteApplicationRecord,
  CreditNoteRecord,
} from '@/types/creditNote';
import type { NumberInput } from '@/utils/number/number';
import type { TimestampLike } from '@/utils/date/types';

type FormatPrice = (value: NumberInput) => string;

interface ApplicationHistoryTabProps {
  creditNoteApplications: CreditNoteApplicationRecord[];
  applicationsLoading: boolean;
  formatPrice: FormatPrice;
  creditNoteData: CreditNoteRecord | null;
}

const formatAppliedAt = (value: TimestampLike | null | undefined): string => {
  if (!value) return '';
  if (typeof value === 'object') {
    if ('seconds' in value && typeof value.seconds === 'number') {
      return DateTime.fromSeconds(value.seconds).toFormat('dd/MM/yyyy HH:mm');
    }
    if ('toMillis' in value && typeof value.toMillis === 'function') {
      return DateTime.fromMillis(value.toMillis()).toFormat(
        'dd/MM/yyyy HH:mm',
      );
    }
    if ('toDate' in value && typeof value.toDate === 'function') {
      return DateTime.fromJSDate(value.toDate()).toFormat(
        'dd/MM/yyyy HH:mm',
      );
    }
    if (value instanceof Date) {
      return DateTime.fromJSDate(value).toFormat('dd/MM/yyyy HH:mm');
    }
  }
  return DateTime.fromJSDate(new Date(String(value))).toFormat(
    'dd/MM/yyyy HH:mm',
  );
};

export const ApplicationHistoryTab = ({
  creditNoteApplications,
  applicationsLoading,
  formatPrice,
  creditNoteData,
}: ApplicationHistoryTabProps) => (
  <ApplicationHistorySection>
    <ApplicationHistoryTitle>Historial de Aplicaciones</ApplicationHistoryTitle>
    {applicationsLoading ? (
      <div>Cargando historial...</div>
    ) : (
      <>
        <ApplicationHistoryList>
          {creditNoteApplications.map((app, index) => (
            <ApplicationHistoryItem key={app.id ?? index}>
              <ApplicationHistoryHeader>
                <ApplicationHistoryDate>
                  {formatAppliedAt(app.appliedAt)}
                </ApplicationHistoryDate>
                <ApplicationHistoryAmount>
                  {formatPrice(app.amountApplied ?? 0)}
                </ApplicationHistoryAmount>
              </ApplicationHistoryHeader>
              <ApplicationHistoryDetails>
                <ApplicationHistoryDetail>
                  <strong>Factura Aplicada:</strong>{' '}
                  {app.invoiceNcf || app.invoiceId}
                </ApplicationHistoryDetail>
                {app.invoiceNumber && (
                  <ApplicationHistoryDetail>
                    <strong>Número:</strong> {app.invoiceNumber}
                  </ApplicationHistoryDetail>
                )}
                <ApplicationHistoryDetail>
                  <strong>Saldo Anterior:</strong>{' '}
                  {formatPrice(app.previousBalance)}
                  {' → '}
                  <strong>Saldo Nuevo:</strong> {formatPrice(app.newBalance)}
                </ApplicationHistoryDetail>
                {app.appliedBy && (
                  <ApplicationHistoryDetail>
                    <strong>Aplicado por:</strong>{' '}
                    {app.appliedBy.displayName || 'Usuario'}
                  </ApplicationHistoryDetail>
                )}
              </ApplicationHistoryDetails>
            </ApplicationHistoryItem>
          ))}
        </ApplicationHistoryList>
        <ApplicationHistorySummary>
          <ApplicationHistorySummaryItem>
            <strong>Total Aplicado:</strong>{' '}
            {formatPrice(
              creditNoteApplications.reduce(
                (sum, app) => sum + (app.amountApplied || 0),
                0,
              ),
            )}
          </ApplicationHistorySummaryItem>
          <ApplicationHistorySummaryItem>
            <strong>Saldo Disponible:</strong>{' '}
            {formatPrice(
              creditNoteData?.availableAmount ??
                (creditNoteData?.totalAmount || 0),
            )}
          </ApplicationHistorySummaryItem>
        </ApplicationHistorySummary>
      </>
    )}
  </ApplicationHistorySection>
);

const ApplicationHistorySection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
`;

const ApplicationHistoryTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: ${(props) => props.theme?.text?.primary || '#333'};
`;

const ApplicationHistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ApplicationHistoryItem = styled.div`
  padding: 1rem;
  background-color: ${(props) =>
    props.theme?.background?.secondary || '#fafafa'};
  border: 1px solid ${(props) => props.theme?.border?.color || '#d9d9d9'};
  border-radius: 8px;
`;

const ApplicationHistoryHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const ApplicationHistoryDate = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${(props) => props.theme?.text?.secondary || '#666'};
`;

const ApplicationHistoryAmount = styled.span`
  font-family: monospace;
  font-size: 1rem;
  font-weight: 600;
  color: ${(props) => props.theme?.text?.primary || '#333'};
`;

const ApplicationHistoryDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const ApplicationHistoryDetail = styled.div`
  font-size: 0.875rem;
  color: ${(props) => props.theme?.text?.secondary || '#666'};

  strong {
    color: ${(props) => props.theme?.text?.primary || '#333'};
  }
`;

const ApplicationHistorySummary = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 1rem;
  margin-top: 1rem;
  border-top: 1px solid ${(props) => props.theme?.border?.color || '#d9d9d9'};
`;

const ApplicationHistorySummaryItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.875rem;

  strong {
    color: ${(props) => props.theme?.text?.primary || '#333'};
  }
`;
