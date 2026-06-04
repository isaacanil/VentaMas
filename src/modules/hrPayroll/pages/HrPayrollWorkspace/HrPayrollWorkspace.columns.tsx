import {
  EditOutlined,
  MoreOutlined,
  PercentageOutlined,
  UserOutlined,
} from '@/constants/icons/antd';
import { VmDropdown, VmTooltip } from '@/components/heroui';
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
import { summarizeSalaryDeductions } from '@/utils/hrPayroll/salaryDeductions';

interface EmployeeColumnsOptions {
  usersById: Map<string, string>;
  onConfigureCommissions: (employee: HrEmployeeRecord) => void;
  onEdit: (employee: HrEmployeeRecord) => void;
}

export const buildEmployeeColumns = ({
  usersById,
  onConfigureCommissions,
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
    render: (employee) => {
      const deductionSummary = summarizeSalaryDeductions(
        employee.salaryDeductions,
      );
      return (
        <CellStack>
          <PrimaryText>{PAY_TYPE_LABELS[employee.payType]}</PrimaryText>
          <MutedText>
            {employee.payType === 'hourly'
              ? formatMoney(employee.hourlyRateAmount, employee.currency)
              : formatMoney(employee.baseSalaryAmount, employee.currency)}
            {employee.commissionEnabled ? ' + comision' : ''}
          </MutedText>
          {deductionSummary ? <MutedText>{deductionSummary}</MutedText> : null}
        </CellStack>
      );
    },
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
    width: 84,
    align: 'right',
    render: (employee) => (
      <VmDropdown>
        <VmDropdown.Button
          aria-label={`Acciones de ${employee.fullName}`}
          isIconOnly
          size="sm"
        >
          <MoreOutlined />
        </VmDropdown.Button>
        <VmDropdown.Popover>
          <VmDropdown.Menu
            aria-label={`Acciones de ${employee.fullName}`}
            onAction={(key) => {
              if (key === 'edit') {
                onEdit(employee);
                return;
              }
              if (key === 'service-commission') {
                onConfigureCommissions(employee);
              }
            }}
          >
            <VmDropdown.Item id="edit" textValue="Editar">
              <InlineStack>
                <EditOutlined />
                <span>Editar</span>
              </InlineStack>
            </VmDropdown.Item>
            <VmDropdown.Item
              id="service-commission"
              textValue="Comision por servicio"
            >
              <InlineStack>
                <PercentageOutlined />
                <span>Comision por servicio</span>
              </InlineStack>
            </VmDropdown.Item>
          </VmDropdown.Menu>
        </VmDropdown.Popover>
      </VmDropdown>
    ),
  },
];
