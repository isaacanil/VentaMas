import {
  Button,
  Empty,
  Modal as AntdModal,
  Tag,
  Typography,
  message,
} from 'antd';
import { ProfileOutlined } from '@ant-design/icons';
import { DateTime } from 'luxon';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { ModalShell } from '@/components/common/Modal/ModalShell';
import { selectUser } from '@/features/auth/userSlice';
import { fbVoidAccountsPayablePayment } from '@/firebase/purchase/fbVoidAccountsPayablePayment';
import { useOpenAccountingEntry } from '@/modules/accounting/hooks/useOpenAccountingEntry';
import type {
  AccountsPayablePayment,
  PaymentMethodEntry,
} from '@/types/payments';
import type { UserIdentity } from '@/types/users';
import { hasManageAllAccess } from '@/utils/access/manageAllAccess';
import { toMillis } from '@/utils/date/toMillis';
import { formatPrice } from '@/utils/format/formatPrice';
import type { Purchase } from '@/utils/purchase/types';

import { useAccountsPayablePayments } from '../hooks/useAccountsPayablePayments';
import { resolveSupplierPaymentCallableErrorMessage } from '../utils/supplierPaymentErrors';

const { Text, Title } = Typography;

const roundToTwoDecimals = (value: number): number =>
  Math.round(value * 100) / 100;

const toFiniteNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

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

const resolvePaymentStatusTag = (status?: string | null) => {
  switch (String(status || '').toLowerCase()) {
    case 'void':
      return { color: 'red', label: 'Anulado' };
    case 'draft':
      return { color: 'gold', label: 'Borrador' };
    default:
      return { color: 'green', label: 'Registrado' };
  }
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
  const { payments, loading } = useAccountsPayablePayments(
    businessId,
    purchase?.id,
    open,
    {
      includeVoided: true,
    },
  );
  const canVoidPayments = hasManageAllAccess(user);

  const handleVoidPayment = (payment: AccountsPayablePayment) => {
    if (!user) {
      message.error('No se encontró un usuario válido.');
      return;
    }

    AntdModal.confirm({
      title: 'Anular pago',
      centered: true,
      okText: 'Anular',
      cancelText: 'Cancelar',
      okButtonProps: { danger: true },
      content: `Se anulará el recibo ${payment.receiptNumber ?? payment.id}. Esta acción recalculará el balance de la compra.`,
      onOk: async () => {
        try {
          await fbVoidAccountsPayablePayment(user, {
            paymentId: payment.id,
            reason: 'Anulado desde historial de pagos de compras.',
          });
          message.success('Pago anulado correctamente.');
        } catch (error) {
          console.error('Failed to void supplier payment', error);
          message.error(
            resolveSupplierPaymentCallableErrorMessage(
              error,
              'No se pudo anular el pago al proveedor.',
            ),
          );
        }
      },
    });
  };

  return (
    <ModalShell
      title="Historial de pagos"
      open={open}
      onCancel={onCancel}
      width={760}
      footer={[
        <Button key="close" onClick={onCancel}>
          Cerrar
        </Button>,
      ]}
      destroyOnHidden
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
        ) : payments.length === 0 ? (
          <Empty
            description="Esta compra todavía no tiene pagos registrados."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List>
            {payments.map((payment) => {
              const paymentMethods = normalizePaymentMethods(payment);
              const statusTag = resolvePaymentStatusTag(payment.status);

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
                    <Amount>{formatPrice(payment.totalAmount)}</Amount>
                  </CardHeader>

                  <MethodsList>
                    {paymentMethods.map((method, index) => {
                      const amount = resolvePaymentMethodAmount(method);
                      const label =
                        PAYMENT_METHOD_LABELS[String(method.method || '')] ??
                        String(method.method || 'Método');

                      return (
                        <MethodRow key={`${payment.id}-${label}-${index}`}>
                          <span>{label}</span>
                          <span>{formatPrice(amount)}</span>
                        </MethodRow>
                      );
                    })}
                  </MethodsList>

                  {typeof payment.metadata?.note === 'string' &&
                    payment.metadata.note.trim() && (
                      <MetaLine>Nota: {payment.metadata.note.trim()}</MetaLine>
                    )}
                  {payment.status === 'void' && payment.voidReason && (
                    <MetaLine>Motivo: {payment.voidReason}</MetaLine>
                  )}

                  <ActionsRow>
                    <Button
                      type="link"
                      icon={<ProfileOutlined />}
                      onClick={() =>
                        openAccountingEntry({
                          eventType:
                            payment.status === 'void'
                              ? 'accounts_payable.payment.voided'
                              : 'accounts_payable.payment.recorded',
                          sourceDocumentId: payment.id,
                          sourceDocumentType: 'accountsPayablePayment',
                        })
                      }
                    >
                      Ver asiento contable
                    </Button>
                    {payment.status !== 'void' && canVoidPayments ? (
                      <Button
                        danger
                        type="link"
                        onClick={() => handleVoidPayment(payment)}
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

const ActionsRow = styled.div`
  display: flex;
  justify-content: flex-end;
`;
