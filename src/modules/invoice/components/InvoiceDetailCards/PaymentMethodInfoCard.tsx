import { Card, Divider } from 'antd';
import { DateTime } from 'luxon';
import React from 'react';
import type { InvoiceData, InvoicePaymentMethod } from '@/types/invoice';
import type { TimestampLike } from '@/utils/date/types';
import styled from 'styled-components';

import { formatInvoicePrice } from '@/utils/invoice/documentCurrency';
type CreditNoteApplication = {
  id?: string | number;
  creditNoteNcf?: string;
  amountApplied?: number;
  appliedAt?: TimestampLike;
  appliedBy?: { displayName?: string };
  previousBalance?: number;
  newBalance?: number;
};

type PaymentMethodInfoCardProps = {
  paymentMethod?: InvoicePaymentMethod[];
  creditNoteApplications?: CreditNoteApplication[];
  invoiceData?: InvoiceData | null;
};

const EMPTY_CREDIT_NOTE_APPLICATIONS: CreditNoteApplication[] = [];

const paymentmethodLabel = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  creditNote: 'Nota de Crédito',
};

const toDateTime = (value: TimestampLike) => {
  if (!value) return null;
  if (DateTime.isDateTime(value)) return value;
  if (value instanceof Date) return DateTime.fromJSDate(value);
  if (typeof value === 'number') return DateTime.fromMillis(value);
  if (typeof value === 'string') {
    const iso = DateTime.fromISO(value);
    return iso.isValid ? iso : DateTime.fromJSDate(new Date(value));
  }
  if (typeof value === 'object' && value !== null) {
    const record = value as {
      seconds?: number;
      toDate?: () => Date;
      toMillis?: () => number;
    };
    if (typeof record.seconds === 'number') {
      return DateTime.fromSeconds(record.seconds);
    }
    if (typeof record.toMillis === 'function') {
      return DateTime.fromMillis(record.toMillis());
    }
    if (typeof record.toDate === 'function') {
      return DateTime.fromJSDate(record.toDate());
    }
  }
  return null;
};

export const PaymentMethodInfoCard = ({
  paymentMethod,
  creditNoteApplications = EMPTY_CREDIT_NOTE_APPLICATIONS,
  invoiceData = null,
}: PaymentMethodInfoCardProps) => {
  const activePaymentMethods = (paymentMethod ?? []).filter(
    (method) => method.status,
  );
  const formatAmount = (value: number | string | null | undefined) =>
    formatInvoicePrice(value, invoiceData);

  return (
    <StyledCard>
      <CardHeader>
        <CardTitle>Método de Pago</CardTitle>
      </CardHeader>

      <CardContent>
        {activePaymentMethods.map((method, index) => (
          <PaymentMethodSection key={index}>
            <MethodHeader>
              <MethodName>
                {paymentmethodLabel[method.method] || method.method}
              </MethodName>
              <MethodAmount>{formatAmount(method.value || 0)}</MethodAmount>
            </MethodHeader>

            {/* Mostrar detalles adicionales para métodos que lo requieran */}
            {method.reference && (
              <MethodDetail>
                <DetailLabel>Referencia:</DetailLabel>
                <DetailValue>{method.reference}</DetailValue>
              </MethodDetail>
            )}
          </PaymentMethodSection>
        ))}

        {/* Sección detallada para notas de crédito */}
        {creditNoteApplications.length > 0 && (
          <>
            <Divider style={{ margin: '12px 0' }} />
            <SectionTitle>Notas de Crédito Aplicadas</SectionTitle>
            {creditNoteApplications.map((app, index) => (
              <CreditNoteSection key={app.id || index}>
                <CreditNoteHeader>
                  <CreditNoteNCF>{app.creditNoteNcf || 'N/A'}</CreditNoteNCF>
                  <CreditNoteAmount>
                    {formatAmount(app.amountApplied || 0)}
                  </CreditNoteAmount>
                </CreditNoteHeader>

                <CreditNoteDetails>
                  <CreditNoteDetail>
                    <DetailLabel>Aplicado:</DetailLabel>
                    <DetailValue>
                      {toDateTime(app.appliedAt)?.toFormat('dd/MM/yyyy HH:mm')}
                    </DetailValue>
                  </CreditNoteDetail>

                  {app.appliedBy?.displayName && (
                    <CreditNoteDetail>
                      <DetailLabel>Por:</DetailLabel>
                      <DetailValue>{app.appliedBy.displayName}</DetailValue>
                    </CreditNoteDetail>
                  )}

                  <CreditNoteDetail>
                    <DetailLabel>Saldo:</DetailLabel>
                    <DetailValue>
                      {formatAmount(app.previousBalance)} →{' '}
                      {formatAmount(app.newBalance)}
                    </DetailValue>
                  </CreditNoteDetail>
                </CreditNoteDetails>
              </CreditNoteSection>
            ))}
          </>
        )}
      </CardContent>
    </StyledCard>
  );
};

const StyledCard = styled(Card)`
  .ant-card-body {
    padding: 0;
  }
`;

const CardHeader = styled.div`
  padding: 1rem;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
`;

const CardTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
`;

const CardContent = styled.div`
  padding: 1rem;
`;

const PaymentMethodSection = styled.div`
  border-radius: 6px;
`;

const MethodHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const MethodName = styled.span`
  font-size: 0.8rem;
  font-weight: 600;
  color: #333;
`;

const MethodAmount = styled.span`
  font-family: monospace;
  font-size: 0.8rem;
  font-weight: 600;
`;

const MethodDetail = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-top: 0.25rem;
`;

const SectionTitle = styled.h4`
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #333;
`;

const CreditNoteSection = styled.div`
  padding: 0.75rem;
  margin-bottom: 1rem;
  background: #f8f9fa;
  border: 1px solid #d9d9d9;
  border-radius: 6px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const CreditNoteHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const CreditNoteNCF = styled.span`
  font-family: monospace;
  font-size: 0.875rem;
  font-weight: 600;
  color: #333;
`;

const CreditNoteAmount = styled.span`
  font-family: monospace;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1890ff;
`;

const CreditNoteDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const CreditNoteDetail = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const DetailLabel = styled.span`
  min-width: 60px;
  font-size: 0.75rem;
  color: #666;
`;

const DetailValue = styled.span`
  display: flex;
  gap: 0.25rem;
  align-items: center;
  font-size: 0.75rem;
  color: #333;
`;
