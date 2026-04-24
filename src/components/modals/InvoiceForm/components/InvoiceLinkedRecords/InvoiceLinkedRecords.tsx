import { Tag } from 'antd';
import { DateTime } from 'luxon';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import { useFbGetAccountReceivableByInvoice } from '@/firebase/accountsReceivable/useFbGetAccountReceivableByInvoice';
import { useFbGetCreditNotesByInvoice } from '@/firebase/creditNotes/useFbGetCreditNotesByInvoice';
import { useFbGetCreditNoteApplicationsByInvoice } from '@/hooks/creditNote/useFbGetCreditNoteApplicationsByInvoice';
import { CreditNotesInfoCard } from '@/modules/invoice/components/InvoiceDetailCards/CreditNotesInfoCard';
import { PaymentMethodInfoCard } from '@/modules/invoice/components/InvoiceDetailCards/PaymentMethodInfoCard';
import { ReceivablePaymentsInfoCard } from '@/modules/invoice/components/InvoiceDetailCards/ReceivablePaymentsInfoCard';
import type { InvoiceClient, InvoiceData } from '@/types/invoice';
import type { UserIdentity } from '@/types/users';
import type { AccountsReceivableDoc } from '@/utils/accountsReceivable/types';
import type { TimestampLike } from '@/utils/date/types';
import { formatInvoicePrice } from '@/utils/invoice/documentCurrency';

interface InvoiceLinkedRecordsProps {
  invoice?: InvoiceData | null;
}

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
    if (typeof record.seconds === 'number')
      return DateTime.fromSeconds(record.seconds);
    if (typeof record.toMillis === 'function')
      return DateTime.fromMillis(record.toMillis());
    if (typeof record.toDate === 'function')
      return DateTime.fromJSDate(record.toDate());
  }
  return null;
};

const getPaidInstallmentsCount = (ar: AccountsReceivableDoc) =>
  Array.isArray(ar.paidInstallments) ? ar.paidInstallments.length : 0;

const getReceivableBalance = (ar: AccountsReceivableDoc) =>
  Number(ar.arBalance ?? ar.currentBalance ?? 0) || 0;

const ReceivableAccountsSummary = ({
  accountsReceivable,
  client,
  invoice,
}: {
  accountsReceivable: AccountsReceivableDoc[];
  client?: InvoiceClient | null;
  invoice?: InvoiceData | null;
}) => {
  if (!accountsReceivable.length) {
    return <EmptyMessage>No hay cuentas por cobrar asociadas.</EmptyMessage>;
  }

  const formatAmount = (value: number | string | null | undefined) =>
    formatInvoicePrice(value, invoice);

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Cuentas por cobrar</PanelTitle>
        <PanelMeta>{client?.name || 'Sin cliente'}</PanelMeta>
      </PanelHeader>
      <ReceivableList>
        {accountsReceivable.map((ar, index) => {
          const balance = getReceivableBalance(ar);
          const paidInstallments = getPaidInstallmentsCount(ar);
          const totalInstallments = Number(ar.totalInstallments || 0);
          const createdAt = toDateTime(ar.createdAt);
          const lastPaymentAt = toDateTime(ar.lastPaymentDate);

          return (
            <ReceivableItem key={ar.id || index}>
              <ReceivableItemHeader>
                <strong>Cuenta #{ar.numberId || ar.arNumber || 'N/A'}</strong>
                <Tag color={balance <= 0 ? 'green' : 'volcano'}>
                  {balance <= 0 ? 'Pagada' : 'Pendiente'}
                </Tag>
              </ReceivableItemHeader>
              <ReceivableGrid>
                <InfoPair>
                  <span>Balance</span>
                  <strong>{formatAmount(balance)}</strong>
                </InfoPair>
                <InfoPair>
                  <span>Cuota</span>
                  <strong>{formatAmount(ar.installmentAmount || 0)}</strong>
                </InfoPair>
                <InfoPair>
                  <span>Cuotas</span>
                  <strong>
                    {paidInstallments}/{totalInstallments || 'N/A'}
                  </strong>
                </InfoPair>
                <InfoPair>
                  <span>Creada</span>
                  <strong>
                    {createdAt?.isValid
                      ? createdAt.toFormat('dd/MM/yyyy')
                      : 'N/A'}
                  </strong>
                </InfoPair>
                <InfoPair>
                  <span>Ultimo pago</span>
                  <strong>
                    {lastPaymentAt?.isValid
                      ? `${formatAmount(ar.lastPayment || 0)} - ${lastPaymentAt.toFormat(
                          'dd/MM/yyyy',
                        )}`
                      : 'N/A'}
                  </strong>
                </InfoPair>
              </ReceivableGrid>
            </ReceivableItem>
          );
        })}
      </ReceivableList>
    </Panel>
  );
};

