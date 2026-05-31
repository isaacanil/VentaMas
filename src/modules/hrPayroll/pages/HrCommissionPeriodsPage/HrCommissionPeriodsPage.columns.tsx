import { Button, Popconfirm, Space, Tag } from 'antd';
import type { TableProps } from 'antd';

import {
  CheckCircleOutlined,
  DollarOutlined,
  LockOutlined,
} from '@/constants/icons/antd';
import {
  HrAmountText as AmountText,
  HrCellStack as CellStack,
  HrMutedText as MutedText,
  HrPrimaryText as PrimaryText,
} from '@/modules/hrPayroll/components/HrPayrollPagePrimitives';
import {
  formatHrDate as formatDate,
  formatHrMoney as formatMoney,
  HR_COMMISSION_PERIOD_STATUS_COLORS as STATUS_COLORS,
  HR_COMMISSION_PERIOD_STATUS_LABELS as STATUS_LABELS,
  HR_PAYMENT_METHOD_LABELS as PAYMENT_METHOD_LABELS,
  HR_PAYROLL_RUN_STATUS_COLORS as LINE_STATUS_COLORS,
  HR_PAYROLL_RUN_STATUS_LABELS as LINE_STATUS_LABELS,
} from '@/modules/hrPayroll/utils/hrPayrollDisplay';
import type {
  HrEmployeePaymentRecord,
  HrCommissionPeriodRecord,
  HrCommissionPeriodStatus,
  HrPayrollEmployeeLineRecord,
  HrPayrollRunStatus,
} from '@/types/hrPayroll';

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
}: PeriodColumnsOptions): TableProps<HrCommissionPeriodRecord>['columns'] => [
  {
    title: 'Corte',
    dataIndex: 'label',
    key: 'label',
    width: 260,
    render: (_value, period) => (
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
    dataIndex: 'status',
    key: 'status',
    width: 120,
    render: (status: HrCommissionPeriodStatus) => (
      <Tag color={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Tag>
    ),
  },
  {
    title: 'Colab.',
    dataIndex: 'employeesCount',
    key: 'employeesCount',
    align: 'right',
    width: 90,
  },
  {
    title: 'Comisiones',
    dataIndex: 'entriesCount',
    key: 'entriesCount',
    align: 'right',
    width: 110,
  },
  {
    title: 'Total',
    dataIndex: 'totalCommissionAmount',
    key: 'totalCommissionAmount',
    align: 'right',
    width: 140,
    render: (_value, period) => (
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
    render: (_value, period) => (
      <Space>
        <Button
          size="small"
          icon={<LockOutlined />}
          disabled={period.status !== 'draft'}
          loading={actionKey === `close:${period.id}`}
          onClick={() => onAction('close', period)}
        >
          Cerrar
        </Button>
        <Popconfirm
          title="Aprobar corte"
          description="Se marcara la corrida como aprobada y se emitira el evento contable."
          okText="Aprobar"
          cancelText="Cancelar"
          disabled={period.status !== 'closed'}
          onConfirm={() => onAction('approve', period)}
        >
          <Button
            size="small"
            type="primary"
            icon={<CheckCircleOutlined />}
            disabled={period.status !== 'closed'}
            loading={actionKey === `approve:${period.id}`}
          >
            Aprobar
          </Button>
        </Popconfirm>
      </Space>
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
}: LineColumnsOptions): TableProps<HrPayrollEmployeeLineRecord>['columns'] => [
  {
    title: 'Colaborador',
    key: 'employee',
    render: (_value, line) => (
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
    dataIndex: 'entriesCount',
    key: 'entriesCount',
    align: 'right',
    width: 100,
  },
  {
    title: 'Estado',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    render: (status: HrPayrollRunStatus) => (
      <Tag color={LINE_STATUS_COLORS[status]}>{LINE_STATUS_LABELS[status]}</Tag>
    ),
  },
  {
    title: 'Neto',
    dataIndex: 'netAmount',
    key: 'netAmount',
    align: 'right',
    width: 140,
    render: (_value, line) => (
      <AmountText>{formatMoney(line.netAmount, line.currency)}</AmountText>
    ),
  },
  {
    title: '',
    key: 'payment',
    align: 'right',
    width: 120,
    render: (_value, line) => (
      <Button
        size="small"
        type={line.status === 'paid' ? 'default' : 'primary'}
        icon={<DollarOutlined />}
        disabled={line.status !== 'approved'}
        loading={paymentActionKey === `pay:${line.id}`}
        onClick={() => onOpenPayment(line)}
      >
        {line.status === 'paid' ? 'Pagado' : 'Pagar'}
      </Button>
    ),
  },
];

export const paymentColumns: TableProps<HrEmployeePaymentRecord>['columns'] = [
  {
    title: 'Pago',
    key: 'payment',
    render: (_value, payment) => (
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
    dataIndex: 'reference',
    key: 'reference',
    width: 160,
    render: (_value, payment) => (
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
    dataIndex: 'amount',
    key: 'amount',
    align: 'right',
    width: 130,
    render: (_value, payment) => (
      <AmountText>{formatMoney(payment.amount, payment.currency)}</AmountText>
    ),
  },
];
