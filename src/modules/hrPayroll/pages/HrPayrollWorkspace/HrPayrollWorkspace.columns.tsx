import { EditOutlined, UserOutlined } from '@/constants/icons/antd';
import { VmButton, VmTooltip } from '@/components/heroui';
import {
  HrCellStack as CellStack,
  HrInlineStack as InlineStack,
  HrMutedText as MutedText,
  HrPrimaryText as PrimaryText,
  HrStatusTag as StatusTag,
  type HrTableColumn,
} from '@/modules/hrPayroll/components/HrPayrollPagePrimitives';
import {
  cleanString as toCleanString,
  formatHrMoney as formatMoney,
  HR_EMPLOYEE_DOCUMENT_TYPE_LABELS as DOCUMENT_TYPE_LABELS,
  HR_EMPLOYEE_PAY_TYPE_LABELS as PAY_TYPE_LABELS,
  HR_EMPLOYEE_STATUS_LABELS as STATUS_LABELS,
  HR_PAYMENT_METHOD_LABELS as PAYMENT_METHOD_LABELS,
} from '@/modules/hrPayroll/utils/hrPayrollDisplay';
import type { HrEmployeeRecord } from '@/types/hrPayroll';

interface EmployeeColumnsOptions {
  usersById: Map<string, string>;
  onEdit: (employee: HrEmployeeRecord) => void;
}

export const buildEmployeeColumns = ({
  usersById,
  onEdit,
}: EmployeeColumnsOptions): HrTableColumn<HrEmployeeRecord>[] => [
  {
    title: 'Colaborador',
    key: 'employee',
    width: 260,
    isRowHeader: true,
    render: (employee) => (
      <CellStack>
        <PrimaryText>{employee.fullName}</PrimaryText>
        <MutedText>
          {employee.code}
          {employee.documentId
            ? ` - ${
                DOCUMENT_TYPE_LABELS[employee.documentType ?? 'cedula']
              } ${employee.documentId}`
            : ''}
        </MutedText>
      </CellStack>
    ),
  },
  {
    title: 'Usuario',
    key: 'linkedUserId',
    width: 180,
    render: (employee) => {
      const userId = toCleanString(employee.linkedUserId);
      return userId ? (
        <StatusTag $tone="info">
          <UserOutlined />
          {usersById.get(userId) ?? userId}
        </StatusTag>
      ) : (
        <MutedText>Sin usuario</MutedText>
      );
    },
  },
  {
    title: 'Compensacion',
    key: 'compensation',
    width: 220,
    render: (employee) => (
      <CellStack>
        <PrimaryText>{PAY_TYPE_LABELS[employee.payType]}</PrimaryText>
        <MutedText>
          {employee.payType === 'hourly'
            ? formatMoney(employee.hourlyRateAmount, employee.currency)
            : formatMoney(employee.baseSalaryAmount, employee.currency)}
          {employee.commissionEnabled ? ' + comision' : ''}
        </MutedText>
      </CellStack>
    ),
  },
  {
    title: 'Pago',
    key: 'payment',
    width: 220,
    render: (employee) => (
      <CellStack>
        <PrimaryText>
          {PAYMENT_METHOD_LABELS[employee.paymentMethod]}
        </PrimaryText>
        <MutedText>{employee.paymentDestination || 'Sin destino'}</MutedText>
      </CellStack>
    ),
  },
  {
    title: 'Estado',
    key: 'status',
    width: 160,
    render: (employee) => (
      <InlineStack>
        <StatusTag $tone={employee.status === 'active' ? 'success' : 'default'}>
          {STATUS_LABELS[employee.status]}
        </StatusTag>
        {employee.readyToPayStatus === 'ready' ? (
          <StatusTag $tone="info">Listo para pagar</StatusTag>
        ) : (
          <VmTooltip>
            <VmTooltip.Trigger>
              <StatusTag $tone="warning">Revisar pago</StatusTag>
            </VmTooltip.Trigger>
            <VmTooltip.Content>
              {employee.readyToPayIssues.join(' ')}
            </VmTooltip.Content>
          </VmTooltip>
        )}
      </InlineStack>
    ),
  },
  {
    title: '',
    key: 'actions',
    width: 72,
    align: 'right',
    render: (employee) => (
      <VmTooltip>
        <VmTooltip.Trigger>
          <VmButton
            aria-label="Editar colaborador"
            variant="secondary"
            onPress={() => onEdit(employee)}
          >
            <EditOutlined />
          </VmButton>
        </VmTooltip.Trigger>
        <VmTooltip.Content>Editar colaborador</VmTooltip.Content>
      </VmTooltip>
    ),
  },
];