export const InvoiceLinkedRecords = ({
  invoice,
}: InvoiceLinkedRecordsProps) => {
  const user = useSelector(selectUser) as UserIdentity | null;
  const invoiceId = typeof invoice?.id === 'string' ? invoice.id : null;
  const client = invoice?.client ?? null;
  const paymentMethod = Array.isArray(invoice?.paymentMethod)
    ? invoice.paymentMethod
    : [];
  const invoiceTotal = Number(invoice?.totalPurchase?.value ?? 0) || 0;

  const { applications: creditNoteApplications } =
    useFbGetCreditNoteApplicationsByInvoice(invoiceId);
  const { creditNotes: generatedCreditNotes } =
    useFbGetCreditNotesByInvoice(invoiceId);
  const { accountsReceivable } = useFbGetAccountReceivableByInvoice(invoiceId);

  const safeAccountsReceivable = useMemo(
    () =>
      Array.isArray(accountsReceivable)
        ? (accountsReceivable as AccountsReceivableDoc[])
        : [],
    [accountsReceivable],
  );
  const safeGeneratedCreditNotes = Array.isArray(generatedCreditNotes)
    ? generatedCreditNotes
    : [];

  return (
    <Container>
      <Grid>
        <PaymentMethodInfoCard
          invoiceData={invoice}
          paymentMethod={paymentMethod}
          creditNoteApplications={creditNoteApplications}
        />
        <ReceivableAccountsSummary
          accountsReceivable={safeAccountsReceivable}
          client={client}
          invoice={invoice}
        />
        {safeAccountsReceivable.length > 0 ? (
          <ReceivablePaymentsInfoCard
            user={user}
            invoiceId={invoiceId}
            invoiceData={invoice}
            accountsReceivable={safeAccountsReceivable}
            invoiceTotal={invoiceTotal}
            invoicePayment={invoice?.payment}
            invoiceChange={invoice?.change}
          />
        ) : null}
        {safeGeneratedCreditNotes.length > 0 ? (
          <CreditNotesInfoCard
            creditNotes={safeGeneratedCreditNotes}
            invoiceData={invoice}
          />
        ) : (
          <EmptyMessage>No hay notas de credito generadas.</EmptyMessage>
        )}
      </Grid>
    </Container>
  );
};

const Container = styled.div`
  display: grid;
  gap: 1rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  align-items: start;
`;

const Panel = styled.div`
  overflow: hidden;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
`;

const PanelHeader = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
`;

const PanelTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
`;

const PanelMeta = styled.span`
  overflow: hidden;
  font-size: 0.78rem;
  color: #666;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ReceivableList = styled.div`
  display: grid;
  gap: 0.75rem;
  padding: 1rem;
`;

const ReceivableItem = styled.div`
  display: grid;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
`;

const ReceivableItemHeader = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  justify-content: space-between;
`;

const ReceivableGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.5rem 1rem;
`;

const InfoPair = styled.div`
  display: grid;
  gap: 0.2rem;

  span {
    font-size: 0.75rem;
    color: #666;
  }

  strong {
    font-family: ${(props) => props.theme?.fonts?.mono || 'monospace'};
    font-size: 0.82rem;
    color: #333;
  }
`;

const EmptyMessage = styled.div`
  padding: 1rem;
  color: #666;
  background: #fff;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
`;
