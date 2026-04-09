import { Card, Divider, Spin } from 'antd';
import { DateTime } from 'luxon';
import React, { useEffect, useMemo, useReducer } from 'react';
import styled from 'styled-components';
import { collection, getDocs, query, where } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type {
  InvoiceData,
  InvoiceMonetaryValue,
  InvoicePaymentMethod,
} from '@/types/invoice';
import type { AccountsReceivableDoc } from '@/utils/accountsReceivable/types';
import type { UserIdentity } from '@/types/users';
import { formatInvoicePrice } from '@/utils/invoice/documentCurrency';
import { toMillis } from '@/utils/date/toMillis';

type ArPaymentDoc = {
  id: string;
  arId?: string;
  date?: unknown;
  createdAt?: unknown;
  totalPaid?: number;
  totalAmount?: number;
  amount?: number;
  comments?: string;
  paymentMethods?: InvoicePaymentMethod[];
  paymentMethod?: InvoicePaymentMethod[];
  createdUserId?: string;
};

type PaymentRow = {
  id: string;
  arId: string;
  dateMs: number;
  amount: number;
  methods: InvoicePaymentMethod[];
  comments: string;
};

type PaymentsState = {
  loading: boolean;
  rows: PaymentRow[];
  error: string | null;
};

const paymentMethodLabel: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  creditNote: 'Nota de Crédito',
};

const resolveAmount = (payment: ArPaymentDoc): number =>
  Number(payment.totalPaid ?? payment.totalAmount ?? payment.amount ?? 0) || 0;

const resolveMethods = (payment: ArPaymentDoc): InvoicePaymentMethod[] => {
  const methods = payment.paymentMethods ?? payment.paymentMethod ?? [];
  return Array.isArray(methods) ? methods : [];
};

const resolvePaymentDateMs = (payment: ArPaymentDoc): number => {
  const candidate = payment.date ?? payment.createdAt ?? null;
  return toMillis(candidate as any) ?? 0;
};

