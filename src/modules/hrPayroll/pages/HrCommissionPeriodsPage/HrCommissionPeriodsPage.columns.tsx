import { VmButton } from '@/components/heroui';
import {
  CheckCircleOutlined,
  DollarOutlined,
  EditOutlined,
  EyeOutlined,
} from '@/constants/icons/antd';
import {
  HrActionGroup as ActionGroup,
  HrAmountText as AmountText,
  HrCellStack as CellStack,
  HrMutedText as MutedText,
  HrPrimaryText as PrimaryText,
  HrStatusTag as StatusTag,
  type HrTableColumn,
} from '@/modules/hrPayroll/components/HrPayrollPagePrimitives';
import {
  formatHrDate as formatDate,
  formatHrPeriodDate,
  formatHrMoney as formatMoney,
  HR_COMMISSION_PERIOD_STATUS_LABELS as STATUS_LABELS,
  HR_PAYMENT_METHOD_LABELS as PAYMENT_METHOD_LABELS,
  HR_PAYROLL_RUN_STATUS_LABELS as LINE_STATUS_LABELS,
} from '@/modules/hrPayroll/utils/hrPayrollDisplay';
import type {
  HrEmployeePaymentRecord,
  HrEmployeePaymentStatus,
  HrCommissionPeriodRecord,
  HrCommissionPeriodStatus,
  HrPayrollEmployeeLineRecord,
  HrPayrollRunStatus,
} from '@/types/hrPayroll';
import { DetailLinkButton } from './HrCommissionPeriodsPage.styles';

const PERIOD_STATUS_TONES: Record<
  HrCommissionPeriodStatus,
  'default' | 'info' | 'success' | 'warning' | 'danger' | 'accent'
> = {
  draft: 'info',
  closed: 'warning',
  approved: 'success',
  partially_paid: 'accent',
  paid: 'success',
  cancelled: 'default',
};

const LINE_STATUS_TONES: Record<
  HrPayrollRunStatus,
  'default' | 'info' | 'success' | 'warning' | 'danger' | 'accent'
> = PERIOD_STATUS_TONES;

const getPeriodPayableAmount = (period: HrCommissionPeriodRecord): number =>
  period.netAmount ?? period.totalPayableAmount ?? period.totalCommissionAmount;

const getPeriodPaidAmount = (period: HrCommissionPeriodRecord): number => {
  const paidAmount = period.paidAmount ?? 0;
  if (paidAmount > 0) return paidAmount;
  return period.status === 'paid' ? getPeriodPayableAmount(period) : 0;
};

const getPeriodPendingAmount = (period: HrCommissionPeriodRecord): number => {
  if (['paid', 'cancelled'].includes(period.status)) return 0;
  return Math.max(
    0,
    getPeriodPayableAmount(period) - getPeriodPaidAmount(period),
  );
};

interface PeriodColumnsOptions {
  getDetailPath: (period: HrCommissionPeriodRecord) => string;
}

export const buildPeriodColumns = ({
  getDetailPath,
}: PeriodColumnsOptions): HrTableColumn<HrCommissionPeriodRecord>[] => [
  {
    title: 'Corte',
    key: 'label',
    width: 260,
    isRowHeader: true,
    render: (period) => (
      <CellStack>
        <PrimaryText>{period.label || period.periodKey}</PrimaryText>
        <MutedText>{period.cutRuleLabel || period.periodKey}</MutedText>
      </CellStack>
    ),
  },
  {
    title: 'Rango',
    key: 'range',
    width: 180,
    render: (period) => (
      <CellStack>
        <PrimaryText>{formatHrPeriodDate(period, 'start')}</PrimaryText>
        <MutedText>{formatHrPeriodDate(period, 'end')}</MutedText>
      </CellStack>
    ),
  },
  {
    title: 'Estado',
    key: 'status',
    width: 120,
    render: (period) => (
      <StatusTag $tone={PERIOD_STATUS_TONES[period.status]}>
        {STATUS_LABELS[period.status]}
      </StatusTag>
    ),
  },
  {
    title: 'Colab.',
    key: 'employeesCount',
    align: 'right',
    width: 90,
    render: (period) => period.employeesCount,
  },
  {
    title: 'Comisiones',
    key: 'entriesCount',
    align: 'right',
    width: 110,
    render: (period) => (
      <CellStack>
        <PrimaryText>{period.entriesCount}</PrimaryText>
        {period.retroactiveAdjustmentsCount ? (
          <MutedText>{period.retroactiveAdjustmentsCount} retro.</MutedText>
        ) : null}
      </CellStack>
    ),
  },
  {
    title: 'Total generado',
    key: 'totalPayableAmount',
    align: 'right',
    width: 150,
    render: (period) => (
      <AmountText>
        {formatMoney(getPeriodPayableAmount(period), period.currency)}
      </AmountText>
    ),
  },
  {
    title: 'Pagado',
    key: 'paidAmount',
    align: 'right',
    width: 130,
    render: (period) => (
      <AmountText>
        {formatMoney(getPeriodPaidAmount(period), period.currency)}
      </AmountText>
    ),
  },
  {
    title: 'Pendiente',
    key: 'pendingAmount',
    align: 'right',
    width: 130,
    render: (period) => (
      <AmountText>
        {formatMoney(getPeriodPendingAmount(period), period.currency)}
      </AmountText>
    ),
  },
  {
    title: 'Acción',
    key: 'actions',
    align: 'right',
    width: 130,
    render: (period) => (
      <ActionGroup>
        <DetailLinkButton
          to={getDetailPath(period)}
          onClick={(event) => event.stopPropagation()}
        >
          <EyeOutlined />
          Ver detalle
        </DetailLinkButton>
      </ActionGroup>
    ),
  },
];

