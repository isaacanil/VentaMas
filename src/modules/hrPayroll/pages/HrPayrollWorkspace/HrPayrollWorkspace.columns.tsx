import { Button, Space, Tag, Tooltip } from 'antd';
import type { TableProps } from 'antd';

import { EditOutlined, UserOutlined } from '@/constants/icons/antd';
import {
  HrCellStack as CellStack,
  HrMutedText as MutedText,
  HrPrimaryText as PrimaryText,
} from '@/modules/hrPayroll/components/HrPayrollPagePrimitives';
import {
  cleanString as toCleanString,
  formatHrMoney as formatMoney,
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
}: EmployeeColumnsOptions): TableProps<HrEmployeeRecord>['columns'] => [
  {
    title: 'Empleado',
    dataIndex: 'fullName',
    key: 'employee',
    width: 260,
    render: (_value, employee) => (
      <CellStack>
        <PrimaryText>{employee.fullName}</PrimaryText>
        <MutedText>
          {employee.code}
          {employee.documentId ? ` - ${employee.documentId}` : ''}
        </MutedText>
      </CellStack>
    ),
  },
  {
    title: 'Usuario',
    dataIndex: 'linkedUserId',
    key: 'linkedUserId',
    width: 180,
    render: (linkedUserId) => {
      const userId = toCleanString(linkedUserId);
      return userId ? (
        <Tag icon={<UserOutlined />}>{usersById.get(userId) ?? userId}</Tag>
      ) : (
        <MutedText>Sin usuario</MutedText>
      );
    },
  },
  {
    title: 'Compensacion',
    key: 'compensation',
    width: 220,
    render: (_value, employee) => (
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
    render: (_value, employee) => (
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
    dataIndex: 'status',
    key: 'status',
    width: 160,
    render: (_value, employee) => (
      <Space size={4} direction="vertical">
        <Tag color={employee.status === 'active' ? 'green' : 'default'}>
          {STATUS_LABELS[employee.status]}
        </Tag>
        {employee.readyToPayStatus === 'ready' ? (
          <Tag color="blue">Listo para pagar</Tag>
        ) : (
          <Tooltip title={employee.readyToPayIssues.join(' ')}>
            <Tag color="orange">Revisar pago</Tag>
          </Tooltip>
        )}
      </Space>
    ),
  },
  {
    title: '',
    key: 'actions',
    width: 72,
    fixed: 'right',
    render: (_value, employee) => (
      <Tooltip title="Editar empleado">
        <Button
          aria-label="Editar empleado"
          icon={<EditOutlined />}
          onClick={() => onEdit(employee)}
        />
      </Tooltip>
    ),
  },
];
