import { ProfileOutlined } from '@ant-design/icons';
import { Button, Card, Divider, Spin, Tooltip } from 'antd';
import { DateTime } from 'luxon';
import React, { useEffect, useMemo, useReducer } from 'react';
import styled from 'styled-components';

import {
  fetchAccountReceivablePaymentsByArIds,
  type AccountReceivablePaymentRecord,
} from '@/firebase/accountsReceivable/accountReceivablePayments.repository';
import { useAccountingRolloutEnabled } from '@/hooks/useAccountingRolloutEnabled';
import { useOpenAccountingEntry } from '@/modules/accounting/public';
import type {
  InvoiceData,
  InvoiceMonetaryValue,
  InvoicePaymentMethod,
} from '@/types/invoice';
import type { AccountsReceivableDoc } from '@/utils/accountsReceivable/types';
import type { UserIdentity } from '@/types/users';
import { formatInvoicePrice } from '@/utils/invoice/documentCurrency';
import { toMillis } from '@/utils/date/toMillis';

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

const resolveAmount = (payment: AccountReceivablePaymentRecord): number =>
  Number(payment.totalPaid ?? payment.totalAmount ?? payment.amount ?? 0) || 0;

const resolveMethods = (
  payment: AccountReceivablePaymentRecord,
): InvoicePaymentMethod[] => {
  const methods = payment.paymentMethods ?? payment.paymentMethod ?? [];
  return Array.isArray(methods) ? (methods as InvoicePaymentMethod[]) : [];
};

const resolvePaymentDateMs = (
  payment: AccountReceivablePaymentRecord,
): number => {
  const candidate = payment.date ?? payment.createdAt ?? null;
  return toMillis(candidate) ?? 0;
};

const resolveMonetaryNumber = (
  value: InvoiceMonetaryValue | undefined,
): number => {
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
  const openAccountingEntry = useOpenAccountingEntry();
  const isAccountingRolloutEnabled = useAccountingRolloutEnabled(businessId);
  const arIds = useMemo(
    () =>
      accountsReceivable
        .map((ar) => ar?.id)
        .filter(
          (id): id is string => typeof id === 'string' && id.trim().length > 0,
        ),
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

      try {
        const paymentDocs = await fetchAccountReceivablePaymentsByArIds({
          businessId,
          arIds,
        });
        if (!active) return;

        const payments = paymentDocs.map((payment) => ({
          id: payment.id,
          arId: typeof payment.arId === 'string' ? payment.arId : '',
          dateMs: resolvePaymentDateMs(payment),
          amount: resolveAmount(payment),
          methods: resolveMethods(payment),
          comments: String(payment.comments ?? ''),
        }));

        dispatch({ type: 'success', payload: payments });
      } catch (loadError) {
        if (!active) return;
        const message =
          loadError instanceof Error ? loadError.message : String(loadError);
        dispatch({ type: 'error', payload: message });
      }
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
        <EmptyText>
          No hay pagos registrados en CxC para esta factura.
        </EmptyText>
      ) : (
        <List>
          {rows.map((row) => {
            const dt = row.dateMs ? DateTime.fromMillis(row.dateMs) : null;
            const activeMethods = (row.methods ?? []).filter((m) => m?.status);
            const canOpenAccountingEntry =
              isAccountingRolloutEnabled && row.id.trim().length > 0;
            return (
              <Row key={row.id}>
                <RowTop>
                  <RowDate>
                    {dt?.isValid
                      ? dt.toFormat('dd/MM/yyyy HH:mm')
                      : 'Sin fecha'}
                  </RowDate>
                  <RowActions>
                    <RowAmount>{formatAmount(row.amount)}</RowAmount>
                    {canOpenAccountingEntry ? (
                      <Tooltip title="Ver asiento contable">
                        <Button
                          type="text"
                          size="small"
                          icon={<ProfileOutlined />}
                          onClick={() =>
                            openAccountingEntry({
                              eventType:
                                'accounts_receivable.payment.recorded',
                              sourceDocumentId: row.id,
                              sourceDocumentType: 'accountsReceivablePayment',
                            })
                          }
                        />
                      </Tooltip>
                    ) : null}
                  </RowActions>
                </RowTop>
                {activeMethods.length > 0 && (
                  <RowMethods>
                    {activeMethods.map((m) => (
                      <MethodPill
                        key={`${m.method ?? 'method'}-${m.reference ?? 'sin-ref'}-${m.value ?? 0}`}
                      >
                        {paymentMethodLabel[m.method ?? ''] ??
                          m.method ??
                          'N/A'}
                        : {formatAmount(m.value ?? 0)}
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

const RowActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
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
