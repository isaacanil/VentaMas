import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import {
  VmAlert,
  VmButton,
  VmSearchField,
} from '@/components/heroui';
import { PlusOutlined } from '@/constants/icons/antd';
import {
  saveHrEmployee,
  useHrEmployees,
} from '@/firebase/hrPayroll/useHrEmployees';
import { useBusinessUsers } from '@/firebase/users/useBusinessUsers';
import { selectUser } from '@/features/auth/userSlice';
import {
  HrDescription as Description,
  HrDataTable,
  HrNotice as Notice,
  HrPage as Page,
  HrPageHeader as Header,
  HrSummaryGrid as SummaryGrid,
  HrSummaryItem as SummaryItem,
  HrSummaryLabel as SummaryLabel,
  HrSummaryValue as SummaryValue,
  HrTitle as Title,
  HrTitleBlock as TitleBlock,
} from '@/modules/hrPayroll/components/HrPayrollPagePrimitives';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';
import type { HrEmployeeRecord } from '@/types/hrPayroll';
import { buildEmployeeColumns } from './HrPayrollWorkspace.columns';
import {
  type BusinessUser,
  buildLinkedUserOptions,
  buildInitialValues,
  buildUserLabelMap,
  getErrorMessage,
  matchesSearch,
} from './HrPayrollWorkspace.helpers';
import { PayrollToolbar } from './HrPayrollWorkspace.styles';
import {
  HrEmployeeEditorModal,
  type HrEmployeeFormValues,
} from './components/HrEmployeeEditorModal';

type NoticeState = {
  description?: string;
  status: 'success' | 'danger' | 'warning';
  title: string;
};

export default function HrPayrollWorkspace() {
  const currentUser = useSelector(selectUser);
  const businessId = currentUser?.businessID ?? null;
  const { rows: employees, loading, error } = useHrEmployees(businessId);
  const { users: businessUsers } = useBusinessUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] =
    useState<HrEmployeeRecord | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<NoticeState | null>(null);

  const userOptions = useMemo(
    () => buildLinkedUserOptions(businessUsers as BusinessUser[]),
    [businessUsers],
  );

  const usersById = useMemo(
    () => buildUserLabelMap(userOptions),
    [userOptions],
  );

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
    setNotice(null);
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
    setNotice(null);
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
      setNotice({
        status: 'success',
        title: 'Colaborador guardado.',
      });
      handleCloseEditor();
    } catch (saveError) {
      setNotice({
        status: 'danger',
        title: 'No se pudo guardar el colaborador.',
        description: getErrorMessage(saveError),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <MenuApp sectionName="RRHH y nomina" />
      <Page>
        <Header>
          <TitleBlock>
            <Title>Colaboradores y nomina</Title>
            <Description>
              Catalogo de colaboradores vinculable a usuarios operativos, con
              datos de pago y comisiones listos para alimentar corridas de
              nomina.
            </Description>
          </TitleBlock>
          <VmButton variant="primary" onPress={handleCreate}>
            <PlusOutlined />
            Nuevo colaborador
          </VmButton>
        </Header>

        {notice ? (
          <Notice status={notice.status}>
            <VmAlert.Content>
              <strong>{notice.title}</strong>
              {notice.description ? <div>{notice.description}</div> : null}
            </VmAlert.Content>
          </Notice>
        ) : null}

        {!businessId ? (
          <Notice status="warning">
            <VmAlert.Content>
              Selecciona un negocio para gestionar RRHH.
            </VmAlert.Content>
          </Notice>
        ) : null}

        {error ? (
          <Notice status="danger">
            <VmAlert.Content>
              <strong>No se pudieron cargar los colaboradores.</strong>
              <div>{error.message}</div>
            </VmAlert.Content>
          </Notice>
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
          <VmSearchField
            aria-label="Buscar colaboradores"
            value={searchTerm}
            onChange={setSearchTerm}
          >
            <VmSearchField.Group>
              <VmSearchField.SearchIcon />
              <VmSearchField.Input placeholder="Buscar por codigo, nombre, documento o contacto" />
              <VmSearchField.ClearButton />
            </VmSearchField.Group>
          </VmSearchField>
        </PayrollToolbar>

        <HrDataTable<HrEmployeeRecord>
          ariaLabel="Colaboradores de RRHH"
          columns={columns}
          emptyText="No hay colaboradores para los filtros actuales."
          rows={filteredEmployees}
          loading={loading}
          minTableWidth={920}
          pageSize={12}
        />
      </Page>

      {editorOpen ? (
        <HrEmployeeEditorModal
          key={selectedEmployee?.id ?? 'new'}
          employee={selectedEmployee}
          initialValues={formInitialValues}
          onCancel={handleCloseEditor}
          onSave={handleSave}
          open={editorOpen}
          saving={saving}
          userOptions={userOptions}
        />
      ) : null}
    </>
  );
}
