import {
  Alert,
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  message,
} from 'antd';
import type { TableProps } from 'antd';
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { PageShell } from '@/components/layout/PageShell';
import {
  EditOutlined,
  PlusOutlined,
  TeamOutlined,
  UserOutlined,
} from '@/constants/icons/antd';
import {
  saveHrEmployee,
  useHrEmployees,
} from '@/firebase/hrPayroll/useHrEmployees';
import { useBusinessUsers } from '@/firebase/users/useBusinessUsers';
import { selectUser } from '@/features/auth/userSlice';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';
import type {
  HrCommissionType,
  HrEmployeeInput,
  HrEmployeePayType,
  HrEmployeeRecord,
  HrEmployeeStatus,
  HrPaymentMethod,
} from '@/types/hrPayroll';

type BusinessUser = Record<string, unknown> & {
  id?: string;
  uid?: string;
  name?: string;
  displayName?: string;
  realName?: string;
  email?: string;
};

type HrEmployeeFormValues = HrEmployeeInput;

const STATUS_LABELS: Record<HrEmployeeStatus, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  suspended: 'Suspendido',
  terminated: 'Terminado',
};

const PAY_TYPE_LABELS: Record<HrEmployeePayType, string> = {
  salary: 'Salario',
  hourly: 'Por hora',
  commission_only: 'Solo comision',
  mixed: 'Mixto',
};

const PAYMENT_METHOD_LABELS: Record<HrPaymentMethod, string> = {
  cash: 'Efectivo',
  bank_transfer: 'Transferencia',
  transfer: 'Transferencia',
  card: 'Tarjeta',
  check: 'Cheque',
  other: 'Otro',
};

const COMMISSION_TYPE_LABELS: Record<HrCommissionType, string> = {
  percentage: 'Porcentaje',
  fixed: 'Monto fijo',
};

const DEFAULT_FORM_VALUES: HrEmployeeFormValues = {
  status: 'active',
  payType: 'salary',
  baseSalaryAmount: 0,
  hourlyRateAmount: 0,
  currency: 'DOP',
  paymentMethod: 'bank_transfer',
  commissionEnabled: false,
  defaultCommissionType: 'percentage',
  defaultCommissionRate: null,
};

const Page = styled(PageShell)`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
  padding: var(--ds-space-5);
  overflow: auto;
  background: var(--ds-color-bg-page);
`;

const Header = styled.header`
  display: flex;
  gap: var(--ds-space-4);
  align-items: flex-start;
  justify-content: space-between;

  @media (max-width: 860px) {
    flex-direction: column;
  }
`;

const TitleBlock = styled.div`
  display: grid;
  gap: var(--ds-space-1);
`;

const Title = styled.h1`
  margin: 0;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-xl);
  font-weight: var(--ds-font-weight-semibold);
  line-height: var(--ds-line-height-tight);
`;

const Description = styled.p`
  max-width: 760px;
  margin: 0;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(140px, 1fr));
  gap: var(--ds-space-3);

  @media (max-width: 920px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const SummaryItem = styled.div`
  display: grid;
  gap: var(--ds-space-1);
  min-width: 0;
  padding: var(--ds-space-3);
  border: 1px solid var(--ds-color-border-subtle);
  border-radius: 8px;
  background: var(--ds-color-bg-surface);
`;

const SummaryLabel = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
`;

const SummaryValue = styled.strong`
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-lg);
  line-height: var(--ds-line-height-tight);
`;

const Toolbar = styled.div`
  display: grid;
  grid-template-columns: minmax(240px, 420px) max-content;
  gap: var(--ds-space-3);
  align-items: center;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const TableFrame = styled.div`
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--ds-color-border-subtle);
  border-radius: 8px;
  background: var(--ds-color-bg-surface);
`;

const EmployeeNameCell = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

const PrimaryText = styled.span`
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
`;

const MutedText = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
`;

