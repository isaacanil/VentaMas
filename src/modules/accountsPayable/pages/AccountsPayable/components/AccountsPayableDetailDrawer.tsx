import { Button, Drawer, Empty, Skeleton, Tag, Typography } from 'antd';
import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import type { EvidenceFile } from '@/components/common/EvidenceUpload/types';
import {
  FileOutlined,
  ProfileOutlined,
  ShoppingCartOutlined,
} from '@/constants/icons/antd';
import { selectUser } from '@/features/auth/userSlice';
import { openFileCenter } from '@/features/files/fileSlice';
import { useOpenAccountingEntry } from '@/modules/accounting/hooks/useOpenAccountingEntry';
import { useAccountsPayablePayments } from '@/modules/orderAndPurchase/pages/OrderAndPurchase/Compra/components/PurchasesTable/hooks/useAccountsPayablePayments';
import type { AccountsPayablePayment, PaymentMethodEntry } from '@/types/payments';
import type { UserIdentity } from '@/types/users';
import { toMillis } from '@/utils/date/toMillis';
import { formatPrice } from '@/utils/format/formatPrice';

import type { AccountsPayableRow } from '../utils/accountsPayableDashboard';

const { Text, Title } = Typography;

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  supplierCreditNote: 'Saldo a favor',
};

const formatDate = (value: unknown): string => {
  const millis = toMillis(value as any);

  return millis
    ? new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium' }).format(millis)
    : 'Sin fecha';
};

const resolvePaymentMethodsLabel = (payment: AccountsPayablePayment): string =>
  (Array.isArray(payment.paymentMethods) ? payment.paymentMethods : [])
    .map((method: PaymentMethodEntry) => {
      const methodKey = String(method.method || '');
      return PAYMENT_METHOD_LABELS[methodKey] ?? methodKey;
    })
    .filter(Boolean)
    .join(', ') || 'Sin método';

const normalizeEvidenceFiles = (files: unknown): EvidenceFile[] =>
  (Array.isArray(files) ? files : []).flatMap((file, index) => {
    if (typeof file === 'string') {
      const trimmed = file.trim();
      return trimmed
        ? [
            {
              id: `evidence-${index}`,
              name: `Evidencia ${index + 1}`,
              url: trimmed,
              isLocal: false,
            },
          ]
        : [];
    }

    if (file && typeof file === 'object') {
      return [file as EvidenceFile];
    }

    return [];
  });

interface AccountsPayableDetailDrawerProps {
  onOpenPayments: () => void;
  onOpenPurchase: () => void;
  onRegisterPayment: () => void;
  onClose: () => void;
  open: boolean;
  row: AccountsPayableRow | null;
}

