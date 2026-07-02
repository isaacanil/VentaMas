import { ProfileOutlined } from '@ant-design/icons';
import { Alert, Button, Empty, Tag, Typography, message } from 'antd';
import { DateTime } from 'luxon';
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { ModalShell } from '@/components/common/Modal';
import { selectUser } from '@/features/auth/userSlice';
import { fbVoidAccountsPayablePayment } from '@/firebase/purchase/fbVoidAccountsPayablePayment';
import { useOpenAccountingEntry } from '@/modules/accounting/public';
import { useAccountsPayablePayments } from '@/modules/accountsPayable/public';
import {
  isVoidedAccountsPayablePaymentStatus,
  resolveAccountsPayablePaymentAccountingEventType,
  resolveAccountsPayablePaymentStatusTag,
} from '@/modules/accountsPayable/utils/accountsPayablePaymentStatus';
import type {
  AccountsPayablePayment,
  PaymentMethodEntry,
} from '@/types/payments';
import type { UserIdentity } from '@/types/users';
import { hasFinancialDocumentVoidAccess } from '@/utils/access/financialDocumentVoidAccess';
import { toMillis } from '@/utils/date/toMillis';
import { formatPrice } from '@/utils/format/formatPrice';
import { resolvePaymentSettlementSummary } from '@/utils/payments/paymentSettlementSummary';
import type { Purchase } from '@/utils/purchase/types';

import { SupplierPaymentVoidModal } from './SupplierPaymentVoidModal';
import { resolveSupplierPaymentCallableErrorMessage } from './utils/supplierPaymentErrors';
import {
  roundToTwoDecimals,
  toFiniteNumber,
} from './utils/supplierPaymentMethods';

const { Text, Title } = Typography;

const resolvePaymentMethodAmount = (method: PaymentMethodEntry): number =>
  roundToTwoDecimals(
    Math.max(toFiniteNumber(method.value ?? method.amount) ?? 0, 0),
  );

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  supplierCreditNote: 'Saldo a favor',
};

const formatPaymentDate = (value: unknown): string => {
  const millis = toMillis(value);
  if (!millis) {
    return 'Sin fecha';
  }

  return DateTime.fromMillis(millis).toFormat('dd/MM/yyyy HH:mm');
};

const resolveProviderName = (purchase: Purchase | null): string | null => {
  if (!purchase?.provider) return null;
  if (typeof purchase.provider === 'string') {
    return purchase.provider.trim() || null;
  }
  if (typeof purchase.provider === 'object') {
    const provider = purchase.provider as { name?: string | null };
    return provider.name?.trim() || null;
  }
  return null;
};

const normalizePaymentMethods = (
  payment: AccountsPayablePayment,
): PaymentMethodEntry[] =>
  (Array.isArray(payment.paymentMethods) ? payment.paymentMethods : []).filter(
    (method) => resolvePaymentMethodAmount(method) > 0.01,
  );

interface SupplierPaymentHistoryModalProps {
  open: boolean;
  purchase: Purchase | null;
  onCancel: () => void;
}

