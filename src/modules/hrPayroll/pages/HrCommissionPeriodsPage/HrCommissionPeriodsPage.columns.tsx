import { VmAlertDialog, VmButton } from '@/components/heroui';
import {
  CheckCircleOutlined,
  DollarOutlined,
  LockOutlined,
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

interface PeriodColumnsOptions {
  actionKey: string | null;
  onAction: (
    action: 'close' | 'approve',
    period: HrCommissionPeriodRecord,
  ) => void;
}

export const buildPeriodColumns = ({
  actionKey,
  onAction,
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
    title: 'Total',
    key: 'totalCommissionAmount',
    align: 'right',
    width: 140,
    render: (period) => (
      <AmountText>
        {formatMoney(period.totalCommissionAmount, period.currency)}
      </AmountText>
    ),
  },
  {
    title: '',
    key: 'actions',
    align: 'right',
    width: 190,
    render: (period) => (
      <ActionGroup>
        <VmButton
          variant="secondary"
          isDisabled={
            period.status !== 'draft' || actionKey === `close:${period.id}`
          }
          onPress={() => onAction('close', period)}
        >
          <LockOutlined />
          {actionKey === `close:${period.id}` ? 'Cerrando...' : 'Cerrar'}
        </VmButton>
        <VmAlertDialog>
          <VmButton
            variant="primary"
            isDisabled={
              period.status !== 'closed' ||
              actionKey === `approve:${period.id}`
            }
          >
            <CheckCircleOutlined />
            {actionKey === `approve:${period.id}` ? 'Aprobando...' : 'Aprobar'}
          </VmButton>
          <VmAlertDialog.Backdrop>
            <VmAlertDialog.Container>
              <VmAlertDialog.Dialog>
                <VmAlertDialog.Header>
                  <VmAlertDialog.Heading>
                    Aprobar corte
                  </VmAlertDialog.Heading>
                </VmAlertDialog.Header>
                <VmAlertDialog.Body>
                  Se marcara la corrida como aprobada y se emitira el evento
                  contable.
                </VmAlertDialog.Body>
                <VmAlertDialog.Footer>
                  <VmButton slot="close" variant="secondary">
                    Cancelar
                  </VmButton>
                  <VmButton
                    slot="close"
                    variant="primary"
                    onPress={() => onAction('approve', period)}
                  >
                    Aprobar
                  </VmButton>
                </VmAlertDialog.Footer>
              </VmAlertDialog.Dialog>
            </VmAlertDialog.Container>
          </VmAlertDialog.Backdrop>
        </VmAlertDialog>
      </ActionGroup>
    ),
  },
];

interface LineColumnsOptions {
  paymentActionKey: string | null;
  onOpenPayment: (line: HrPayrollEmployeeLineRecord) => void;
}

export const buildLineColumns = ({
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
    title: 'Neto',
    key: 'netAmount',
    align: 'right',
    width: 140,
    render: (line) => (
      <AmountText>{formatMoney(line.netAmount, line.currency)}</AmountText>
    ),
  },
  {
    title: '',
    key: 'payment',
    align: 'right',
    width: 120,
    render: (line) => (
      <VmButton
        variant={line.status === 'paid' ? 'secondary' : 'primary'}
        isDisabled={
          line.status !== 'approved' || paymentActionKey === `pay:${line.id}`
        }
        onPress={() => onOpenPayment(line)}
      >
        <DollarOutlined />
        {line.status === 'paid' ? 'Pagado' : 'Pagar'}
      </VmButton>
    ),
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