export const AccountsPayableDetailDrawer = ({
  onOpenPayments,
  onOpenPurchase,
  onRegisterPayment,
  onClose,
  open,
  row,
}: AccountsPayableDetailDrawerProps) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser) as UserIdentity | null;
  const openAccountingEntry = useOpenAccountingEntry();
  const businessId =
    user?.businessID ?? user?.businessId ?? user?.activeBusinessId ?? null;
  const { loading, payments } = useAccountsPayablePayments(
    businessId,
    row?.purchase.id,
    open,
    { includeVoided: true },
  );
  const visiblePayments = useMemo(() => payments.slice(0, 5), [payments]);
  const evidenceFiles = normalizeEvidenceFiles(row?.purchase.attachmentUrls);

  return (
    <Drawer
      destroyOnHidden
      onClose={onClose}
      open={open}
      title={row ? `CxP ${row.reference}` : 'Detalle de cuenta por pagar'}
      width={720}
    >
      {!row ? (
        <Empty description="Selecciona una cuenta por pagar." />
      ) : (
        <Content>
          <Header>
            <div>
              <Title level={4} style={{ margin: 0 }}>
                {row.providerName}
              </Title>
              <Text type="secondary">
                Balance abierto {formatPrice(row.balanceAmount)}
              </Text>
            </div>
            <HeaderActions>
              <Button
                icon={<ShoppingCartOutlined />}
                onClick={onOpenPurchase}
              >
                Ver compra
              </Button>
              <Button
                icon={<ProfileOutlined />}
                onClick={() =>
                  openAccountingEntry({
                    eventType: 'purchase.committed',
                    sourceDocumentId: row.purchase.id,
                    sourceDocumentType: 'purchase',
                  })
                }
              >
                Contabilidad
              </Button>
              <Button type="primary" onClick={onRegisterPayment}>
                Registrar pago
              </Button>
            </HeaderActions>
          </Header>

          <SummaryGrid>
            <SummaryCard>
              <span>Total compra</span>
              <strong>{formatPrice(row.totalAmount)}</strong>
            </SummaryCard>
            <SummaryCard>
              <span>Pagado</span>
              <strong>{formatPrice(row.paidAmount)}</strong>
            </SummaryCard>
            <SummaryCard>
              <span>Próximo vencimiento</span>
              <strong>{formatDate(row.dueAt)}</strong>
            </SummaryCard>
            <SummaryCard>
              <span>Aging</span>
              <strong>{row.agingLabel}</strong>
            </SummaryCard>
          </SummaryGrid>

          <Section>
            <SectionHeader>
              <Title level={5} style={{ margin: 0 }}>
                Trazabilidad
              </Title>
            </SectionHeader>
            <TraceabilityGrid>
              <TraceabilityItem>
                <span>Condición</span>
                <strong>{row.conditionLabel}</strong>
              </TraceabilityItem>
              <TraceabilityItem>
                <span>Pagos registrados</span>
                <strong>{row.paymentCount}</strong>
              </TraceabilityItem>
              <TraceabilityItem>
                <span>Evidencias compra</span>
                <strong>{row.evidenceCount}</strong>
              </TraceabilityItem>
            </TraceabilityGrid>
          </Section>

          <Section>
            <SectionHeader>
              <Title level={5} style={{ margin: 0 }}>
                Pagos recientes
              </Title>
              <Button onClick={onOpenPayments} size="small">
                Historial completo
              </Button>
            </SectionHeader>

            {loading ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : visiblePayments.length === 0 ? (
              <Empty
                description="Esta compra todavía no tiene pagos registrados."
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <PaymentList>
                {visiblePayments.map((payment) => (
                  <PaymentCard key={payment.id}>
                    <PaymentHeader>
                      <div>
                        <strong>{payment.receiptNumber ?? payment.id}</strong>
                        <MetaLine>
                          {formatDate(
                            payment.occurredAt instanceof Date
                              ? payment.occurredAt.getTime()
                              : (payment.occurredAt as number | null) ??
                                  (payment.createdAt as number | null),
                          )}
                        </MetaLine>
                      </div>
                      <Amount>{formatPrice(Number(payment.totalAmount ?? 0))}</Amount>
                    </PaymentHeader>
                    <MetaLine>{resolvePaymentMethodsLabel(payment)}</MetaLine>
                    <ActionsRow>
                      <Button
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
                        size="small"
                      >
                        Contabilidad
                      </Button>
                      {Array.isArray(payment.evidenceUrls) &&
                      payment.evidenceUrls.length > 0 ? (
                        <Button
                          icon={<FileOutlined />}
                          onClick={() =>
                            dispatch(
                              openFileCenter(
                                normalizeEvidenceFiles(payment.evidenceUrls) as any,
                              ),
                            )
                          }
                          size="small"
                        >
                          Evidencia pago
                        </Button>
                      ) : null}
                      <Tag color={payment.status === 'void' ? 'red' : 'green'}>
                        {payment.status === 'void' ? 'Anulado' : 'Registrado'}
                      </Tag>
                    </ActionsRow>
                  </PaymentCard>
                ))}
              </PaymentList>
            )}
          </Section>

          <Section>
            <SectionHeader>
              <Title level={5} style={{ margin: 0 }}>
                Evidencia de compra
              </Title>
            </SectionHeader>
            {evidenceFiles.length === 0 ? (
              <Empty
                description="La compra no tiene evidencias adjuntas."
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <EvidenceBlock>
                <Text type="secondary">
                  {evidenceFiles.length} archivo
                  {evidenceFiles.length === 1 ? '' : 's'} adjunto
                  {evidenceFiles.length === 1 ? '' : 's'} en la compra.
                </Text>
                <Button
                  icon={<FileOutlined />}
                  onClick={() => dispatch(openFileCenter(evidenceFiles as any))}
                >
                  Ver evidencia
                </Button>
              </EvidenceBlock>
            )}
          </Section>
        </Content>
      )}
    </Drawer>
  );
};

const Content = styled.div`
  display: grid;
  gap: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const SummaryCard = styled.div`
  display: grid;
  gap: 6px;
  padding: 16px;
  border: 1px solid var(--ds-color-border-default, #d9d9d9);
  border-radius: 14px;
  background: var(--ds-color-bg-surface, #fff);

  span {
    color: var(--ds-color-text-secondary, #666);
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  strong {
    color: var(--ds-color-text-primary, #111);
    font-size: 18px;
  }
`;

const Section = styled.section`
  display: grid;
  gap: 12px;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
`;

const TraceabilityGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const TraceabilityItem = styled.div`
  display: grid;
  gap: 4px;
  padding: 14px;
  border-radius: 12px;
  background: var(--ds-color-bg-subtle, #f7f7f7);

  span {
    color: var(--ds-color-text-secondary, #666);
    font-size: 12px;
  }

  strong {
    color: var(--ds-color-text-primary, #111);
  }
`;

const PaymentList = styled.div`
  display: grid;
  gap: 12px;
`;

const PaymentCard = styled.div`
  display: grid;
  gap: 10px;
  padding: 14px;
  border: 1px solid var(--ds-color-border-default, #d9d9d9);
  border-radius: 12px;
  background: var(--ds-color-bg-surface, #fff);
`;

const PaymentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  flex-wrap: wrap;
`;

const Amount = styled.strong`
  color: var(--ds-color-text-primary, #111);
`;

const MetaLine = styled.div`
  color: var(--ds-color-text-secondary, #666);
  font-size: 13px;
`;

const ActionsRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
`;

const EvidenceBlock = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 14px;
  border-radius: 12px;
  background: var(--ds-color-bg-subtle, #f7f7f7);
  flex-wrap: wrap;
`;