export const SupplierPaymentHistoryModal = ({
  open,
  purchase,
  onCancel,
}: SupplierPaymentHistoryModalProps) => {
  const user = useSelector(selectUser) as UserIdentity | null;
  const openAccountingEntry = useOpenAccountingEntry();
  const businessId =
    user?.businessID ?? user?.businessId ?? user?.activeBusinessId ?? null;
  const providerName = useMemo(() => resolveProviderName(purchase), [purchase]);
  const {
    error: paymentsError,
    loading,
    payments,
  } = useAccountsPayablePayments(businessId, purchase?.id, open, {
    includeVoided: true,
  });
  const canVoidPayments = hasFinancialDocumentVoidAccess(user);
  const [voidingPayment, setVoidingPayment] =
    useState<AccountsPayablePayment | null>(null);
  const [voidSubmitting, setVoidSubmitting] = useState(false);

  const closeVoidModal = () => {
    if (voidSubmitting) return;
    setVoidingPayment(null);
  };

  const handleVoidPayment = (payment: AccountsPayablePayment) => {
    if (!user) {
      message.error('No se encontró un usuario válido.');
      return;
    }

    setVoidingPayment(payment);
  };

  const handleConfirmVoidPayment = async (
    reason: string,
    evidenceNote: string,
  ) => {
    if (!user || !voidingPayment) return;

    setVoidSubmitting(true);
    try {
      await fbVoidAccountsPayablePayment(user, {
        evidenceNote,
        paymentId: voidingPayment.id,
        reason,
      });
      message.success('Pago anulado correctamente.');
      setVoidingPayment(null);
    } catch (error) {
      console.error('Failed to void supplier payment', error);
      message.error(
        resolveSupplierPaymentCallableErrorMessage(
          error,
          'No se pudo anular el pago al proveedor.',
        ),
      );
    } finally {
      setVoidSubmitting(false);
    }
  };

  return (
    <>
      <ModalShell
        destroyOnHidden
        footer={[
          <Button key="close" onClick={onCancel}>
            Cerrar
          </Button>,
        ]}
        onCancel={onCancel}
        open={open}
        title="Historial de pagos"
        width={760}
      >
        <Content>
          <Header>
            <div>
              <Title level={5} style={{ margin: 0 }}>
                {providerName ?? `Compra ${purchase?.numberId ?? ''}`}
              </Title>
              <Text type="secondary">
                {purchase?.paymentState?.status
                  ? `Estado actual: ${String(
                      purchase.paymentState.status,
                    ).replace(/_/g, ' ')}`
                  : 'Sin estado de pago'}
              </Text>
            </div>
            <Summary>
              <Text type="secondary">Pagado</Text>
              <strong>
                {formatPrice(toFiniteNumber(purchase?.paymentState?.paid) ?? 0)}
              </strong>
            </Summary>
          </Header>

          {loading ? (
            <Empty
              description="Cargando pagos..."
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : paymentsError ? (
            <Alert
              message="No se pudo cargar el historial de pagos."
              showIcon
              type="warning"
            />
          ) : payments.length === 0 ? (
            <Empty
              description="Esta compra todavía no tiene pagos registrados."
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <List>
              {payments.map((payment) => {
                const paymentMethods = normalizePaymentMethods(payment);
                const settlementSummary =
                  resolvePaymentSettlementSummary(payment);
                const isVoidedPayment =
                  isVoidedAccountsPayablePaymentStatus(payment.status);
                const statusTag = resolveAccountsPayablePaymentStatusTag(
                  payment.status,
                );

                return (
                  <PaymentCard key={payment.id}>
                    <CardHeader>
                      <CardTitleGroup>
                        <div>
                          <strong>{payment.receiptNumber ?? payment.id}</strong>
                          <MetaLine>
                            {formatPaymentDate(
                              payment.occurredAt ?? payment.createdAt,
                            )}
                          </MetaLine>
                        </div>
                        <Tag color={statusTag.color}>{statusTag.label}</Tag>
                      </CardTitleGroup>
                      <AmountStack>
                        <span>Salida de caja</span>
                        <Amount>
                          {formatPrice(settlementSummary.cashAmount)}
                        </Amount>
                      </AmountStack>
                    </CardHeader>

                    <MethodsList>
                      {paymentMethods.map((method) => {
                        const amount = resolvePaymentMethodAmount(method);
                        const label =
                          PAYMENT_METHOD_LABELS[String(method.method || '')] ??
                          String(method.method || 'Método');

                        return (
                          <MethodRow key={`${payment.id}-${label}-${amount}`}>
                            <span>{label}</span>
                            <span>{formatPrice(amount)}</span>
                          </MethodRow>
                        );
                      })}
                    </MethodsList>

                    {settlementSummary.hasWithholdingSettlement ? (
                      <SettlementGrid
                        aria-label="Desglose de liquidación fiscal del pago"
                      >
                        <SettlementItem>
                          <span>Retención fiscal</span>
                          <strong>
                            {formatPrice(settlementSummary.withholdingAmount)}
                          </strong>
                        </SettlementItem>
                        <SettlementItem>
                          <span>Total liquidado</span>
                          <strong>
                            {formatPrice(settlementSummary.settlementAmount)}
                          </strong>
                        </SettlementItem>
                        {settlementSummary.withholdingBreakdown.map((line) => (
                          <SettlementItem
                            key={`${payment.id}-${line.type}-${line.amount}`}
                          >
                            <span>{line.label}</span>
                            <strong>{formatPrice(line.amount)}</strong>
                          </SettlementItem>
                        ))}
                      </SettlementGrid>
                    ) : null}

                    {typeof payment.metadata?.note === 'string' &&
                      payment.metadata.note.trim() && (
                        <MetaLine>
                          Nota: {payment.metadata.note.trim()}
                        </MetaLine>
                      )}
                    {typeof payment.evidenceNote === 'string' &&
                    payment.evidenceNote.trim() ? (
                      <MetaLine>
                        Evidencia de registro: {payment.evidenceNote.trim()}
                      </MetaLine>
                    ) : null}
                    {isVoidedPayment && payment.voidReason ? (
                      <MetaLine>Motivo: {payment.voidReason}</MetaLine>
                    ) : null}
                    {isVoidedPayment &&
                    typeof payment.voidEvidenceNote === 'string' &&
                    payment.voidEvidenceNote.trim() ? (
                      <MetaLine>
                        Evidencia de anulación:{' '}
                        {payment.voidEvidenceNote.trim()}
                      </MetaLine>
                    ) : null}

                    <ActionsRow>
                      <Button
                        icon={<ProfileOutlined />}
                        onClick={() =>
                          openAccountingEntry({
                            eventType:
                              resolveAccountsPayablePaymentAccountingEventType(
                                payment.status,
                              ),
                            sourceDocumentId: payment.id,
                            sourceDocumentType: 'accountsPayablePayment',
                          })
                        }
                        type="link"
                      >
                        Ver asiento contable
                      </Button>
                      {!isVoidedPayment && canVoidPayments ? (
                        <Button
                          danger
                          onClick={() => handleVoidPayment(payment)}
                          type="link"
                        >
                          Anular pago
                        </Button>
                      ) : null}
                    </ActionsRow>
                  </PaymentCard>
                );
              })}
            </List>
          )}
        </Content>
      </ModalShell>

      {voidingPayment ? (
        <SupplierPaymentVoidModal
          key={voidingPayment.id}
          onCancel={closeVoidModal}
          onConfirm={handleConfirmVoidPayment}
          open={Boolean(voidingPayment)}
          payment={voidingPayment}
          submitting={voidSubmitting}
        />
      ) : null}
    </>
  );
};

const Content = styled.div`
  display: grid;
  gap: 16px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
`;

const Summary = styled.div`
  display: grid;
  gap: 2px;
  justify-items: end;
`;

const List = styled.div`
  display: grid;
  gap: 12px;
`;

const PaymentCard = styled.div`
  display: grid;
  gap: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  padding: 14px 16px;
  background: #fff;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  flex-wrap: wrap;
`;

const CardTitleGroup = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
`;

const MethodsList = styled.div`
  display: grid;
  gap: 6px;
`;

const MethodRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #434343;
`;

const MetaLine = styled.div`
  color: #8c8c8c;
  font-size: 12px;
`;

const Amount = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #262626;
`;

const AmountStack = styled.div`
  display: grid;
  gap: 2px;
  justify-items: end;

  span {
    color: #8c8c8c;
    font-size: 12px;
  }

  @media (max-width: 520px) {
    justify-items: start;
  }
`;

const SettlementGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px;
  min-width: 0;
`;

const SettlementItem = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
  padding: 8px 10px;
  border-radius: 8px;
  background: #fafafa;

  span {
    overflow: hidden;
    color: #8c8c8c;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    color: #262626;
    font-size: 13px;
  }
`;

const ActionsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
`;
