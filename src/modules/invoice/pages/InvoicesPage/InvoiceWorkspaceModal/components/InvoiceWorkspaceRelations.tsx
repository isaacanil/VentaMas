import { DollarOutlined, ProfileOutlined } from '@/constants/icons/antd';
import { notification } from 'antd';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { DateTime } from 'luxon';
import { useEffect, useMemo, useReducer } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { VmButton, VmCard, VmChip } from '@/components/heroui';
import { setAccountPayment } from '@/features/accountsReceivable/accountsReceivablePaymentSlice';
import { selectUser } from '@/features/auth/userSlice';
import { useFbGetAccountReceivableByInvoice } from '@/firebase/accountsReceivable/useFbGetAccountReceivableByInvoice';
import { useFbGetCreditNotesByInvoice } from '@/firebase/creditNotes/useFbGetCreditNotesByInvoice';
import { db } from '@/firebase/firebaseconfig';
import { useFbGetCreditNoteApplicationsByInvoice } from '@/hooks/creditNote/useFbGetCreditNoteApplicationsByInvoice';
import { useAccountingRolloutEnabled } from '@/hooks/useAccountingRolloutEnabled';
import { useOpenAccountingEntry } from '@/modules/accounting/hooks/useOpenAccountingEntry';
import type { InvoiceData, InvoicePaymentMethod } from '@/types/invoice';
import type { UserIdentity } from '@/types/users';
import type {
  AccountsReceivableDoc,
  AccountsReceivablePayment,
} from '@/utils/accountsReceivable/types';
import { toMillis } from '@/utils/date/toMillis';
import type { TimestampLike } from '@/utils/date/types';
import { formatWorkspaceAmount } from '../utils/invoiceWorkspaceFormat';

interface InvoiceWorkspaceRelationsProps {
  invoice: InvoiceData;
}

type CreditNoteApplication = {
  id?: string | number;
  creditNoteNcf?: string;
  amountApplied?: number;
  appliedAt?: TimestampLike;
  appliedBy?: { displayName?: string };
  previousBalance?: number;
  newBalance?: number;
};

type CreditNoteRecord = {
  id?: string | number;
  ncf?: string;
  number?: string | number;
  totalAmount?: number;
  availableAmount?: number;
  createdAt?: TimestampLike;
  items?: unknown[];
};

type ReceivablePaymentRow = {
  id: string;
  arId: string;
  amount: number;
  comments: string;
  dateMs: number;
  methods: InvoicePaymentMethod[];
};

type ReceivablePaymentsState = {
  error: string | null;
  loading: boolean;
  rows: ReceivablePaymentRow[];
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  efectivo: 'Efectivo',
  card: 'Tarjeta',
  tarjeta: 'Tarjeta',
  creditcard: 'Tarjeta',
  debitcard: 'Tarjeta',
  transfer: 'Transferencia',
  transferencia: 'Transferencia',
  banktransfer: 'Transferencia',
  transferbank: 'Transferencia',
  creditNote: 'Nota de crédito',
  creditnote: 'Nota de crédito',
};

const getPaymentMethodLabel = (method?: InvoicePaymentMethod | null) => {
  const rawLabel = method?.name || method?.method || 'Pago';
  const normalized = String(rawLabel)
    .toLowerCase()
    .replace(/[\s_-]/g, '');
  return PAYMENT_METHOD_LABELS[normalized] || rawLabel;
};

const toDateTime = (value: TimestampLike) => {
  const millis = toMillis(value);
  return millis ? DateTime.fromMillis(millis) : null;
};

const formatDate = (value: TimestampLike) => {
  const dateTime = toDateTime(value);
  return dateTime?.isValid
    ? dateTime.toFormat('dd/MM/yyyy HH:mm')
    : 'Sin fecha';
};

const getPaidInstallmentsCount = (ar: AccountsReceivableDoc) =>
  Array.isArray(ar.paidInstallments) ? ar.paidInstallments.length : 0;

const getReceivableBalance = (ar: AccountsReceivableDoc) =>
  Number(ar.arBalance ?? ar.currentBalance ?? 0) || 0;

const resolvePaymentAmount = (payment: AccountsReceivablePayment) =>
  Number(payment.totalPaid ?? payment.totalAmount ?? payment.amount ?? 0) || 0;