const resolveMonetaryNumber = (value: InvoiceMonetaryValue | undefined): number => {
  const numeric = Number(value?.value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
};

export const ReceivablePaymentsInfoCard = ({
  user,
  invoiceId,
  invoiceData = null,
  accountsReceivable,
  invoiceTotal,
  invoicePayment,
  invoiceChange,
}: {
  user: UserIdentity | null | undefined;
  invoiceId: string | null | undefined;
  invoiceData?: InvoiceData | null;
  accountsReceivable: AccountsReceivableDoc[];
  invoiceTotal: number;
  invoicePayment?: InvoiceMonetaryValue;
  invoiceChange?: InvoiceMonetaryValue;
}) => {
  const businessId = user?.businessID ?? null;
  const arIds = useMemo(
    () =>
      accountsReceivable
        .map((ar) => ar?.id)
        .filter((id): id is string => typeof id === 'string' && id.trim().length > 0),
    [accountsReceivable],
  );

  const [state, dispatch] = useReducer(
    (
      currentState: PaymentsState,
      action:
        | { type: 'reset' }
        | { type: 'start' }
        | { type: 'success'; payload: PaymentRow[] }
        | { type: 'error'; payload: string },
    ): PaymentsState => {
      switch (action.type) {
        case 'reset':
          return { loading: false, rows: [], error: null };
        case 'start':
          return { ...currentState, loading: true, error: null };
        case 'success':
          return { loading: false, rows: action.payload, error: null };
        case 'error':
          return { loading: false, rows: [], error: action.payload };
        default:
          return currentState;
      }
    },
    { loading: false, rows: [], error: null },
  );
  const { loading, rows, error } = state;

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!businessId || !invoiceId || arIds.length === 0) {
        if (active) dispatch({ type: 'reset' });
        return;
      }

      dispatch({ type: 'start' });
      const paymentsRef = collection(
        db,
        'businesses',
        businessId,
        'accountsReceivablePayments',
      );

      const payments: PaymentRow[] = [];
      const loadError = await Promise.all(
        arIds.map(async (arId) => {
          const q = query(paymentsRef, where('arId', '==', arId));
          const snap = await getDocs(q);
          snap.forEach((docSnap) => {
            const data = docSnap.data() as Omit<ArPaymentDoc, 'id'>;
            const amount = resolveAmount(data as ArPaymentDoc);
            payments.push({
              id: docSnap.id,
              arId,
              dateMs: resolvePaymentDateMs(data as ArPaymentDoc),
              amount,
              methods: resolveMethods(data as ArPaymentDoc),
              comments: String((data as ArPaymentDoc)?.comments ?? ''),
            });
          });
        }),
      )
        .then(() => null)
        .catch((error) => error);

      if (!active) return;

      if (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : String(loadError);
        dispatch({ type: 'error', payload: message });
        return;
      }

      payments.sort((a, b) => b.dateMs - a.dateMs);
      dispatch({ type: 'success', payload: payments });
    };

    void load();

    return () => {
      active = false;
    };
  }, [arIds, businessId, invoiceId]);

  const totalArPaid = useMemo(
    () => rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0),
    [rows],
  );

  const posPaid = useMemo(() => {
    const gross = resolveMonetaryNumber(invoicePayment);
    const change = resolveMonetaryNumber(invoiceChange);
    return Math.max(0, gross - change);
  }, [invoiceChange, invoicePayment]);

  const balanceDue = useMemo(
    () => Math.max(0, Number(invoiceTotal || 0) - (posPaid + totalArPaid)),
    [invoiceTotal, posPaid, totalArPaid],
  );
  const formatAmount = (value: number | string | null | undefined) =>
    formatInvoicePrice(value, invoiceData);

  return (
    <StyledCard title="Pagos por CxC">
      {loading ? (
        <Center>
          <Spin />
        </Center>
      ) : error ? (
        <ErrorText>{error}</ErrorText>
      ) : rows.length === 0 ? (
        <EmptyText>No hay pagos registrados en CxC para esta factura.</EmptyText>
      ) : (
        <List>
          {rows.map((row) => {
            const dt = row.dateMs ? DateTime.fromMillis(row.dateMs) : null;
            const activeMethods = (row.methods ?? []).filter((m) => m?.status);
            return (
              <Row key={row.id}>
                <RowTop>
                  <RowDate>
                    {dt?.isValid ? dt.toFormat('dd/MM/yyyy HH:mm') : 'Sin fecha'}
                  </RowDate>
                  <RowAmount>{formatAmount(row.amount)}</RowAmount>
                </RowTop>
                {activeMethods.length > 0 && (
                  <RowMethods>
                    {activeMethods.map((m, idx) => (
                      <MethodPill key={`${m.method ?? 'method'}-${idx}`}>
                        {paymentMethodLabel[m.method ?? ''] ?? m.method ?? 'N/A'}:{' '}
                        {formatAmount(m.value ?? 0)}
                        {m.reference ? ` (${m.reference})` : ''}
                      </MethodPill>
                    ))}
                  </RowMethods>
                )}
                {row.comments ? <RowComment>{row.comments}</RowComment> : null}
              </Row>
            );
          })}
          <Divider style={{ margin: '12px 0' }} />
          <Totals>
            <TotalsRow>
              <span>Total pagado por CxC</span>
              <Mono>{formatAmount(totalArPaid)}</Mono>
            </TotalsRow>
            <TotalsRow>
              <span>Pagado en caja (snapshot)</span>
              <Mono>{formatAmount(posPaid)}</Mono>
            </TotalsRow>
            <TotalsRow>
              <span>Balance pendiente</span>
              <Mono>{formatAmount(balanceDue)}</Mono>
            </TotalsRow>
          </Totals>
        </List>
      )}
    </StyledCard>
  );
};

const StyledCard = styled(Card)`
  .ant-card-body {
    padding: 1rem;
  }
`;

const Center = styled.div`
  display: flex;
  justify-content: center;
  padding: 1rem;
`;

const List = styled.div`
  display: grid;
  gap: 0.75rem;
`;

const Row = styled.div`
  padding: 0.75rem;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fff;
`;

const RowTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.75rem;
`;

const RowDate = styled.div`
  font-size: 0.8rem;
  color: #666;
`;

const RowAmount = styled.div`
  font-family: monospace;
  font-weight: 700;
`;

const RowMethods = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const MethodPill = styled.div`
  font-size: 0.75rem;
  background: #f8f9fa;
  border: 1px solid #e8e8e8;
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
`;

const RowComment = styled.div`
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #333;
  white-space: pre-wrap;
`;

const Totals = styled.div`
  display: grid;
  gap: 0.4rem;
`;

const TotalsRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.85rem;
`;

const Mono = styled.span`
  font-family: monospace;
  font-weight: 700;
`;

const EmptyText = styled.div`
  color: #666;
`;

const ErrorText = styled.div`
  color: #c00;
`;