interface LineColumnsOptions {
  adjustmentActionKey: string | null;
  canRecordPayments?: boolean;
  onOpenAdjustment: (line: HrPayrollEmployeeLineRecord) => void;
  paymentActionKey: string | null;
  periodStatus?: HrCommissionPeriodStatus | null;
  onOpenPayment: (line: HrPayrollEmployeeLineRecord) => void;
}

const getLineGrossAmount = (line: HrPayrollEmployeeLineRecord): number =>
  line.grossAmount || line.commissionAmount || line.netAmount || 0;

const getLineDeductionAmount = (line: HrPayrollEmployeeLineRecord): number =>
  line.deductionsAmount ||
  Math.max(0, getLineGrossAmount(line) - line.netAmount);

const getLineAdjustmentAmount = (line: HrPayrollEmployeeLineRecord): number =>
  line.manualAdjustmentAmount ?? 0;

const getLineRetroactiveAdjustmentAmount = (
  line: HrPayrollEmployeeLineRecord,
): number => line.retroactiveAdjustmentAmount ?? 0;

const getLinePaidAmount = (line: HrPayrollEmployeeLineRecord): number =>
  line.status === 'paid' ? line.netAmount : 0;

const getLinePendingAmount = (line: HrPayrollEmployeeLineRecord): number =>
  line.status === 'paid' || line.status === 'cancelled'
    ? 0
    : Math.max(0, line.netAmount - getLinePaidAmount(line));

const isLineAdjustable = (line: HrPayrollEmployeeLineRecord): boolean =>
  line.status === 'draft' || line.status === 'closed';

export const buildLineColumns = ({
  adjustmentActionKey,
  canRecordPayments = true,
  onOpenAdjustment,
  paymentActionKey,
  periodStatus = null,
  onOpenPayment,
}: LineColumnsOptions): HrTableColumn<HrPayrollEmployeeLineRecord>[] => [
  {
    title: 'Colaborador',
    key: 'employee',
    isRowHeader: true,
    render: (line) => (
      <CellStack>
        <PrimaryText>
          {line.employeeNameSnapshot || line.employeeCode || line.employeeId}
        </PrimaryText>
        <MutedText>
          {line.employeeCode || line.employeeId} - {line.entriesCount}{' '}
          {line.entriesCount === 1 ? 'entrada' : 'entradas'}
        </MutedText>
        <StatusTag $tone={LINE_STATUS_TONES[line.status]}>
          {LINE_STATUS_LABELS[line.status]}
        </StatusTag>
      </CellStack>
    ),
  },
  {
    title: 'Resumen',
    key: 'summary',
    align: 'right',
    width: 170,
    render: (line) => (
      <CellStack>
        <AmountText>
          {formatMoney(line.commissionAmount, line.currency)}
        </AmountText>
        {line.retroactiveAdjustmentsCount ? (
          <MutedText>
            Retroactiva +
            {formatMoney(
              getLineRetroactiveAdjustmentAmount(line),
              line.currency,
            )}
          </MutedText>
        ) : (
          <MutedText>Sin retroactivas</MutedText>
        )}
      </CellStack>
    ),
  },
  {
    title: 'Neto',
    key: 'netAmount',
    align: 'right',
    width: 190,
    render: (line) => {
      const deductionAmount = getLineDeductionAmount(line);
      const adjustmentAmount = getLineAdjustmentAmount(line);
      const retroactiveAdjustmentAmount = line.retroactiveAdjustmentAmount ?? 0;
      const adjustmentComment = line.manualAdjustmentComment;

      return (
        <CellStack>
          <AmountText>{formatMoney(line.netAmount, line.currency)}</AmountText>
          {adjustmentAmount > 0 ? (
            <MutedText>
              Ajuste -{formatMoney(adjustmentAmount, line.currency)}
            </MutedText>
          ) : deductionAmount > 0 ? (
            <MutedText>
              Deducciones -{formatMoney(deductionAmount, line.currency)}
            </MutedText>
          ) : retroactiveAdjustmentAmount > 0 ? (
            <MutedText>
              Incluye {formatMoney(retroactiveAdjustmentAmount, line.currency)}{' '}
              retroactivo
            </MutedText>
          ) : (
            <MutedText>Sin ajustes</MutedText>
          )}
          {adjustmentComment ? (
            <MutedText>{adjustmentComment}</MutedText>
          ) : null}
        </CellStack>
      );
    },
  },
  {
    title: 'Pendiente',
    key: 'pendingAmount',
    align: 'right',
    width: 150,
    render: (line) => (
      <CellStack>
        <AmountText>
          {formatMoney(getLinePendingAmount(line), line.currency)}
        </AmountText>
        <MutedText>
          Pagado {formatMoney(getLinePaidAmount(line), line.currency)}
        </MutedText>
      </CellStack>
    ),
  },
  {
    title: 'Acción',
    key: 'payment',
    align: 'right',
    width: 180,
    render: (line) => {
      const paymentPeriodOpen =
        periodStatus === 'approved' || periodStatus === 'partially_paid';
      const pendingAmount = getLinePendingAmount(line);

      if (line.status === 'paid') {
        return (
          <ActionGroup>
            <StatusTag $tone="success">
              <CheckCircleOutlined />
              Pagado
            </StatusTag>
          </ActionGroup>
        );
      }

      if (
        canRecordPayments &&
        paymentPeriodOpen &&
        line.status === 'approved' &&
        pendingAmount > 0
      ) {
        return (
          <ActionGroup>
            <VmButton
              variant="primary"
              isDisabled={paymentActionKey === `pay:${line.id}`}
              onPress={() => onOpenPayment(line)}
            >
              <DollarOutlined />
              Pagar
            </VmButton>
          </ActionGroup>
        );
      }

      if (
        isLineAdjustable(line) &&
        (periodStatus === 'draft' || periodStatus === 'closed')
      ) {
        return (
          <ActionGroup>
            <VmButton
              variant="secondary"
              isDisabled={adjustmentActionKey === `adjust:${line.id}`}
              onPress={() => onOpenAdjustment(line)}
            >
              <EditOutlined />
              Editar
            </VmButton>
          </ActionGroup>
        );
      }

      return (
        <ActionGroup>
          <MutedText>Sin acciones</MutedText>
        </ActionGroup>
      );
    },
  },
];

