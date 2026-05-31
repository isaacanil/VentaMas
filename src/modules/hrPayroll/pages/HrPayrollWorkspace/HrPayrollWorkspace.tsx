import { Alert, Button, Form, Input, Table, message } from 'antd';
import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { PlusOutlined, TeamOutlined } from '@/constants/icons/antd';
import {
  saveHrEmployee,
  useHrEmployees,
} from '@/firebase/hrPayroll/useHrEmployees';
import { useBusinessUsers } from '@/firebase/users/useBusinessUsers';
import { selectUser } from '@/features/auth/userSlice';
import {
  HrDescription as Description,
  HrPage as Page,
  HrPageHeader as Header,
  HrSummaryGrid as SummaryGrid,
  HrSummaryItem as SummaryItem,
  HrSummaryLabel as SummaryLabel,
  HrSummaryValue as SummaryValue,
  HrTableFrame as TableFrame,
  HrTitle as Title,
  HrTitleBlock as TitleBlock,
} from '@/modules/hrPayroll/components/HrPayrollPagePrimitives';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';
import type { HrEmployeeRecord } from '@/types/hrPayroll';
import { buildEmployeeColumns } from './HrPayrollWorkspace.columns';
import {
  type BusinessUser,
  buildInitialValues,
  getErrorMessage,
  getUserId,
  getUserLabel,
  matchesSearch,
} from './HrPayrollWorkspace.helpers';
import { PayrollToolbar } from './HrPayrollWorkspace.styles';
import {
  HrEmployeeEditorModal,
  type HrEmployeeFormValues,
} from './components/HrEmployeeEditorModal';

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

  const handleEditEmployee = useCallback((employee: HrEmployeeRecord) => {
    setSelectedEmployee(employee);
    setEditorOpen(true);
  }, []);

  const columns = useMemo(
    () =>
      buildEmployeeColumns({
        usersById,
        onEdit: handleEditEmployee,
      }),
    [handleEditEmployee, usersById],
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

        <PayrollToolbar>
          <Input.Search
            allowClear
            placeholder="Buscar por codigo, nombre, documento o contacto"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <Button icon={<TeamOutlined />} onClick={handleCreate}>
            Crear colaborador
          </Button>
        </PayrollToolbar>

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

      <HrEmployeeEditorModal
        employee={selectedEmployee}
        form={form}
        initialValues={formInitialValues}
        onCancel={handleCloseEditor}
        onSave={handleSave}
        open={editorOpen}
        saving={saving}
        userOptions={userOptions}
      />
    </>
  );
}
