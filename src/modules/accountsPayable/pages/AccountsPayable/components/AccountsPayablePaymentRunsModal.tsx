import { DollarCircleOutlined } from '@ant-design/icons';
import { Alert, Button, Empty, Input, Modal, Skeleton, Tag, Typography, message } from 'antd';
import { useState } from 'react';
import styled from 'styled-components';

import type { ManageAccountsPayablePaymentRunAction } from '@/firebase/purchase/fbManageAccountsPayablePaymentRun';
import type {
  AccountsPayablePaymentRun,
  AccountsPayablePaymentRunEvent,
  AccountsPayablePaymentRunLine,
} from '@/modules/accountsPayable/repositories/paymentRuns.repository';
import { toMillis } from '@/utils/date/toMillis';
import { formatPrice } from '@/utils/format/formatPrice';

const { Text } = Typography;
const { TextArea } = Input;

export interface AccountsPayablePaymentRunActionInput {
  action: ManageAccountsPayablePaymentRunAction;
  evidenceNote: string | null;
  paymentRunId: string;
  reason: string;
}

export interface AccountsPayablePaymentRunPaymentInput {
  paymentRunId: string;
  vendorBillId: string;
}

interface AccountsPayablePaymentRunsModalProps {
  canManageRunAction?: (
    action: ManageAccountsPayablePaymentRunAction,
  ) => boolean;
  canRegisterPayments?: boolean;
  error?: Error | null;
  eventsByPaymentRunId?: Record<string, AccountsPayablePaymentRunEvent[]>;
  eventsError?: Error | null;
  eventsHasMore?: boolean;
  eventsLoading?: boolean;
  eventsRawDocCount?: number;
  getManageRunActionDeniedMessage?: (
    action: ManageAccountsPayablePaymentRunAction,
  ) => string | null;
  hasMore?: boolean;
  loading?: boolean;
  onClose: () => void;
  onManageRun?: (
    input: AccountsPayablePaymentRunActionInput,
  ) => Promise<void> | void;
  onRegisterPayment?: (
    input: AccountsPayablePaymentRunPaymentInput,
  ) => Promise<void> | void;
  open: boolean;
  rawDocCount?: number;
  runs: AccountsPayablePaymentRun[];
}

interface PaymentRunActionDefinition {
  evidenceRequired: boolean;
  label: string;
  confirmLabel: string;
  reasonPlaceholder: string;
  title: string;
  tone?: 'danger';
}

interface PaymentRunActionRequest {
  action: ManageAccountsPayablePaymentRunAction;
  run: AccountsPayablePaymentRun;
}

interface AvailablePaymentRunAction {
  action: ManageAccountsPayablePaymentRunAction;
  canManage: boolean;
  deniedMessage: string | null;
}

interface PaymentRunExecutionSummaryViewModel {
  executedLineCount: number;
  lastPaymentAt?: unknown;
  lastPaymentId?: string | null;
  paidCashAmount: number;
  paidSettlementAmount: number;
  paidWithholdingAmount: number;
  partialLineCount: number;
  pendingLineCount: number;
  totalLineCount: number;
}

const STATUS_LABELS: Record<string, string> = {
  approved: 'Aprobada',
  canceled: 'Cancelada',
  draft: 'Borrador',
  rejected: 'Rechazada',
  submitted: 'En aprobación',
};

const STATUS_COLORS: Record<string, string> = {
  approved: 'green',
  canceled: 'default',
  draft: 'blue',
  rejected: 'red',
  submitted: 'gold',
};

const APPROVAL_LABELS: Record<string, string> = {
  approved: 'Aprobada',
  canceled: 'Cancelada',
  pending_approval: 'Pendiente',
  pending_review: 'Revisión',
  rejected: 'Rechazada',
};

const EXECUTION_LABELS: Record<string, string> = {
  executed: 'Ejecutada',
  failed: 'Fallida',
  in_progress: 'En ejecución',
  not_started: 'Sin ejecutar',
  paid: 'Pagada',
  partial: 'Parcial',
  voided: 'Anulada',
};

const EXECUTION_COLORS: Record<string, string> = {
  executed: 'green',
  failed: 'red',
  in_progress: 'blue',
  not_started: 'default',
  paid: 'green',
  partial: 'gold',
  voided: 'red',
};

const PAYMENT_RUN_EXECUTION_STATUSES_ALLOWING_PAYMENT = new Set([
  'not_started',
  'in_progress',
]);

const PAYMENT_RUN_LINE_TERMINAL_EXECUTION_STATUSES = new Set([
  'executed',
  'paid',
  'voided',
]);

const PAYMENT_RUN_LINE_EXECUTED_STATUSES = new Set(['executed', 'paid']);
const DEFAULT_PAYMENT_RUN_ACTION_ACCESS_DENIED_MESSAGE =
  'Tu rol no puede gestionar esta corrida CxP.';
const PAYMENT_RUN_PAYMENT_ACCESS_DENIED_MESSAGE =
  'Tu rol no puede registrar pagos de CxP.';