const resolvePaymentMethods = (
  payment: AccountsReceivablePayment,
): InvoicePaymentMethod[] => {
  const methods = payment.paymentMethods ?? payment.paymentMethod ?? [];
  return Array.isArray(methods) ? (methods as InvoicePaymentMethod[]) : [];
};

const receivablePaymentsReducer = (
  state: ReceivablePaymentsState,
  action:
    | { type: 'reset' }
    | { type: 'start' }
    | { type: 'success'; payload: ReceivablePaymentRow[] }
    | { type: 'error'; payload: string },
): ReceivablePaymentsState => {
  switch (action.type) {
    case 'reset':
      return { error: null, loading: false, rows: [] };
    case 'start':
      return { ...state, error: null, loading: true };
    case 'success':
      return { error: null, loading: false, rows: action.payload };
    case 'error':
      return { error: action.payload, loading: false, rows: [] };
    default:
      return state;
  }
};

export const InvoiceWorkspaceRelations = ({
  invoice,
}: InvoiceWorkspaceRelationsProps) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser) as UserIdentity | null;
  const invoiceId = typeof invoice.id === 'string' ? invoice.id : null;
  const businessId =
    user?.businessID ?? user?.businessId ?? user?.activeBusinessId ?? null;
  const openAccountingEntry = useOpenAccountingEntry();
  const isAccountingRolloutEnabled = useAccountingRolloutEnabled(businessId);

  const paymentMethods = Array.isArray(invoice.paymentMethod)
    ? invoice.paymentMethod
    : [];
  const activePaymentMethods = paymentMethods.filter((method) => method.status);

  const { applications } = useFbGetCreditNoteApplicationsByInvoice(invoiceId);
  const { creditNotes } = useFbGetCreditNotesByInvoice(invoiceId);
  const { accountsReceivable } = useFbGetAccountReceivableByInvoice(invoiceId);

  const creditNoteApplications = Array.isArray(applications)
    ? (applications as CreditNoteApplication[])
    : [];
  const generatedCreditNotes = Array.isArray(creditNotes)
    ? (creditNotes as CreditNoteRecord[])
    : [];
  const safeAccountsReceivable = useMemo(
    () =>
      Array.isArray(accountsReceivable)
        ? (accountsReceivable as AccountsReceivableDoc[])
        : [],
    [accountsReceivable],
  );
  const arIds = useMemo(
    () =>
      safeAccountsReceivable
        .map((ar) => ar.id)
        .filter(
          (id): id is string => typeof id === 'string' && id.trim().length > 0,
        ),
    [safeAccountsReceivable],
  );
  const [receivablePaymentsState, dispatchReceivablePayments] = useReducer(
    receivablePaymentsReducer,
    { error: null, loading: false, rows: [] },
  );

  useEffect(() => {
    let active = true;

    const loadReceivablePayments = async () => {
      if (!businessId || !invoiceId || arIds.length === 0) {
        if (active) dispatchReceivablePayments({ type: 'reset' });
        return;
      }

      dispatchReceivablePayments({ type: 'start' });

      try {
        const paymentsRef = collection(
          db,
          'businesses',
          businessId,
          'accountsReceivablePayments',
        );
        const rows: ReceivablePaymentRow[] = [];

        await Promise.all(
          arIds.map(async (arId) => {
            const paymentsQuery = query(paymentsRef, where('arId', '==', arId));
            const snap = await getDocs(paymentsQuery);
            snap.forEach((docSnap) => {
              const data = docSnap.data() as AccountsReceivablePayment;
              rows.push({
                id: docSnap.id,
                arId,
                amount: resolvePaymentAmount(data),
                comments: String(data.comments ?? ''),
                dateMs: toMillis(data.date ?? data.createdAt) ?? 0,
                methods: resolvePaymentMethods(data),
              });
            });
          }),
        );

        rows.sort((a, b) => b.dateMs - a.dateMs);
        if (active) {
          dispatchReceivablePayments({ type: 'success', payload: rows });
        }
      } catch (error) {
        if (!active) return;
        const message = error instanceof Error ? error.message : String(error);
        dispatchReceivablePayments({ type: 'error', payload: message });
      }
    };

    void loadReceivablePayments();

    return () => {
      active = false;
    };
  }, [arIds, businessId, invoiceId]);

  const totalCreditNoteApplications = creditNoteApplications.reduce(
    (sum, application) => sum + (Number(application.amountApplied) || 0),
    0,
  );
  const totalGeneratedCreditNotes = generatedCreditNotes.reduce(
    (sum, creditNote) => sum + (Number(creditNote.totalAmount) || 0),
    0,
  );
  const totalReceivablePayments = receivablePaymentsState.rows.reduce(
    (sum, row) => sum + (Number(row.amount) || 0),
    0,
  );

  const canOpenReceivablePaymentEntry = (row: ReceivablePaymentRow) =>
    isAccountingRolloutEnabled && row.id.trim().length > 0;

  const handlePayReceivable = (receivableAccount: AccountsReceivableDoc) => {
    if (!receivableAccount.id) {
      notification.warning({
        message: 'Cuenta por cobrar no encontrada',
        description:
          'No se pudo localizar la cuenta por cobrar asociada a esta factura.',
      });
      return;
    }

    const arBalance = getReceivableBalance(receivableAccount);
    const preorderNumber =
      invoice.preorderDetails?.numberID ??
      invoice.preorderDetails?.number ??
      null;
    const invoiceNumber = invoice.numberID ?? invoice.number ?? null;
    const isPreorderOrigin =
      receivableAccount.originType === 'preorder' ||
      Boolean(receivableAccount.preorderId);

    dispatch(
      setAccountPayment({
        isOpen: true,
        paymentDetails: {
          clientId: invoice.client?.id,
          arId: receivableAccount.id,
          paymentScope: 'account',
          paymentOption: 'balance',
          totalAmount: arBalance,
          totalPaid: 0,
        },
        extra: {
          ...receivableAccount,
          arBalance,
          clientName: invoice.client?.name,
          clientCode: invoice.client?.numberId ?? invoice.client?.id,
          documentLabel: isPreorderOrigin ? 'Preventa' : 'Factura',
          documentNumber: isPreorderOrigin
            ? (preorderNumber ?? invoiceNumber)
            : invoiceNumber,
          preorderNumber,
          invoiceNumber,
        },
      }),
    );
  };

  const handleOpenReceivablePaymentEntry = (row: ReceivablePaymentRow) => {
    openAccountingEntry({
      eventType: 'accounts_receivable.payment.recorded',
      sourceDocumentId: row.id,
      sourceDocumentType: 'accountsReceivablePayment',
    });
  };

  return (
    <RelationsGrid>
      <SectionCard>
        <VmCard.Header>
          <VmCard.Title>Métodos de pago</VmCard.Title>
          <VmCard.Description>
            {activePaymentMethods.length} métodos activos en la factura.
          </VmCard.Description>
        </VmCard.Header>
        <VmCard.Content>
          {activePaymentMethods.length > 0 ? (
            <ItemList>
              {activePaymentMethods.map((method, index) => (
                <CompactItem
                  key={`${method.method ?? method.name ?? 'method'}-${method.reference ?? index}`}
                >
                  <ItemHeader>
                    <strong>{getPaymentMethodLabel(method)}</strong>
                    <Mono>
                      {formatWorkspaceAmount(method.value ?? 0, invoice)}
                    </Mono>
                  </ItemHeader>
                  {method.reference ? (
                    <ItemMeta>Ref: {method.reference}</ItemMeta>
                  ) : null}
                </CompactItem>
              ))}
            </ItemList>
          ) : (
            <EmptyMessage>Sin métodos de pago registrados.</EmptyMessage>
          )}
        </VmCard.Content>
      </SectionCard>

      <SectionCard>
        <VmCard.Header>
          <VmCard.Title>Notas de crédito aplicadas</VmCard.Title>
          <VmCard.Description>
            {formatWorkspaceAmount(totalCreditNoteApplications, invoice)}
          </VmCard.Description>
        </VmCard.Header>
        <VmCard.Content>
          {creditNoteApplications.length > 0 ? (
            <ItemList>
              {creditNoteApplications.map((application, index) => (
                <CompactItem key={String(application.id ?? index)}>
                  <ItemHeader>
                    <strong>{application.creditNoteNcf || 'N/A'}</strong>
                    <Mono>
                      {formatWorkspaceAmount(
                        application.amountApplied ?? 0,
                        invoice,
                      )}
                    </Mono>
                  </ItemHeader>
                  <InfoGrid>
                    <InfoPair>
                      <span>Aplicada</span>
                      <strong>{formatDate(application.appliedAt)}</strong>
                    </InfoPair>
                    <InfoPair>
                      <span>Saldo</span>
                      <strong>
                        {formatWorkspaceAmount(
                          application.previousBalance,
                          invoice,
                        )}
                        {' -> '}
                        {formatWorkspaceAmount(application.newBalance, invoice)}
                      </strong>
                    </InfoPair>
                    {application.appliedBy?.displayName ? (
                      <InfoPair>
                        <span>Por</span>
                        <strong>{application.appliedBy.displayName}</strong>
                      </InfoPair>
                    ) : null}
                  </InfoGrid>
                </CompactItem>
              ))}
            </ItemList>
          ) : (
            <EmptyMessage>No hay notas de crédito aplicadas.</EmptyMessage>
          )}
        </VmCard.Content>
      </SectionCard>

      <SectionCard>
        <VmCard.Header>
          <VmCard.Title>Cuentas por cobrar</VmCard.Title>
          <VmCard.Description>
            {safeAccountsReceivable.length} cuentas asociadas.
          </VmCard.Description>
        </VmCard.Header>
        <VmCard.Content>
          {safeAccountsReceivable.length > 0 ? (
            <ItemList>
              {safeAccountsReceivable.map((ar, index) => {
                const balance = getReceivableBalance(ar);
                const paidInstallments = getPaidInstallmentsCount(ar);
                const totalInstallments = Number(ar.totalInstallments || 0);

                return (
                  <CompactItem key={ar.id || index}>
                    <ItemHeader>
                      <strong>
                        Cuenta #{ar.numberId || ar.arNumber || 'N/A'}
                      </strong>
                      <RowActions>
                        <VmChip
                          color={balance <= 0 ? 'success' : 'warning'}
                          variant="soft"
                        >
                          <VmChip.Label>
                            {balance <= 0 ? 'Pagada' : 'Pendiente'}
                          </VmChip.Label>
                        </VmChip>
                        {balance > 0 ? (
                          <VmButton
                            size="sm"
                            variant="secondary"
                            onPress={() => handlePayReceivable(ar)}
                          >
                            <DollarOutlined />
                            Pagar
                          </VmButton>
                        ) : null}
                      </RowActions>
                    </ItemHeader>
                    <InfoGrid>
                      <InfoPair>
                        <span>Balance</span>
                        <strong>
                          {formatWorkspaceAmount(balance, invoice)}
                        </strong>
                      </InfoPair>
                      <InfoPair>
                        <span>Cuota</span>
                        <strong>
                          {formatWorkspaceAmount(
                            ar.installmentAmount || 0,
                            invoice,
                          )}
                        </strong>
                      </InfoPair>
                      <InfoPair>
                        <span>Cuotas</span>
                        <strong>
                          {paidInstallments}/{totalInstallments || 'N/A'}
                        </strong>
                      </InfoPair>
                      <InfoPair>
                        <span>Creada</span>
                        <strong>{formatDate(ar.createdAt)}</strong>
                      </InfoPair>
                      <InfoPair>
                        <span>Último pago</span>
                        <strong>
                          {ar.lastPaymentDate
                            ? `${formatWorkspaceAmount(
                                ar.lastPayment || 0,
                                invoice,
                              )} - ${formatDate(ar.lastPaymentDate)}`
                            : 'N/A'}
                        </strong>
                      </InfoPair>
                    </InfoGrid>
                  </CompactItem>
                );
              })}
            </ItemList>
          ) : (
            <EmptyMessage>No hay cuentas por cobrar asociadas.</EmptyMessage>
          )}
        </VmCard.Content>
      </SectionCard>

      <SectionCard>
        <VmCard.Header>
          <VmCard.Title>Pagos por CxC</VmCard.Title>
          <VmCard.Description>
            {formatWorkspaceAmount(totalReceivablePayments, invoice)}
          </VmCard.Description>
        </VmCard.Header>
        <VmCard.Content>
          {receivablePaymentsState.loading ? (
            <EmptyMessage>Cargando pagos de CxC...</EmptyMessage>
          ) : receivablePaymentsState.error ? (
            <EmptyMessage>{receivablePaymentsState.error}</EmptyMessage>
          ) : receivablePaymentsState.rows.length > 0 ? (
            <ItemList>
              {receivablePaymentsState.rows.map((row) => {
                const activeMethods = row.methods.filter(
                  (method) => method.status,
                );

                return (
                  <CompactItem key={row.id}>
                    <ItemHeader>
                      <strong>{formatDate(row.dateMs)}</strong>
                      <RowActions>
                        <Mono>
                          {formatWorkspaceAmount(row.amount, invoice)}
                        </Mono>
                        {canOpenReceivablePaymentEntry(row) ? (
                          <VmButton
                            size="sm"
                            variant="secondary"
                            onPress={() =>
                              handleOpenReceivablePaymentEntry(row)
                            }
                          >
                            <ProfileOutlined />
                            Ver asiento
                          </VmButton>
                        ) : null}
                      </RowActions>
                    </ItemHeader>
                    {activeMethods.length > 0 ? (
                      <PillList>
                        {activeMethods.map((method, index) => (
                          <MethodPill
                            key={`${method.method ?? method.name ?? 'method'}-${method.reference ?? index}`}
                          >
                            {getPaymentMethodLabel(method)}:{' '}
                            {formatWorkspaceAmount(method.value ?? 0, invoice)}
                            {method.reference ? ` (${method.reference})` : ''}
                          </MethodPill>
                        ))}
                      </PillList>
                    ) : null}
                    {row.comments ? <ItemMeta>{row.comments}</ItemMeta> : null}
                  </CompactItem>
                );
              })}
            </ItemList>
          ) : (
            <EmptyMessage>No hay pagos de CxC registrados.</EmptyMessage>
          )}
        </VmCard.Content>
      </SectionCard>

      <SectionCard>
        <VmCard.Header>
          <VmCard.Title>Notas de crédito generadas</VmCard.Title>
          <VmCard.Description>
            {formatWorkspaceAmount(totalGeneratedCreditNotes, invoice)}
          </VmCard.Description>
        </VmCard.Header>
        <VmCard.Content>
          {generatedCreditNotes.length > 0 ? (
            <ItemList>
              {generatedCreditNotes.map((creditNote, index) => (
                <CompactItem key={String(creditNote.id ?? index)}>
                  <ItemHeader>
                    <strong>
                      {creditNote.ncf || creditNote.number || 'N/A'}
                    </strong>
                    <Mono>
                      {formatWorkspaceAmount(creditNote.totalAmount, invoice)}
                    </Mono>
                  </ItemHeader>
                  <InfoGrid>
                    <InfoPair>
                      <span>Creada</span>
                      <strong>{formatDate(creditNote.createdAt)}</strong>
                    </InfoPair>
                    <InfoPair>
                      <span>Disponible</span>
                      <strong>
                        {formatWorkspaceAmount(
                          creditNote.availableAmount ?? creditNote.totalAmount,
                          invoice,
                        )}
                      </strong>
                    </InfoPair>
                    <InfoPair>
                      <span>Productos</span>
                      <strong>{creditNote.items?.length || 0}</strong>
                    </InfoPair>
                  </InfoGrid>
                </CompactItem>
              ))}
            </ItemList>
          ) : (
            <EmptyMessage>No hay notas de crédito generadas.</EmptyMessage>
          )}
        </VmCard.Content>
      </SectionCard>
    </RelationsGrid>
  );
};

const RelationsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--ds-space-3);
  align-items: start;
`;

const SectionCard = styled(VmCard)`
  min-width: 0;
`;

const ItemList = styled.div`
  display: grid;
  gap: var(--ds-space-2);
`;

const CompactItem = styled.div`
  display: grid;
  gap: var(--ds-space-2);
  min-width: 0;
  padding: var(--ds-space-3);
  background: var(--ds-color-bg-subtle);
  border: 1px solid var(--ds-color-border-subtle);
  border-radius: var(--ds-radius-lg);
`;

const ItemHeader = styled.div`
  display: flex;
  gap: var(--ds-space-2);
  align-items: center;
  justify-content: space-between;
  min-width: 0;

  strong {
    overflow: hidden;
    color: var(--ds-color-text-primary);
    font-size: var(--ds-font-size-sm);
    font-weight: var(--ds-font-weight-semibold);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const RowActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  align-items: center;
  justify-content: flex-end;
`;

const Mono = styled.span`
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-mono);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
`;

const ItemMeta = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--ds-space-2);
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

const PillList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
`;

const MethodPill = styled.span`
  padding: 2px var(--ds-space-2);
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  background: var(--ds-color-bg-surface);
  border: 1px solid var(--ds-color-border-subtle);
  border-radius: var(--ds-radius-lg);
`;

const EmptyMessage = styled.div`
  padding: var(--ds-space-3);
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  background: var(--ds-color-bg-subtle);
  border: 1px dashed var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
`;