const MoneyStack = styled.div`
  display: grid;
  gap: 2px;
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ds-space-3);

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const FullWidthField = styled.div`
  grid-column: 1 / -1;
`;

const ModalActions = styled.div`
  display: flex;
  gap: var(--ds-space-2);
  justify-content: flex-end;
  margin-top: var(--ds-space-2);
`;

const toCleanString = (value: unknown): string | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const getUserId = (user: BusinessUser): string | null =>
  toCleanString(user.uid) ?? toCleanString(user.id);

const getUserLabel = (user: BusinessUser): string => {
  const id = getUserId(user);
  return (
    toCleanString(user.displayName) ??
    toCleanString(user.realName) ??
    toCleanString(user.name) ??
    toCleanString(user.email) ??
    id ??
    'Usuario'
  );
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'No se pudo completar la operacion.';
};

const formatMoney = (amount: number, currency = 'DOP') =>
  new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);

const buildInitialValues = (
  employee: HrEmployeeRecord | null,
): HrEmployeeFormValues => {
  if (!employee) return DEFAULT_FORM_VALUES;
  return {
    ...DEFAULT_FORM_VALUES,
    id: employee.id,
    employeeId: employee.employeeId,
    partyId: employee.partyId,
    code: employee.code,
    fullName: employee.fullName,
    legalName: employee.legalName,
    documentId: employee.documentId,
    email: employee.email,
    phone: employee.phone,
    address: employee.address,
    linkedUserId: employee.linkedUserId,
    status: employee.status,
    payType: employee.payType,
    baseSalaryAmount: employee.baseSalaryAmount,
    hourlyRateAmount: employee.hourlyRateAmount,
    currency: employee.currency,
    paymentMethod: employee.paymentMethod,
    paymentDestination: employee.paymentDestination,
    commissionEnabled: employee.commissionEnabled,
    defaultCommissionType: employee.defaultCommissionType,
    defaultCommissionRate: employee.defaultCommissionRate,
    notes: employee.notes,
  };
};

const matchesSearch = (employee: HrEmployeeRecord, searchTerm: string) => {
  if (!searchTerm) return true;
  const haystack = [
    employee.code,
    employee.fullName,
    employee.documentId,
    employee.email,
    employee.phone,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(searchTerm.toLowerCase());
};

export default function HrPayrollWorkspace() {
  const currentUser = useSelector(selectUser);
  const businessId = currentUser?.businessID ?? null;
  const { rows: employees, loading, error } = useHrEmployees(businessId);
  const { users: businessUsers } = useBusinessUsers();
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm<HrEmployeeFormValues>();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] =
    useState<HrEmployeeRecord | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const userOptions = useMemo(
    () =>
      (businessUsers as BusinessUser[])
        .map((businessUser) => {
          const value = getUserId(businessUser);
          if (!value) return null;
          return {
            value,
            label: getUserLabel(businessUser),
          };
        })
        .filter(
          (option): option is { value: string; label: string } =>
            option !== null,
        ),
    [businessUsers],
  );

  const usersById = useMemo(() => {
    const entries = userOptions.map((option): [string, string] => [
      option.value,
      option.label,
    ]);
    return new Map<string, string>(entries);
  }, [userOptions]);

  const filteredEmployees = useMemo(
    () => employees.filter((employee) => matchesSearch(employee, searchTerm)),
    [employees, searchTerm],
  );

  const summary = useMemo(
    () => ({
      total: employees.length,
      active: employees.filter((employee) => employee.status === 'active')
        .length,
      ready: employees.filter(
        (employee) => employee.readyToPayStatus === 'ready',
      ).length,
      linkedUsers: employees.filter((employee) => employee.linkedUserId).length,
    }),
    [employees],
  );

  const formInitialValues = useMemo(
    () => buildInitialValues(selectedEmployee),
    [selectedEmployee],
  );

  const columns: TableProps<HrEmployeeRecord>['columns'] = useMemo(
    () => [
      {
        title: 'Empleado',
        dataIndex: 'fullName',
        key: 'employee',
        width: 260,
        render: (_value, employee) => (
          <EmployeeNameCell>
            <PrimaryText>{employee.fullName}</PrimaryText>
            <MutedText>
              {employee.code}
              {employee.documentId ? ` · ${employee.documentId}` : ''}
            </MutedText>
          </EmployeeNameCell>
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
          <MoneyStack>
            <PrimaryText>{PAY_TYPE_LABELS[employee.payType]}</PrimaryText>
            <MutedText>
              {employee.payType === 'hourly'
                ? formatMoney(employee.hourlyRateAmount, employee.currency)
                : formatMoney(employee.baseSalaryAmount, employee.currency)}
              {employee.commissionEnabled ? ' + comision' : ''}
            </MutedText>
          </MoneyStack>
        ),
      },
      {
        title: 'Pago',
        key: 'payment',
        width: 220,
        render: (_value, employee) => (
          <MoneyStack>
            <PrimaryText>
              {PAYMENT_METHOD_LABELS[employee.paymentMethod]}
            </PrimaryText>
            <MutedText>
              {employee.paymentDestination || 'Sin destino'}
            </MutedText>
          </MoneyStack>
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
              onClick={() => {
                setSelectedEmployee(employee);
                setEditorOpen(true);
              }}
            />
          </Tooltip>
        ),
      },
    ],
    [usersById],
  );

  const handleCreate = () => {
    setSelectedEmployee(null);
    setEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setEditorOpen(false);
    setSelectedEmployee(null);
  };

  const handleSave = async (values: HrEmployeeFormValues) => {
    if (!businessId) return;
    setSaving(true);
    try {
      await saveHrEmployee({
        businessId,
        employee: {
          ...values,
          id: selectedEmployee?.id ?? values.id,
          employeeId: selectedEmployee?.employeeId ?? values.employeeId,
        },
      });
      messageApi.success('Empleado guardado.');
      handleCloseEditor();
    } catch (saveError) {
      messageApi.error(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {contextHolder}
      <MenuApp sectionName="RRHH y nomina" />
      <Page>
        <Header>
          <TitleBlock>
            <Title>Colaboradores y nomina</Title>
            <Description>
              Base de empleados vinculable a usuarios operativos, con datos de
              pago y comisiones listos para alimentar corridas de nomina.
            </Description>
          </TitleBlock>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Nuevo empleado
          </Button>
        </Header>

        {!businessId ? (
          <Alert
            type="warning"
            showIcon
            message="Selecciona un negocio para gestionar RRHH."
          />
        ) : null}

        {error ? (
          <Alert
            type="error"
            showIcon
            message="No se pudieron cargar los empleados."
            description={error.message}
          />
        ) : null}

        <SummaryGrid>
          <SummaryItem>
            <SummaryLabel>Total</SummaryLabel>
            <SummaryValue>{summary.total}</SummaryValue>
          </SummaryItem>
          <SummaryItem>
            <SummaryLabel>Activos</SummaryLabel>
            <SummaryValue>{summary.active}</SummaryValue>
          </SummaryItem>
          <SummaryItem>
            <SummaryLabel>Listos para pagar</SummaryLabel>
            <SummaryValue>{summary.ready}</SummaryValue>
          </SummaryItem>
          <SummaryItem>
            <SummaryLabel>Vinculados a usuario</SummaryLabel>
            <SummaryValue>{summary.linkedUsers}</SummaryValue>
          </SummaryItem>
        </SummaryGrid>

        <Toolbar>
          <Input.Search
            allowClear
            placeholder="Buscar por codigo, nombre, documento o contacto"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <Button icon={<TeamOutlined />} onClick={handleCreate}>
            Crear colaborador
          </Button>
        </Toolbar>

        <TableFrame>
          <Table<HrEmployeeRecord>
            columns={columns}
            dataSource={filteredEmployees}
            loading={loading}
            rowKey="id"
            scroll={{ x: 980 }}
            pagination={{
              pageSize: 12,
              showSizeChanger: false,
            }}
          />
        </TableFrame>
      </Page>

      <Modal
        title={selectedEmployee ? 'Editar empleado' : 'Nuevo empleado'}
        open={editorOpen}
        onCancel={handleCloseEditor}
        footer={null}
        destroyOnHidden
        afterClose={() => form.resetFields()}
      >
        <Form<HrEmployeeFormValues>
          form={form}
          layout="vertical"
          initialValues={formInitialValues}
          onFinish={handleSave}
        >
          <FieldGrid>
            <Form.Item
              name="code"
              label="Codigo"
              rules={[{ required: true, message: 'El codigo es requerido.' }]}
            >
              <Input placeholder="EMP-001" />
            </Form.Item>
            <Form.Item
              name="status"
              label="Estado"
              rules={[{ required: true, message: 'El estado es requerido.' }]}
            >
              <Select
                options={Object.entries(STATUS_LABELS).map(
                  ([value, label]) => ({
                    value,
                    label,
                  }),
                )}
              />
            </Form.Item>
            <Form.Item
              name="fullName"
              label="Nombre"
              rules={[{ required: true, message: 'El nombre es requerido.' }]}
            >
              <Input placeholder="Nombre del colaborador" />
            </Form.Item>
            <Form.Item name="documentId" label="Documento">
              <Input placeholder="Cedula, pasaporte o RNC" />
            </Form.Item>
            <Form.Item name="linkedUserId" label="Usuario vinculado">
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="Sin usuario"
                options={userOptions}
              />
            </Form.Item>
            <Form.Item name="email" label="Correo">
              <Input type="email" placeholder="correo@empresa.com" />
            </Form.Item>
            <Form.Item name="phone" label="Telefono">
              <Input placeholder="809-000-0000" />
            </Form.Item>
            <Form.Item name="payType" label="Tipo de pago">
              <Select
                options={Object.entries(PAY_TYPE_LABELS).map(
                  ([value, label]) => ({
                    value,
                    label,
                  }),
                )}
              />
            </Form.Item>
            <Form.Item name="baseSalaryAmount" label="Salario base">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="hourlyRateAmount" label="Tarifa por hora">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="currency" label="Moneda">
              <Input maxLength={3} placeholder="DOP" />
            </Form.Item>
            <Form.Item name="paymentMethod" label="Metodo de pago">
              <Select
                options={Object.entries(PAYMENT_METHOD_LABELS).map(
                  ([value, label]) => ({
                    value,
                    label,
                  }),
                )}
              />
            </Form.Item>
            <Form.Item name="paymentDestination" label="Destino de pago">
              <Input placeholder="Cuenta, banco o referencia" />
            </Form.Item>
            <Form.Item
              name="commissionEnabled"
              label="Comisiones"
              valuePropName="checked"
            >
              <Switch checkedChildren="Activas" unCheckedChildren="No" />
            </Form.Item>
            <Form.Item name="defaultCommissionType" label="Tipo de comision">
              <Select
                options={Object.entries(COMMISSION_TYPE_LABELS).map(
                  ([value, label]) => ({
                    value,
                    label,
                  }),
                )}
              />
            </Form.Item>
            <Form.Item name="defaultCommissionRate" label="Valor de comision">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <FullWidthField>
              <Form.Item name="address" label="Direccion">
                <Input placeholder="Direccion" />
              </Form.Item>
            </FullWidthField>
            <FullWidthField>
              <Form.Item name="notes" label="Notas">
                <Input.TextArea rows={3} placeholder="Notas internas" />
              </Form.Item>
            </FullWidthField>
          </FieldGrid>

          <ModalActions>
            <Button onClick={handleCloseEditor}>Cancelar</Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              Guardar
            </Button>
          </ModalActions>
        </Form>
      </Modal>
    </>
  );
}
