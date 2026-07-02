import {
  Alert,
  Button,
  Drawer,
  Empty,
  Skeleton,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import type { EvidenceFile } from '@/components/common/EvidenceUpload';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  FileOutlined,
  ProfileOutlined,
  ShoppingCartOutlined,
} from '@/constants/icons/antd';
import { selectUser } from '@/features/auth/userSlice';
import { openFileCenter } from '@/features/files/fileSlice';
import { fbVoidAccountsPayablePayment } from '@/firebase/purchase/fbVoidAccountsPayablePayment';
import { useOpenAccountingEntry } from '@/modules/accounting/public';
import { useAccountsPayablePayments } from '@/modules/accountsPayable/hooks/useAccountsPayablePayments';
import { useVendorBillControlEvents } from '@/modules/accountsPayable/hooks/useVendorBillControlEvents';
import {
  isVoidedAccountsPayablePaymentStatus,
  resolveAccountsPayablePaymentAccountingEventType,
  resolveAccountsPayablePaymentStatusTag,
} from '@/modules/accountsPayable/utils/accountsPayablePaymentStatus';
import {
  SupplierPaymentVoidModal,
  resolveSupplierPaymentCallableErrorMessage,
} from '@/modules/orderAndPurchase/public';
import type {
  AccountsPayablePayment,
  PaymentMethodEntry,
} from '@/types/payments';
import type { UserIdentity } from '@/types/users';
import { hasFinancialDocumentVoidAccess } from '@/utils/access/financialDocumentVoidAccess';
import { toMillis } from '@/utils/date/toMillis';
import { formatPrice } from '@/utils/format/formatPrice';
import { resolvePaymentSettlementSummary } from '@/utils/payments/paymentSettlementSummary';
import { resolveUserIdentityBusinessId } from '@/utils/users/userIdentityAccess';
import type { ManageVendorBillControlAction } from '@/firebase/purchase/fbManageVendorBillControl';

import { AccountsPayableControlActionDropdown } from './AccountsPayableControlActionDropdown';
import { getAccountsPayableControlActionDefinition } from '../utils/accountsPayableControlActions';
import {
  buildAccountsPayablePaymentChecklist,
  type AccountsPayablePaymentChecklistTone,
  type AccountsPayableRow,
} from '../utils/accountsPayableDashboard';
import { getAccountsPayablePaymentBlockMessage } from '../utils/accountsPayablePaymentEligibility';

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

