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
  formatHrMoney as formatMoney,
  HR_COMMISSION_PERIOD_STATUS_LABELS as STATUS_LABELS,
  HR_PAYMENT_METHOD_LABELS as PAYMENT_METHOD_LABELS,
  HR_PAYROLL_RUN_STATUS_LABELS as LINE_STATUS_LABELS,
} from '@/modules/hrPayroll/utils/hrPayrollDisplay';
import type {
  HrEmployeePaymentRecord,
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

const getPeriodDeductionAmount = (period: HrCommissionPeriodRecord): number =>
  period.deductionsAmount ||
  Math.max(0, period.totalCommissionAmount - getPeriodPayableAmount(period));

const getPeriodAdjustmentAmount = (period: HrCommissionPeriodRecord): number =>
  period.manualAdjustmentAmount ?? 0;

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
        <MutedText>
          {formatDate(period.startDate)} - {formatDate(period.endDate)}
        </MutedText>
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
    render: (period) => period.entriesCount,
  },
  {
    title: 'A pagar',
    key: 'totalPayableAmount',
    align: 'right',
    width: 170,
    render: (period) => {
      const deductionAmount = getPeriodDeductionAmount(period);
      const adjustmentAmount = getPeriodAdjustmentAmount(period);

      return (
        <CellStack>
          <AmountText>
            {formatMoney(getPeriodPayableAmount(period), period.currency)}
          </AmountText>
          {adjustmentAmount > 0 ? (
            <MutedText>
              Ajuste -{formatMoney(adjustmentAmount, period.currency)}
            </MutedText>
          ) : deductionAmount > 0 ? (
            <MutedText>
              Deducciones -{formatMoney(deductionAmount, period.currency)}
            </MutedText>
          ) : null}
        </CellStack>
      );
    },
  },
  {
    title: 'Accion',
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
  onOpenAdjustment: (line: HrPayrollEmployeeLineRecord) => void;
  paymentActionKey: string | null;
  onOpenPayment: (line: HrPayrollEmployeeLineRecord) => void;
}

const getLineGrossAmount = (line: HrPayrollEmployeeLineRecord): number =>
  line.grossAmount || line.commissionAmount || line.netAmount || 0;

const getLineDeductionAmount = (line: HrPayrollEmployeeLineRecord): number =>
  line.deductionsAmount ||
  Math.max(0, getLineGrossAmount(line) - line.netAmount);

const getLineAdjustmentAmount = (line: HrPayrollEmployeeLineRecord): number =>
  line.manualAdjustmentAmount ?? 0;

const isLineAdjustable = (line: HrPayrollEmployeeLineRecord): boolean =>
  line.status === 'draft' || line.status === 'closed';

export const buildLineColumns = ({
  adjustmentActionKey,
  onOpenAdjustment,
  paymentActionKey,
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
        <MutedText>{line.employeeCode || line.employeeId}</MutedText>
      </CellStack>
    ),
  },
  {
    title: 'Entradas',
    key: 'entriesCount',
    align: 'right',
    width: 100,
    render: (line) => line.entriesCount,
  },
  {
    title: 'Estado',
    key: 'status',
    width: 120,
    render: (line) => (
      <StatusTag $tone={LINE_STATUS_TONES[line.status]}>
        {LINE_STATUS_LABELS[line.status]}
      </StatusTag>
    ),
  },
  {
    title: 'A pagar',
    key: 'netAmount',
    align: 'right',
    width: 190,
    render: (line) => {
      const deductionAmount = getLineDeductionAmount(line);
      const adjustmentAmount = getLineAdjustmentAmount(line);
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
          ) : null}
          {adjustmentComment ? (
            <MutedText>{adjustmentComment}</MutedText>
          ) : null}
        </CellStack>
      );
    },
  },
  {
    title: 'Accion',
    key: 'payment',
    align: 'right',
    width: 180,
    render: (line) => {
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

      if (line.status === 'approved') {
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

      if (isLineAdjustable(line)) {
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

export const paymentColumns: HrTableColumn<HrEmployeePaymentRecord>[] = [
  {
    title: 'Pago',
    key: 'payment',
    isRowHeader: true,
    render: (payment) => (
      <CellStack>
        <PrimaryText>
          {payment.employeeNameSnapshot ||
            payment.employeeCode ||
            payment.employeeId}
        </PrimaryText>
        <MutedText>
          {PAYMENT_METHOD_LABELS[payment.paymentMethod]} -{' '}
          {formatDate(payment.paymentDate)}
        </MutedText>
      </CellStack>
    ),
  },
  {
    title: 'Referencia',
    key: 'reference',
    width: 160,
    render: (payment) => (
      <MutedText>
        {payment.reference ||
          payment.transferReference ||
          payment.checkNumber ||
          '-'}
      </MutedText>
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
];