const ACTION_DEFINITIONS: Record<
  ManageAccountsPayablePaymentRunAction,
  PaymentRunActionDefinition
> = {
  submit: {
    evidenceRequired: false,
    label: 'Enviar',
    confirmLabel: 'Enviar a aprobación',
    reasonPlaceholder: 'Ej. Corrida revisada contra vencimientos y caja disponible.',
    title: 'Enviar corrida a aprobación',
  },
  approve: {
    evidenceRequired: true,
    label: 'Aprobar',
    confirmLabel: 'Aprobar corrida',
    reasonPlaceholder: 'Ej. Validé proveedores, retenciones, aprobaciones y caja.',
    title: 'Aprobar corrida CxP',
  },
  reject: {
    evidenceRequired: true,
    label: 'Rechazar',
    confirmLabel: 'Rechazar corrida',
    reasonPlaceholder: 'Ej. Hay facturas sin soporte o montos que requieren corrección.',
    title: 'Rechazar corrida CxP',
    tone: 'danger',
  },
  cancel: {
    evidenceRequired: true,
    label: 'Cancelar',
    confirmLabel: 'Cancelar corrida',
    reasonPlaceholder: 'Ej. La corrida será reemplazada por una versión corregida.',
    title: 'Cancelar corrida CxP',
    tone: 'danger',
  },
};

const toFiniteNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatDate = (value: unknown): string => {
  const millis = toMillis(value);
  if (millis == null) return 'Sin fecha';

  return new Intl.DateTimeFormat('es-DO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(millis);
};

const formatDateTime = (value: unknown): string => {
  const millis = toMillis(value);
  if (millis == null) return 'Sin fecha';

  return new Intl.DateTimeFormat('es-DO', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(millis);
};

const normalizeStatus = (value: unknown): string =>
  typeof value === 'string' && value.trim()
    ? value.trim().toLowerCase()
    : 'draft';

const getStatusLabel = (value: unknown): string => {
  const status = normalizeStatus(value);
  return STATUS_LABELS[status] ?? status;
};

const getApprovalLabel = (value: unknown): string => {
  const status = normalizeStatus(value);
  return APPROVAL_LABELS[status] ?? status;
};

const getExecutionLabel = (value: unknown): string => {
  const status = normalizeStatus(value);
  return EXECUTION_LABELS[status] ?? status;
};

const getExecutionColor = (value: unknown): string => {
  const status = normalizeStatus(value);
  return EXECUTION_COLORS[status] ?? 'default';
};

const getActionLabel = (value: unknown): string => {
  const action = normalizeStatus(value);
  if (action === 'record_payment') return 'Pago registrado';
  if (action === 'void_payment') return 'Pago anulado';

  return (
    ACTION_DEFINITIONS[action as ManageAccountsPayablePaymentRunAction]?.label ??
    action
  );
};

const getActionTagColor = (value: unknown): string => {
  const action = normalizeStatus(value);
  if (action === 'approve') return 'green';
  if (action === 'reject' || action === 'cancel') return 'red';
  if (action === 'submit') return 'blue';
  if (action === 'record_payment') return 'cyan';
  if (action === 'void_payment') return 'orange';
  return 'default';
};

const formatStatusTransition = (
  event: AccountsPayablePaymentRunEvent,
): string => {
  const previousStatus = event.previousStatus?.status;
  const nextStatus = event.nextStatus?.status;
  return `${getStatusLabel(previousStatus)} a ${getStatusLabel(nextStatus)}`;
};

const getAvailableActions = (
  run: AccountsPayablePaymentRun,
): ManageAccountsPayablePaymentRunAction[] => {
  const status = normalizeStatus(run.status);
  const approvalStatus = normalizeStatus(run.approvalStatus);
  const executionStatus = normalizeStatus(run.executionStatus);
  if (executionStatus !== 'not_started') return [];
  if (status === 'canceled' || status === 'cancelled' || status === 'executed') {
    return [];
  }

  const actions: ManageAccountsPayablePaymentRunAction[] = [];
  if (status === 'draft' || status === 'rejected') {
    actions.push('submit');
  }
  if (status === 'submitted' && approvalStatus === 'pending_approval') {
    actions.push('approve', 'reject');
  }
  actions.push('cancel');

  return actions;
};

const canRegisterPaymentForRunLine = (
  run: AccountsPayablePaymentRun,
  line: AccountsPayablePaymentRunLine,
): boolean => {
  const vendorBillId =
    typeof line.vendorBillId === 'string' ? line.vendorBillId.trim() : '';
  const status = normalizeStatus(run.status);
  const approvalStatus = normalizeStatus(run.approvalStatus);
  const executionStatus = normalizeStatus(run.executionStatus);
  const lineExecutionStatus = normalizeStatus(line.executionStatus);

  return (
    Boolean(vendorBillId) &&
    status === 'approved' &&
    approvalStatus === 'approved' &&
    PAYMENT_RUN_EXECUTION_STATUSES_ALLOWING_PAYMENT.has(executionStatus) &&
    !PAYMENT_RUN_LINE_TERMINAL_EXECUTION_STATUSES.has(lineExecutionStatus)
  );
};

const resolveRunLineExecutionStatus = (
  line: AccountsPayablePaymentRunLine,
): string => {
  const executionStatus = normalizeStatus(line.executionStatus);
  if (executionStatus !== 'draft') return executionStatus;

  return toFiniteNumber(line.paidSettlementAmount) > 0 ||
    toFiniteNumber(line.paidCashAmount) > 0 ||
    toFiniteNumber(line.paidWithholdingAmount) > 0
    ? 'partial'
    : 'not_started';
};

const sumRunLineAmount = (
  lines: AccountsPayablePaymentRunLine[],
  getValue: (line: AccountsPayablePaymentRunLine) => unknown,
): number =>
  lines.reduce((total, line) => total + toFiniteNumber(getValue(line)), 0);

const resolveLatestPaymentLine = (
  lines: AccountsPayablePaymentRunLine[],
): AccountsPayablePaymentRunLine | null =>
  lines.reduce<AccountsPayablePaymentRunLine | null>((latestLine, line) => {
    const linePaymentMillis = toMillis(line.lastPaymentAt);
    if (linePaymentMillis == null) return latestLine;

    const latestPaymentMillis = toMillis(latestLine?.lastPaymentAt);
    return latestPaymentMillis == null || linePaymentMillis > latestPaymentMillis
      ? line
      : latestLine;
  }, null);

const buildLineExecutionSummary = (
  lines: AccountsPayablePaymentRunLine[],
): PaymentRunExecutionSummaryViewModel => {
  const statusCounts = lines.reduce(
    (counts, line) => {
      const executionStatus = resolveRunLineExecutionStatus(line);
      if (PAYMENT_RUN_LINE_EXECUTED_STATUSES.has(executionStatus)) {
        counts.executedLineCount += 1;
      } else if (executionStatus === 'partial') {
        counts.partialLineCount += 1;
      }

      return counts;
    },
    {
      executedLineCount: 0,
      partialLineCount: 0,
    },
  );
  const totalLineCount = lines.length;
  const latestPaymentLine = resolveLatestPaymentLine(lines);

  return {
    ...statusCounts,
    lastPaymentAt: latestPaymentLine?.lastPaymentAt,
    lastPaymentId: latestPaymentLine?.lastPaymentId,
    paidCashAmount: sumRunLineAmount(lines, (line) => line.paidCashAmount),
    paidSettlementAmount: sumRunLineAmount(
      lines,
      (line) => line.paidSettlementAmount ?? line.paidAmount,
    ),
    paidWithholdingAmount: sumRunLineAmount(
      lines,
      (line) => line.paidWithholdingAmount,
    ),
    pendingLineCount: Math.max(
      totalLineCount -
        statusCounts.executedLineCount -
        statusCounts.partialLineCount,
      0,
    ),
    totalLineCount,
  };
};

const resolveRunExecutionSummary = (
  run: AccountsPayablePaymentRun,
  lines: AccountsPayablePaymentRunLine[],
): PaymentRunExecutionSummaryViewModel => {
  const lineSummary = buildLineExecutionSummary(lines);
  const snapshot = run.executionSummary;
  if (!snapshot) return lineSummary;

  return {
    executedLineCount: toFiniteNumber(
      snapshot.executedLineCount ?? lineSummary.executedLineCount,
    ),
    lastPaymentAt: snapshot.lastPaymentAt ?? lineSummary.lastPaymentAt,
    lastPaymentId: snapshot.lastPaymentId ?? lineSummary.lastPaymentId,
    paidCashAmount: toFiniteNumber(
      snapshot.paidCashAmount ?? lineSummary.paidCashAmount,
    ),
    paidSettlementAmount: toFiniteNumber(
      snapshot.paidSettlementAmount ?? lineSummary.paidSettlementAmount,
    ),
    paidWithholdingAmount: toFiniteNumber(
      snapshot.paidWithholdingAmount ?? lineSummary.paidWithholdingAmount,
    ),
    partialLineCount: toFiniteNumber(
      snapshot.partialLineCount ?? lineSummary.partialLineCount,
    ),
    pendingLineCount: toFiniteNumber(
      snapshot.pendingLineCount ?? lineSummary.pendingLineCount,
    ),
    totalLineCount: toFiniteNumber(
      snapshot.totalLineCount ?? lineSummary.totalLineCount,
    ),
  };
};

export const AccountsPayablePaymentRunsModal = ({
  canManageRunAction = () => true,
  canRegisterPayments = true,
  error,
  eventsByPaymentRunId = {},
  eventsError,
  eventsHasMore = false,
  eventsLoading = false,
  eventsRawDocCount = 0,
  getManageRunActionDeniedMessage,
  hasMore = false,
  loading = false,
  onClose,
  onManageRun,
  onRegisterPayment,
  open,
  rawDocCount = 0,
  runs,
}: AccountsPayablePaymentRunsModalProps) => {
  const [actionRequest, setActionRequest] =
    useState<PaymentRunActionRequest | null>(null);
  const [reason, setReason] = useState('');
  const [evidenceNote, setEvidenceNote] = useState('');
  const [reasonTouched, setReasonTouched] = useState(false);
  const [evidenceTouched, setEvidenceTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedRunIds, setExpandedRunIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const actionDefinition = actionRequest
    ? ACTION_DEFINITIONS[actionRequest.action]
    : null;
  const normalizedReason = reason.trim();
  const normalizedEvidenceNote = evidenceNote.trim();
  const reasonError =
    reasonTouched && normalizedReason.length < 5
      ? 'Indica un motivo de al menos 5 caracteres.'
      : null;
  const evidenceError =
    actionDefinition?.evidenceRequired &&
    evidenceTouched &&
    normalizedEvidenceNote.length < 3
      ? 'Indica una evidencia o referencia para esta acción.'
      : null;
  const visibleEventCount = Object.values(eventsByPaymentRunId).reduce(
    (total, events) => total + events.length,
    0,
  );

  const resetActionForm = () => {
    setActionRequest(null);
    setReason('');
    setEvidenceNote('');
    setReasonTouched(false);
    setEvidenceTouched(false);
  };

  const handleCloseAction = () => {
    if (submitting) return;
    resetActionForm();
  };

  const getDeniedRunActionMessage = (
    action: ManageAccountsPayablePaymentRunAction,
  ) =>
    getManageRunActionDeniedMessage?.(action) ??
    DEFAULT_PAYMENT_RUN_ACTION_ACCESS_DENIED_MESSAGE;

  const handleOpenAction = ({
    action,
    canManage,
    deniedMessage,
    run,
  }: AvailablePaymentRunAction & { run: AccountsPayablePaymentRun }) => {
    if (!canManage) {
      message.warning(deniedMessage ?? getDeniedRunActionMessage(action));
      return;
    }

    setActionRequest({ action, run });
  };

  const handleConfirmAction = async () => {
    if (!actionRequest || !actionDefinition || !onManageRun) return;

    setReasonTouched(true);
    setEvidenceTouched(true);
    if (normalizedReason.length < 5) {
      message.error('Debe indicar un motivo para la corrida CxP.');
      return;
    }
    if (
      actionDefinition.evidenceRequired &&
      normalizedEvidenceNote.length < 3
    ) {
      message.error('Debe indicar una evidencia o referencia.');
      return;
    }

    setSubmitting(true);
    try {
      await onManageRun({
        action: actionRequest.action,
        evidenceNote: normalizedEvidenceNote || null,
        paymentRunId: actionRequest.run.id,
        reason: normalizedReason,
      });
      resetActionForm();
    } catch {
      // El contenedor muestra el mensaje de error y el formulario queda disponible.
    } finally {
      setSubmitting(false);
    }
  };

  const toggleRunLines = (runId: string) => {
    setExpandedRunIds((previousExpandedRunIds) => {
      const nextExpandedRunIds = new Set(previousExpandedRunIds);
      if (nextExpandedRunIds.has(runId)) {
        nextExpandedRunIds.delete(runId);
      } else {
        nextExpandedRunIds.add(runId);
      }

      return nextExpandedRunIds;
    });
  };

  return (
    <>
      <Modal
        destroyOnHidden
        footer={null}
        onCancel={onClose}
        open={open}
        title="Historial de corridas CxP"
        width={980}
        style={{ maxWidth: 'calc(100vw - 32px)' }}
      >
        <Content>
          {error ? (
            <Alert
              showIcon
              type="error"
              message="No se pudieron cargar las corridas CxP."
            />
          ) : null}

          {hasMore && !error ? (
            <Alert
              showIcon
              type="warning"
              message="Historial de corridas acotado"
              description={`Se muestran las ${runs.length} corridas más recientes de ${rawDocCount} leídas. Hay más historial fuera del lote actual.`}
            />
          ) : null}

          {eventsHasMore && !eventsError ? (
            <Alert
              showIcon
              type="warning"
              message="Bitácora de corridas acotada"
              description={`Se muestran los ${visibleEventCount} eventos más recientes de ${eventsRawDocCount} leídos. Puede existir auditoría anterior fuera del lote actual.`}
            />
          ) : null}

          {loading ? (
            <Skeleton active paragraph={{ rows: 6 }} />
          ) : runs.length === 0 && !error ? (
            <Empty
              description={
                <EmptyDescription>
                  <strong>Sin corridas guardadas</strong>
                  <span>
                    Aquí aparecerán las propuestas aprobables con líneas,
                    bitácora y avance de ejecución.
                  </span>
                </EmptyDescription>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <RunList>
              {runs.map((run) => {
                const status = normalizeStatus(run.status);
                const totals = run.totals ?? {};
                const lines = Array.isArray(run.lines) ? run.lines : [];
                const excludedLines = Array.isArray(run.excludedLines)
                  ? run.excludedLines
                  : [];
                const availableActions: AvailablePaymentRunAction[] =
                  onManageRun
                    ? getAvailableActions(run).map((action) => {
                        const canManage = canManageRunAction(action);
                        return {
                          action,
                          canManage,
                          deniedMessage: canManage
                            ? null
                            : getDeniedRunActionMessage(action),
                        };
                      })
                    : [];
                const deniedActionMessages = [
                  ...new Set(
                    availableActions
                      .map((entry) => entry.deniedMessage)
                      .filter((entry): entry is string => Boolean(entry)),
                  ),
                ];
                const runEvents = eventsByPaymentRunId[run.id] ?? [];
                const isLinesExpanded = expandedRunIds.has(run.id);
                const visibleLines = isLinesExpanded
                  ? lines
                  : lines.slice(0, 3);
                const runExecutionSummary = resolveRunExecutionSummary(
                  run,
                  lines,
                );
                const hasRunExecutionSummary =
                  Boolean(run.executionSummary) ||
                  runExecutionSummary.totalLineCount > 0;

                return (
                  <RunCard key={run.id}>
                    <RunHeader>
                      <div>
                        <strong>{run.id}</strong>
                        <Text type="secondary">
                          {formatDate(run.createdAt)} ·{' '}
                          {run.source?.label ?? 'CxP'}
                        </Text>
                      </div>
                      <Tag color={STATUS_COLORS[status] ?? 'default'}>
                        {getStatusLabel(run.status)}
                      </Tag>
                    </RunHeader>

                    <MetricGrid>
                      <Metric>
                        <span>Caja</span>
                        <strong>
                          {formatPrice(
                            totals.eligibleCashRequirementAmount ?? 0,
                          )}
                        </strong>
                      </Metric>
                      <Metric>
                        <span>Balance</span>
                        <strong>
                          {formatPrice(totals.eligibleAmount ?? 0)}
                        </strong>
                      </Metric>
                      <Metric>
                        <span>Retenciones</span>
                        <strong>
                          {formatPrice(totals.eligibleWithholdingAmount ?? 0)}
                        </strong>
                      </Metric>
                      <Metric>
                        <span>Elegibles</span>
                        <strong>{toFiniteNumber(totals.eligibleCount)}</strong>
                      </Metric>
                      <Metric>
                        <span>Excluidas</span>
                        <strong>{toFiniteNumber(totals.excludedCount)}</strong>
                      </Metric>
                    </MetricGrid>

                    <StatusLine>
                      <Tag>{getApprovalLabel(run.approvalStatus)}</Tag>
                      <Tag>{getExecutionLabel(run.executionStatus)}</Tag>
                      {run.source?.isQueryLimitReached ? (
                        <Tag color="gold">Lote acotado</Tag>
                      ) : null}
                    </StatusLine>

                    {run.source?.description ? (
                      <Description>{run.source.description}</Description>
                    ) : null}

                    {hasRunExecutionSummary ? (
                      <ExecutionSummary
                        aria-label={`Resumen de ejecución de corrida ${run.id}`}
                      >
                        <ExecutionSummaryHeader>
                          <strong>Ejecución</strong>
                          {runExecutionSummary.lastPaymentAt ? (
                            <Text type="secondary">
                              Último pago{' '}
                              {formatDate(runExecutionSummary.lastPaymentAt)}
                            </Text>
                          ) : null}
                        </ExecutionSummaryHeader>
                        <ExecutionSummaryGrid>
                          <ExecutionMetric>
                            <span>Ejecutadas</span>
                            <strong>
                              {runExecutionSummary.executedLineCount} /{' '}
                              {runExecutionSummary.totalLineCount}
                            </strong>
                          </ExecutionMetric>
                          <ExecutionMetric>
                            <span>Parciales</span>
                            <strong>
                              {runExecutionSummary.partialLineCount}
                            </strong>
                          </ExecutionMetric>
                          <ExecutionMetric>
                            <span>Pendientes</span>
                            <strong>
                              {runExecutionSummary.pendingLineCount}
                            </strong>
                          </ExecutionMetric>
                          <ExecutionMetric>
                            <span>Liquidado</span>
                            <strong>
                              {formatPrice(
                                runExecutionSummary.paidSettlementAmount,
                              )}
                            </strong>
                          </ExecutionMetric>
                          <ExecutionMetric>
                            <span>Caja pagada</span>
                            <strong>
                              {formatPrice(runExecutionSummary.paidCashAmount)}
                            </strong>
                          </ExecutionMetric>
                          <ExecutionMetric>
                            <span>Ret. pagada</span>
                            <strong>
                              {formatPrice(
                                runExecutionSummary.paidWithholdingAmount,
                              )}
                            </strong>
                          </ExecutionMetric>
                        </ExecutionSummaryGrid>
                      </ExecutionSummary>
                    ) : null}

                    {lines.length > 0 ? (
                      <LineSection>
                        <LineSectionHeader>
                          <div>
                            <strong>Líneas</strong>
                            <Text type="secondary">
                              {lines.length} factura
                              {lines.length === 1 ? '' : 's'} aprobada
                              {lines.length === 1 ? '' : 's'} para pago
                            </Text>
                          </div>
                          {lines.length > 3 ? (
                            <Button
                              onClick={() => toggleRunLines(run.id)}
                              size="small"
                              type="text"
                            >
                              {isLinesExpanded
                                ? 'Mostrar menos'
                                : `Ver todas (${lines.length})`}
                            </Button>
                          ) : null}
                        </LineSectionHeader>
                        <LinePreview
                          aria-label={`Líneas de corrida ${run.id}`}
                          $expanded={isLinesExpanded}
                        >
                          {visibleLines.map((line) => {
                            const vendorBillId =
                              typeof line.vendorBillId === 'string'
                                ? line.vendorBillId.trim()
                                : '';
                            const reference = line.reference ?? vendorBillId;
                            const lineExecutionStatus =
                              resolveRunLineExecutionStatus(line);
                            const isPaymentAllowedForLine =
                              canRegisterPaymentForRunLine(run, line);
                            const canRegisterLinePayment =
                              Boolean(onRegisterPayment) &&
                              canRegisterPayments &&
                              isPaymentAllowedForLine;
                            const shouldShowPaymentAction =
                              Boolean(onRegisterPayment) &&
                              isPaymentAllowedForLine;

                            return (
                              <LineRow key={line.vendorBillId ?? line.reference}>
                                <LineIdentity>
                                  <strong>{reference}</strong>
                                  <span>
                                    {line.supplierName ?? 'Sin proveedor'}
                                  </span>
                                  <LineMeta>
                                    <Tag
                                      color={getExecutionColor(
                                        lineExecutionStatus,
                                      )}
                                    >
                                      {getExecutionLabel(lineExecutionStatus)}
                                    </Tag>
                                    {line.lastPaymentAt ? (
                                      <Text type="secondary">
                                        Último pago{' '}
                                        {formatDate(line.lastPaymentAt)}
                                      </Text>
                                    ) : null}
                                  </LineMeta>
                                </LineIdentity>
                                <LineAmounts>
                                  <span>
                                    Caja{' '}
                                    <strong>
                                      {formatPrice(
                                        line.cashRequirementAmount ?? 0,
                                      )}
                                    </strong>
                                  </span>
                                  <span>
                                    Ret.{' '}
                                    <strong>
                                      {formatPrice(line.withholdingAmount ?? 0)}
                                    </strong>
                                  </span>
                                  <span>
                                    Pagado{' '}
                                    <strong>
                                      {formatPrice(
                                        line.paidSettlementAmount ??
                                          line.paidAmount ??
                                          0,
                                      )}
                                    </strong>
                                  </span>
                                </LineAmounts>
                                <LineAmountAction>
                                  {shouldShowPaymentAction ? (
                                    <Button
                                      aria-label={`Registrar pago de ${reference} en corrida ${run.id}`}
                                      disabled={!canRegisterLinePayment}
                                      icon={<DollarCircleOutlined />}
                                      onClick={() => {
                                        if (!canRegisterLinePayment) {
                                          message.warning(
                                            PAYMENT_RUN_PAYMENT_ACCESS_DENIED_MESSAGE,
                                          );
                                          return;
                                        }
                                        if (!vendorBillId) return;
                                        void onRegisterPayment?.({
                                          paymentRunId: run.id,
                                          vendorBillId,
                                        });
                                      }}
                                      size="small"
                                      title={
                                        canRegisterLinePayment
                                          ? undefined
                                          : PAYMENT_RUN_PAYMENT_ACCESS_DENIED_MESSAGE
                                      }
                                    >
                                      {canRegisterLinePayment
                                        ? 'Registrar pago'
                                        : 'Sin permiso'}
                                    </Button>
                                  ) : null}
                                </LineAmountAction>
                              </LineRow>
                            );
                          })}
                        </LinePreview>
                      </LineSection>
                    ) : null}

                    {excludedLines.length > 0 ? (
                      <ExcludedText type="secondary">
                        {excludedLines.length} excluida
                        {excludedLines.length === 1 ? '' : 's'} ·{' '}
                        {excludedLines[0]?.exclusionReason ??
                          'Requiere revisión'}
                      </ExcludedText>
                    ) : null}

                    <AuditSection>
                      <AuditHeader>
                        <strong>Bitácora</strong>
                        {runEvents.length > 0 ? (
                          <Text type="secondary">
                            {runEvents.length} evento
                            {runEvents.length === 1 ? '' : 's'}
                          </Text>
                        ) : null}
                      </AuditHeader>
                      {eventsLoading ? (
                        <Skeleton active paragraph={{ rows: 2 }} title={false} />
                      ) : eventsError ? (
                        <Alert
                          message="No se pudo cargar la bitácora de corridas."
                          showIcon
                          type="warning"
                        />
                      ) : runEvents.length === 0 ? (
                        <Empty
                          description="Sin eventos de auditoría."
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                      ) : (
                        <AuditList>
                          {runEvents.slice(0, 4).map((event) => (
                            <AuditItem key={event.id}>
                              <AuditItemHeader>
                                <Tag color={getActionTagColor(event.action)}>
                                  {getActionLabel(event.action)}
                                </Tag>
                                <MetaLine>
                                  {formatDateTime(event.createdAt)}
                                </MetaLine>
                              </AuditItemHeader>
                              {event.reason ? (
                                <AuditReason>{event.reason}</AuditReason>
                              ) : null}
                              {event.evidenceNote ? (
                                <MetaLine>
                                  Evidencia: {event.evidenceNote}
                                </MetaLine>
                              ) : null}
                              <MetaLine>
                                Estado: {formatStatusTransition(event)} -
                                Usuario {event.createdBy ?? 'no identificado'}
                              </MetaLine>
                            </AuditItem>
                          ))}
                        </AuditList>
                      )}
                    </AuditSection>

                    {availableActions.length > 0 ? (
                      <ActionSection>
                        <ActionRow aria-label={`Acciones de corrida ${run.id}`}>
                          {availableActions.map((entry) => {
                            const definition =
                              ACTION_DEFINITIONS[entry.action];

                            return (
                              <Button
                                danger={definition.tone === 'danger'}
                                disabled={!entry.canManage}
                                key={entry.action}
                                onClick={() =>
                                  handleOpenAction({ ...entry, run })
                                }
                                size="small"
                                title={entry.deniedMessage ?? undefined}
                                type={
                                  entry.action === 'approve'
                                    ? 'primary'
                                    : 'default'
                                }
                              >
                                {definition.label}
                              </Button>
                            );
                          })}
                        </ActionRow>
                        {deniedActionMessages.length > 0 ? (
                          <ActionAccessNote>
                            {deniedActionMessages.join(' ')}
                          </ActionAccessNote>
                        ) : null}
                      </ActionSection>
                    ) : null}
                  </RunCard>
                );
              })}
            </RunList>
          )}
        </Content>
      </Modal>

      <Modal
        destroyOnHidden
        footer={[
          <Button key="cancel" disabled={submitting} onClick={handleCloseAction}>
            Cerrar
          </Button>,
          <Button
            danger={actionDefinition?.tone === 'danger'}
            key="confirm"
            loading={submitting}
            onClick={() => {
              void handleConfirmAction();
            }}
            type="primary"
          >
            {actionDefinition?.confirmLabel ?? 'Aplicar'}
          </Button>,
        ]}
        onCancel={handleCloseAction}
        open={Boolean(actionRequest)}
        title={actionDefinition?.title ?? 'Gestionar corrida CxP'}
        width={540}
      >
        <ActionForm>
          <ActionIntro>
            <Text>
              Esta acción quedará registrada en la auditoría de la corrida.
            </Text>
            {actionRequest ? (
              <ReferenceLine>
                <strong>{actionRequest.run.id}</strong>
                <span>{getStatusLabel(actionRequest.run.status)}</span>
              </ReferenceLine>
            ) : null}
          </ActionIntro>

          <Field>
            <Label htmlFor="cxp-payment-run-action-reason">Motivo</Label>
            <TextArea
              aria-describedby={
                reasonError ? 'cxp-payment-run-action-reason-error' : undefined
              }
              aria-invalid={reasonError ? 'true' : 'false'}
              autoSize={{ minRows: 3, maxRows: 5 }}
              disabled={submitting}
              id="cxp-payment-run-action-reason"
              maxLength={240}
              onBlur={() => setReasonTouched(true)}
              onChange={(event) => {
                const nextReason = event.target.value;
                setReason(nextReason);
                if (reasonTouched && nextReason.trim().length >= 5) {
                  setReasonTouched(false);
                }
              }}
              placeholder={actionDefinition?.reasonPlaceholder}
              showCount
              status={reasonError ? 'error' : undefined}
              value={reason}
            />
            {reasonError ? (
              <FieldError id="cxp-payment-run-action-reason-error" role="alert">
                {reasonError}
              </FieldError>
            ) : null}
          </Field>

          <Field>
            <Label htmlFor="cxp-payment-run-action-evidence">
              Evidencia o referencia
              {actionDefinition?.evidenceRequired ? (
                <RequiredMark> requerida</RequiredMark>
              ) : null}
            </Label>
            <Input
              aria-describedby={
                evidenceError
                  ? 'cxp-payment-run-action-evidence-error'
                  : undefined
              }
              aria-invalid={evidenceError ? 'true' : 'false'}
              disabled={submitting}
              id="cxp-payment-run-action-evidence"
              maxLength={180}
              onBlur={() => setEvidenceTouched(true)}
              onChange={(event) => {
                const nextEvidence = event.target.value;
                setEvidenceNote(nextEvidence);
                if (evidenceTouched && nextEvidence.trim().length >= 3) {
                  setEvidenceTouched(false);
                }
              }}
              placeholder="Ticket, acta, aprobación externa o referencia documental"
              status={evidenceError ? 'error' : undefined}
              value={evidenceNote}
            />
            {evidenceError ? (
              <FieldError
                id="cxp-payment-run-action-evidence-error"
                role="alert"
              >
                {evidenceError}
              </FieldError>
            ) : null}
          </Field>
        </ActionForm>
      </Modal>
    </>
  );
};

const Content = styled.div`
  min-width: 0;
`;

const RunList = styled.div`
  display: grid;
  gap: 12px;
  min-width: 0;
`;

const RunCard = styled.article`
  display: grid;
  gap: 10px;
  min-width: 0;
  padding: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
`;

const RunHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;

  div {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  strong,
  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (max-width: 560px) {
    align-items: stretch;
    flex-direction: column;

    strong,
    span {
      white-space: normal;
    }
  }
`;

const MetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(116px, 1fr));
  gap: 8px;
`;

const Metric = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
  padding: 8px 10px;
  border: 1px solid #edf0f3;
  border-radius: 8px;
  background: #f9fafb;

  span {
    color: #667085;
    font-size: 12px;
  }

  strong {
    color: #111827;
  }
`;

const StatusLine = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const AuditSection = styled.section`
  display: grid;
  gap: 8px;
  min-width: 0;
  padding-top: 2px;
`;

const AuditHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
`;

const AuditList = styled.div`
  display: grid;
  gap: 8px;
  min-width: 0;
`;

const AuditItem = styled.div`
  display: grid;
  gap: 4px;
  min-width: 0;
  padding: 8px 10px;
  border: 1px solid #edf0f3;
  border-radius: 8px;
  background: #fbfcfd;
`;

const AuditItemHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;

  @media (max-width: 560px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const AuditReason = styled.p`
  margin: 0;
  color: #374151;
`;

const MetaLine = styled.span`
  color: #667085;
  font-size: 12px;
`;

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
`;

const ActionSection = styled.div`
  display: grid;
  gap: 6px;
  min-width: 0;
`;

const ActionAccessNote = styled.span`
  color: #667085;
  font-size: 12px;
  text-align: end;

  @media (max-width: 560px) {
    text-align: start;
  }
`;

const EmptyDescription = styled.div`
  display: grid;
  gap: 4px;
  max-width: min(300px, 100%);
  margin-inline: auto;
  color: #667085;
  text-align: center;

  strong {
    color: #111827;
  }

  span {
    line-height: 1.45;
    overflow-wrap: break-word;
  }
`;

const Description = styled.p`
  margin: 0;
  color: #4b5563;
`;

const ExecutionSummary = styled.section`
  display: grid;
  gap: 8px;
  min-width: 0;
  padding: 10px 0;
  border-block: 1px solid #edf0f3;
`;

const ExecutionSummaryHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;

  @media (max-width: 560px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const ExecutionSummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(112px, 1fr));
  gap: 8px;
  min-width: 0;
`;

const ExecutionMetric = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
  padding-inline-start: 8px;
  border-inline-start: 2px solid #d8dee8;

  span {
    color: #667085;
    font-size: 12px;
  }

  strong {
    color: #111827;
    font-size: 13px;
  }
`;

const LineSection = styled.section`
  display: grid;
  gap: 8px;
  min-width: 0;
`;

const LineSectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;

  div {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  @media (max-width: 560px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const LinePreview = styled.div<{ $expanded?: boolean }>`
  display: grid;
  gap: 6px;
  min-width: 0;
  max-block-size: ${({ $expanded }) => ($expanded ? '360px' : 'none')};
  overflow-y: ${({ $expanded }) => ($expanded ? 'auto' : 'visible')};
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
`;

const LineRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(220px, 0.8fr) auto;
  align-items: start;
  gap: 12px;
  min-width: 0;
  padding: 8px 0;
  border-top: 1px solid #edf0f3;
  color: #4b5563;
  font-size: 13px;

  &:first-child {
    border-top: 0;
  }

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
    gap: 8px;
  }
`;

const LineIdentity = styled.div`
  display: grid;
  gap: 3px;
  min-width: 0;

  strong,
  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    color: #667085;
  }

  @media (max-width: 720px) {
    strong,
    span {
      white-space: normal;
    }
  }
`;

const LineMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-width: 0;
`;

const LineAmounts = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  min-width: 0;

  span {
    display: grid;
    gap: 2px;
    min-width: 0;
    color: #667085;
    font-size: 12px;
  }

  strong {
    color: #111827;
    font-size: 13px;
  }
`;

const LineAmountAction = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  min-width: 0;

  @media (max-width: 560px) {
    justify-content: space-between;
  }
`;

const ExcludedText = styled(Text)`
  display: block;
`;

const ActionForm = styled.div`
  display: grid;
  gap: 16px;
`;

const ActionIntro = styled.div`
  display: grid;
  gap: 10px;
`;

const ReferenceLine = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  color: var(--ds-color-text-secondary, #666);
  font-size: 13px;

  strong {
    color: var(--ds-color-text-primary, #111);
  }
`;

const Field = styled.div`
  display: grid;
  gap: 8px;
`;

const Label = styled.label`
  color: var(--ds-color-text-primary, #111);
  font-weight: 600;
`;

const RequiredMark = styled.span`
  color: #cf1322;
  font-size: 12px;
  font-weight: 500;
`;

const FieldError = styled.span`
  color: #cf1322;
  font-size: 12px;
`;