const formatDateTime = (value: unknown): string => {
  const millis = toMillis(value as any);

  return millis
    ? new Intl.DateTimeFormat('es-DO', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(millis)
    : 'Sin fecha';
};

const formatOptionalMoney = (value: number | null): string =>
  value == null ? 'Sin monto' : formatPrice(value);

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

const ACTION_TAG_COLORS: Record<ManageVendorBillControlAction, string> = {
  approve: 'green',
  request_approval: 'blue',
  reject: 'red',
  place_hold: 'gold',
  release_hold: 'green',
  open_dispute: 'red',
  resolve_dispute: 'green',
  void: 'red',
};

const CHECKLIST_TAG_COLORS: Record<AccountsPayablePaymentChecklistTone, string> =
  {
    danger: 'red',
    neutral: 'default',
    success: 'green',
    warning: 'gold',
  };

const renderChecklistIcon = (tone: AccountsPayablePaymentChecklistTone) => {
  if (tone === 'success') return <CheckCircleOutlined />;
  if (tone === 'danger') return <CloseCircleOutlined />;
  if (tone === 'warning') return <ExclamationCircleOutlined />;
  return <ClockCircleOutlined />;
};

interface AccountsPayableDetailDrawerProps {
  canManageControlAction: (action: ManageVendorBillControlAction) => boolean;
  canRegisterPayments: boolean;
  controlAccessDeniedMessage?: string;
  onOpenPayments: () => void;
  onOpenPurchase: () => void;
  onManageControl: (
    row: AccountsPayableRow,
    action: ManageVendorBillControlAction,
  ) => void;
  onRegisterPayment: () => void;
  onClose: () => void;
  open: boolean;
  row: AccountsPayableRow | null;
}

export const AccountsPayableDetailDrawer = ({
  canManageControlAction,
  canRegisterPayments,
  controlAccessDeniedMessage,
  onOpenPayments,
  onOpenPurchase,
  onManageControl,
  onRegisterPayment,
  onClose,
  open,
  row,
}: AccountsPayableDetailDrawerProps) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser) as UserIdentity | null;
  const openAccountingEntry = useOpenAccountingEntry();
  const [voidingPayment, setVoidingPayment] =
    useState<AccountsPayablePayment | null>(null);
  const [voidSubmitting, setVoidSubmitting] = useState(false);
  const businessId = resolveUserIdentityBusinessId(user);
  const {
    error: paymentsError,
    loading,
    payments,
  } = useAccountsPayablePayments(businessId, row?.purchase.id, open, {
    includeVoided: true,
  });
  const {
    error: controlEventsError,
    events: controlEvents,
    loading: controlEventsLoading,
  } = useVendorBillControlEvents(businessId, row?.vendorBill.id, open, {
    limit: 6,
  });
  const visiblePayments = useMemo(() => payments.slice(0, 5), [payments]);
  const canVoidPayments = hasFinancialDocumentVoidAccess(user);
  const evidenceFiles = normalizeEvidenceFiles(row?.purchase.attachmentUrls);
  const fiscalWithholdingTotal = row
    ? Number(row.fiscalSnapshot.withholdingITBISAmount ?? 0) +
      Number(row.fiscalSnapshot.withholdingISRAmount ?? 0)
    : 0;
  const paymentBlockMessage = row
    ? getAccountsPayablePaymentBlockMessage({
        canRegisterPayments,
        row,
      })
    : null;
  const paymentChecklist = row
    ? buildAccountsPayablePaymentChecklist(row)
    : null;

  const handleClose = () => {
    if (voidSubmitting) return;
    setVoidingPayment(null);
    onClose();
  };

  const handleVoidPayment = (payment: AccountsPayablePayment) => {
    if (!user) {
      message.error('No se encontró un usuario válido.');
      return;
    }

    setVoidingPayment(payment);
  };

  const closeVoidModal = () => {
    if (voidSubmitting) return;
    setVoidingPayment(null);
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
      console.error('Failed to void supplier payment from AP detail', error);
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
      <Drawer
        destroyOnHidden
        onClose={handleClose}
        open={open}
        size={720}
        title={row ? `CxP ${row.reference}` : 'Detalle de cuenta por pagar'}
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
                <AccountsPayableControlActionDropdown
                  canManageAction={canManageControlAction}
                  disabledReason={controlAccessDeniedMessage}
                  onSelectAction={onManageControl}
                  row={row}
                />
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
                <Tooltip title={paymentBlockMessage ?? ''}>
                  <span>
                    <Button
                      disabled={Boolean(paymentBlockMessage)}
                      type="primary"
                      onClick={onRegisterPayment}
                    >
                      Registrar pago
                    </Button>
                  </span>
                </Tooltip>
              </HeaderActions>
            </Header>

            {!row.paymentControl.canRegisterPayment ? (
              <ControlBanner $tone={row.paymentControl.tone} role="status">
                <strong>{row.paymentControl.label}</strong>
                <span>
                  {row.paymentControl.reason ??
                    'Debe liberarse antes de registrar pagos.'}
                </span>
              </ControlBanner>
            ) : null}

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

            {paymentChecklist ? (
              <ChecklistPanel
                $tone={paymentChecklist.tone}
                aria-label="Checklist de pago"
              >
                <ChecklistHeader>
                  <div>
                    <Title level={5} style={{ margin: 0 }}>
                      Checklist de pago
                    </Title>
                    <Text type="secondary">{paymentChecklist.description}</Text>
                  </div>
                  <Tag color={CHECKLIST_TAG_COLORS[paymentChecklist.tone]}>
                    {paymentChecklist.label}
                  </Tag>
                </ChecklistHeader>
                <ChecklistGrid>
                  {paymentChecklist.items.map((item) => (
                    <ChecklistItem $tone={item.tone} key={item.key}>
                      <ChecklistIcon $tone={item.tone}>
                        {renderChecklistIcon(item.tone)}
                      </ChecklistIcon>
                      <ChecklistContent>
                        <ChecklistItemHeader>
                          <strong>{item.label}</strong>
                          <Tag color={CHECKLIST_TAG_COLORS[item.tone]}>
                            {item.statusLabel}
                          </Tag>
                        </ChecklistItemHeader>
                        <span>{item.detail}</span>
                      </ChecklistContent>
                    </ChecklistItem>
                  ))}
                </ChecklistGrid>
              </ChecklistPanel>
            ) : null}

            <Section>
              <SectionHeader>
                <Title level={5} style={{ margin: 0 }}>
                  Contabilidad
                </Title>
              </SectionHeader>
              <TraceabilityGrid>
                <TraceabilityItem>
                  <span>Estado contable</span>
                  <strong>
                    <Tag
                      color={
                        row.accountingSnapshot.posted ? 'green' : 'gold'
                      }
                    >
                      {row.accountingSnapshot.statusLabel}
                    </Tag>
                  </strong>
                </TraceabilityItem>
                <TraceabilityItem>
                  <span>Fecha contable</span>
                  <strong>
                    {formatDate(row.accountingSnapshot.accountingDate)}
                  </strong>
                </TraceabilityItem>
                <TraceabilityItem>
                  <span>Posteo operativo</span>
                  <strong>{formatDate(row.accountingSnapshot.postedAt)}</strong>
                </TraceabilityItem>
                <TraceabilityItem>
                  <span>Naturaleza</span>
                  <strong>{row.accountingSnapshot.documentNatureLabel}</strong>
                </TraceabilityItem>
                <TraceabilityItem>
                  <span>Liquidación</span>
                  <strong>
                    {row.accountingSnapshot.settlementTimingLabel}
                  </strong>
                </TraceabilityItem>
                <TraceabilityItem>
                  <span>Origen</span>
                  <strong>
                    {row.accountingSnapshot.sourceDocumentType ?? 'Sin origen'}
                  </strong>
                  <small>
                    {row.accountingSnapshot.sourceDocumentId ??
                      row.purchase.id ??
                      'Sin documento'}
                  </small>
                </TraceabilityItem>
              </TraceabilityGrid>
            </Section>

            <Section>
              <SectionHeader>
                <Title level={5} style={{ margin: 0 }}>
                  Documento fiscal
                </Title>
              </SectionHeader>
              <TraceabilityGrid>
                <TraceabilityItem>
                  <span>NCF</span>
                  <strong>{row.fiscalSnapshot.fiscalLabel}</strong>
                </TraceabilityItem>
                <TraceabilityItem>
                  <span>Factura proveedor</span>
                  <strong>{row.fiscalSnapshot.vendorReferenceLabel}</strong>
                </TraceabilityItem>
                <TraceabilityItem>
                  <span>Tipo documento</span>
                  <strong>
                    {row.fiscalSnapshot.documentType ?? 'Sin tipo'}
                  </strong>
                </TraceabilityItem>
                <TraceabilityItem>
                  <span>Tipo gasto DGII</span>
                  <strong>
                    {row.fiscalSnapshot.dgii606ExpenseType ?? 'Sin clasificar'}
                  </strong>
                </TraceabilityItem>
                <TraceabilityItem>
                  <span>Fecha factura</span>
                  <strong>{formatDate(row.fiscalSnapshot.billDate)}</strong>
                </TraceabilityItem>
                <TraceabilityItem>
                  <span>Neto fiscal</span>
                  <strong>
                    {formatOptionalMoney(row.fiscalSnapshot.netPayableAmount)}
                  </strong>
                  <small>
                    ITBIS {formatOptionalMoney(row.fiscalSnapshot.taxAmount)} ·
                    Ret. {formatPrice(fiscalWithholdingTotal)}
                  </small>
                </TraceabilityItem>
              </TraceabilityGrid>
            </Section>

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
                  Historial de control
                </Title>
              </SectionHeader>
              {controlEventsLoading ? (
                <Skeleton active paragraph={{ rows: 3 }} />
              ) : controlEventsError ? (
                <Alert
                  message="No se pudo cargar el historial de control."
                  showIcon
                  type="warning"
                />
              ) : controlEvents.length === 0 ? (
                <Empty
                  description="No hay eventos de control registrados."
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <ControlEventList>
                  {controlEvents.map((event) => {
                    const definition =
                      getAccountsPayableControlActionDefinition(event.action);
                    const controlEvidenceFiles = normalizeEvidenceFiles(
                      event.evidenceUrls,
                    );

                    return (
                      <ControlEventItem key={event.id}>
                        <ControlEventHeader>
                          <Tag color={ACTION_TAG_COLORS[event.action]}>
                            {definition?.label ?? event.action}
                          </Tag>
                          <MetaLine>{formatDateTime(event.createdAt)}</MetaLine>
                        </ControlEventHeader>
                        {event.reason ? (
                          <ControlEventReason>
                            {event.reason}
                          </ControlEventReason>
                        ) : null}
                        {event.evidenceNote ? (
                          <MetaLine>Evidencia: {event.evidenceNote}</MetaLine>
                        ) : null}
                        {controlEvidenceFiles.length > 0 ? (
                          <ActionsRow>
                            <Button
                              icon={<FileOutlined />}
                              onClick={() =>
                                dispatch(
                                  openFileCenter(controlEvidenceFiles as any),
                                )
                              }
                              size="small"
                            >
                              Evidencia control
                            </Button>
                          </ActionsRow>
                        ) : null}
                        <MetaLine>
                          Estado:{' '}
                          {event.previousControl?.status ?? 'sin estado'} a{' '}
                          {event.nextControl?.status ?? 'sin estado'} - Usuario{' '}
                          {event.createdBy ?? 'no identificado'}
                        </MetaLine>
                      </ControlEventItem>
                    );
                  })}
                </ControlEventList>
              )}
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
              ) : paymentsError ? (
                <Alert
                  message="No se pudieron cargar los pagos recientes."
                  showIcon
                  type="warning"
                />
              ) : visiblePayments.length === 0 ? (
                <Empty
                  description="Esta compra todavía no tiene pagos registrados."
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <PaymentList>
                  {visiblePayments.map((payment) => {
                    const settlementSummary =
                      resolvePaymentSettlementSummary(payment);
                    const isVoidedPayment =
                      isVoidedAccountsPayablePaymentStatus(payment.status);
                    const statusTag = resolveAccountsPayablePaymentStatusTag(
                      payment.status,
                    );

                    return (
                      <PaymentCard key={payment.id}>
                        <PaymentHeader>
                          <div>
                            <strong>
                              {payment.receiptNumber ?? payment.id}
                            </strong>
                            <MetaLine>
                              {formatDate(
                                payment.occurredAt instanceof Date
                                  ? payment.occurredAt.getTime()
                                  : ((payment.occurredAt as number | null) ??
                                      (payment.createdAt as number | null)),
                              )}
                            </MetaLine>
                          </div>
                          <AmountStack>
                            <span>Salida de caja</span>
                            <Amount>
                              {formatPrice(settlementSummary.cashAmount)}
                            </Amount>
                          </AmountStack>
                        </PaymentHeader>
                        <MetaLine>
                          {resolvePaymentMethodsLabel(payment)}
                        </MetaLine>
                        {settlementSummary.hasWithholdingSettlement ? (
                          <SettlementGrid aria-label="Desglose de liquidación fiscal del pago">
                            <SettlementItem>
                              <span>Retención fiscal</span>
                              <strong>
                                {formatPrice(
                                  settlementSummary.withholdingAmount,
                                )}
                              </strong>
                            </SettlementItem>
                            <SettlementItem>
                              <span>Total liquidado</span>
                              <strong>
                                {formatPrice(
                                  settlementSummary.settlementAmount,
                                )}
                              </strong>
                            </SettlementItem>
                            {settlementSummary.withholdingBreakdown.map(
                              (line) => (
                                <SettlementItem
                                  key={`${payment.id}-${line.type}-${line.amount}`}
                                >
                                  <span>{line.label}</span>
                                  <strong>{formatPrice(line.amount)}</strong>
                                </SettlementItem>
                              ),
                            )}
                          </SettlementGrid>
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
                                    normalizeEvidenceFiles(
                                      payment.evidenceUrls,
                                    ) as any,
                                  ),
                                )
                              }
                              size="small"
                            >
                              Evidencia pago
                            </Button>
                          ) : null}
                          {!isVoidedPayment && canVoidPayments ? (
                            <Button
                              danger
                              onClick={() => handleVoidPayment(payment)}
                              size="small"
                            >
                              Anular
                            </Button>
                          ) : null}
                          <Tag color={statusTag.color}>{statusTag.label}</Tag>
                        </ActionsRow>
                      </PaymentCard>
                    );
                  })}
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
                    onClick={() =>
                      dispatch(openFileCenter(evidenceFiles as any))
                    }
                  >
                    Ver evidencia
                  </Button>
                </EvidenceBlock>
              )}
            </Section>
          </Content>
        )}
      </Drawer>

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