const PAYMENT_STATUS_LABELS: Record<HrEmployeePaymentStatus, string> = {
  confirmed: 'Confirmado',
  voided: 'Anulado',
};

const PAYMENT_STATUS_TONES: Record<
  HrEmployeePaymentStatus,
  'default' | 'info' | 'success' | 'warning' | 'danger' | 'accent'
> = {
  confirmed: 'success',
  voided: 'default',
};

const getPaymentReference = (payment: HrEmployeePaymentRecord): string =>
  payment.reference || payment.transferReference || payment.checkNumber || '-';

const getPaymentAccountReference = (payment: HrEmployeePaymentRecord): string =>
  payment.bankAccountId || payment.cashAccountId || payment.cashCountId || '-';

export const paymentColumns: HrTableColumn<HrEmployeePaymentRecord>[] = [
  {
    title: 'Fecha',
    key: 'paymentDate',
    width: 130,
    render: (payment) => (
      <MutedText>{formatDate(payment.paymentDate)}</MutedText>
    ),
  },
  {
    title: 'Colaborador',
    key: 'employee',
    isRowHeader: true,
    render: (payment) => (
      <CellStack>
        <PrimaryText>
          {payment.employeeNameSnapshot ||
            payment.employeeCode ||
            payment.employeeId}
        </PrimaryText>
        <MutedText>{payment.employeeCode || payment.employeeId}</MutedText>
      </CellStack>
    ),
  },
  {
    title: 'Monto',
    key: 'amount',
    align: 'right',
    width: 130,
    render: (payment) => (
      <AmountText>{formatMoney(payment.amount, payment.currency)}</AmountText>
    ),
  },
  {
    title: 'Método',
    key: 'method',
    width: 130,
    render: (payment) => (
      <MutedText>{PAYMENT_METHOD_LABELS[payment.paymentMethod]}</MutedText>
    ),
  },
  {
    title: 'Cuenta/Caja',
    key: 'account',
    width: 150,
    render: (payment) => (
      <MutedText>{getPaymentAccountReference(payment)}</MutedText>
    ),
  },
  {
    title: 'Estado',
    key: 'status',
    width: 120,
    render: (payment) => (
      <StatusTag $tone={PAYMENT_STATUS_TONES[payment.status]}>
        {PAYMENT_STATUS_LABELS[payment.status]}
      </StatusTag>
    ),
  },
  {
    title: 'Referencia',
    key: 'reference',
    width: 160,
    render: (payment) => <MutedText>{getPaymentReference(payment)}</MutedText>,
  },
  {
    title: 'Usuario',
    key: 'createdBy',
    width: 140,
    render: (payment) => <MutedText>{payment.createdBy || '-'}</MutedText>,
  },
];