const ControlBanner = styled.div<{
  $tone: 'danger' | 'warning' | 'neutral' | 'success';
}>`
  display: grid;
  gap: 4px;
  padding: 12px 14px;
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'danger'
        ? 'rgba(207, 19, 34, 0.32)'
        : $tone === 'warning'
          ? 'rgba(173, 104, 0, 0.32)'
          : 'rgba(89, 89, 89, 0.24)'};
  border-radius: 10px;
  background: ${({ $tone }) =>
    $tone === 'danger'
      ? 'rgba(255, 77, 79, 0.08)'
      : $tone === 'warning'
        ? 'rgba(250, 173, 20, 0.1)'
        : 'rgba(140, 140, 140, 0.08)'};

  strong {
    color: ${({ $tone }) =>
      $tone === 'danger'
        ? '#cf1322'
        : $tone === 'warning'
          ? '#ad6800'
          : '#595959'};
  }

  span {
    color: var(--ds-color-text-secondary, #555);
    font-size: 13px;
  }
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (width <= 640px) {
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

  @media (width <= 640px) {
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

  small {
    color: var(--ds-color-text-secondary, #666);
    font-size: 12px;
  }
`;

const ChecklistPanel = styled.section<{
  $tone: AccountsPayablePaymentChecklistTone;
}>`
  container-type: inline-size;
  display: grid;
  gap: 14px;
  padding: 16px;
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'danger'
        ? 'rgba(207, 19, 34, 0.3)'
        : $tone === 'warning'
          ? 'rgba(173, 104, 0, 0.3)'
          : 'rgba(82, 196, 26, 0.28)'};
  border-radius: 12px;
  background: ${({ $tone }) =>
    $tone === 'danger'
      ? 'rgba(255, 77, 79, 0.06)'
      : $tone === 'warning'
        ? 'rgba(250, 173, 20, 0.08)'
        : 'rgba(82, 196, 26, 0.06)'};
`;

const ChecklistHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  flex-wrap: wrap;
`;

const ChecklistGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;

  @container (min-width: 560px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const ChecklistItem = styled.div<{
  $tone: AccountsPayablePaymentChecklistTone;
}>`
  display: flex;
  gap: 10px;
  min-width: 0;
  padding: 12px;
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'danger'
        ? 'rgba(207, 19, 34, 0.24)'
        : $tone === 'warning'
          ? 'rgba(173, 104, 0, 0.24)'
          : 'var(--ds-color-border-default, #d9d9d9)'};
  border-radius: 8px;
  background: var(--ds-color-bg-surface, #fff);
`;

const ChecklistIcon = styled.span<{
  $tone: AccountsPayablePaymentChecklistTone;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  color: ${({ $tone }) =>
    $tone === 'danger'
      ? '#cf1322'
      : $tone === 'warning'
        ? '#ad6800'
        : $tone === 'success'
          ? '#237804'
          : '#595959'};
  background: ${({ $tone }) =>
    $tone === 'danger'
      ? 'rgba(255, 77, 79, 0.12)'
      : $tone === 'warning'
        ? 'rgba(250, 173, 20, 0.16)'
        : $tone === 'success'
          ? 'rgba(82, 196, 26, 0.14)'
          : 'rgba(140, 140, 140, 0.12)'};
`;

const ChecklistContent = styled.div`
  display: grid;
  gap: 5px;
  min-width: 0;

  span {
    color: var(--ds-color-text-secondary, #666);
    font-size: 12px;
    overflow-wrap: anywhere;
  }
`;

const ChecklistItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;

  strong {
    color: var(--ds-color-text-primary, #111);
  }
`;

const PaymentList = styled.div`
  display: grid;
  gap: 12px;
`;

const ControlEventList = styled.div`
  display: grid;
  gap: 10px;
`;

const ControlEventItem = styled.div`
  display: grid;
  gap: 7px;
  padding: 12px;
  border: 1px solid var(--ds-color-border-default, #d9d9d9);
  border-radius: 8px;
  background: var(--ds-color-bg-surface, #fff);
`;

const ControlEventHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
`;

const ControlEventReason = styled.strong`
  color: var(--ds-color-text-primary, #111);
  font-size: 13px;
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

const AmountStack = styled.div`
  display: grid;
  gap: 2px;
  justify-items: end;

  span {
    color: var(--ds-color-text-secondary, #666);
    font-size: 12px;
  }

  @media (width <= 520px) {
    justify-items: start;
  }
`;

const MetaLine = styled.div`
  color: var(--ds-color-text-secondary, #666);
  font-size: 13px;
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
  background: var(--ds-color-bg-subtle, #f7f7f7);

  span {
    overflow: hidden;
    color: var(--ds-color-text-secondary, #666);
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    color: var(--ds-color-text-primary, #111);
    font-size: 13px;
  }
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
