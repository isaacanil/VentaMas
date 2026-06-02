import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import {
  VmAlert,
  VmButton,
  VmListBox,
  VmSearchField,
  VmSelect,
} from '@/components/heroui';
import { ReloadOutlined, TeamOutlined } from '@/constants/icons/antd';
import {
  recalculateHrCommissionEntries,
  useHrCommissionEntries,
} from '@/firebase/hrPayroll/useHrCommissionEntries';
import { selectUser } from '@/features/auth/userSlice';
import {
  HrDescription as Description,
  HrDataTable,
  HrDateRangeField,
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
import {
  formatHrMoney as formatMoney,
  HR_COMMISSION_ENTRY_STATUS_LABELS as STATUS_LABELS,
} from '@/modules/hrPayroll/utils/hrPayrollDisplay';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';
import type {
  HrCommissionEntryRecord,
  HrCommissionEntryStatus,
} from '@/types/hrPayroll';
import { commissionEntryColumns } from './HrCommissionsPage.columns';
import {
  getErrorMessage,
  matchesCommissionSearch,
} from './HrCommissionsPage.helpers';
import { CommissionsToolbar } from './HrCommissionsPage.styles';

type NoticeState = {
  description?: string;
  status: 'success' | 'danger';
  title: string;
};

const getDefaultDateRange = (): [Date, Date] => {
  const now = new Date();
  return [
    new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
    new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999),
  ];
};

export default function HrCommissionsPage() {
  const currentUser = useSelector(selectUser);
  const businessId = currentUser?.businessID ?? null;
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState<HrCommissionEntryStatus | 'all'>('all');
  const [dateRange, setDateRange] = useState<[Date, Date]>(getDefaultDateRange);
  const [recalculating, setRecalculating] = useState(false);
  const { rows, loading, error } = useHrCommissionEntries({
    businessId,
    startDate: dateRange[0],
    endDate: dateRange[1],
    status,
  });

  const filteredRows = useMemo(
    () => rows.filter((entry) => matchesCommissionSearch(entry, searchTerm)),
    [rows, searchTerm],
  );

  const summary = useMemo(
    () => ({
      total: rows.length,
      amount: rows.reduce((sum, entry) => sum + entry.commissionAmount, 0),
      unresolved: rows.filter((entry) => entry.status === 'requires_adjustment')
        .length,
      employees: new Set(rows.map((entry) => entry.employeeId).filter(Boolean))
        .size,
    }),
    [rows],
  );

  const handleRecalculate = async () => {
    if (!businessId || recalculating) return;
    setRecalculating(true);
    try {
      const result = await recalculateHrCommissionEntries({
        businessId,
        startDate: dateRange[0],
        endDate: dateRange[1],
      });
      setNotice({
        status: 'success',
        title: `Entradas actualizadas: ${result.writtenEntries}.`,
        description: `Revisar: ${result.unresolvedCount}.`,
      });
    } catch (recalculateError) {
      setNotice({
        status: 'danger',
        title: 'No se pudieron recalcular las comisiones.',
        description: getErrorMessage(recalculateError),
      });
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <>
      <MenuApp sectionName="Comisiones RRHH" />
      <Page>
        <Header>
          <TitleBlock>
            <Title>Comisiones de colaboradores</Title>
            <Description>
              Proyeccion de las comisiones operacionales hacia RRHH para
              preparar cortes y nomina sin duplicar el flujo de ventas.
            </Description>
          </TitleBlock>
          <VmButton
            variant="primary"
            isDisabled={recalculating}
            onPress={handleRecalculate}
          >
            <ReloadOutlined />
            {recalculating ? 'Recalculando...' : 'Recalcular'}
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
              Selecciona un negocio para revisar comisiones RRHH.
            </VmAlert.Content>
          </Notice>
        ) : null}

        {error ? (
          <Notice status="danger">
            <VmAlert.Content>
              <strong>No se pudieron cargar las comisiones RRHH.</strong>
              <div>{error.message}</div>
            </VmAlert.Content>
          </Notice>
        ) : null}

        <SummaryGrid>
          <SummaryItem>
            <SummaryLabel>Entradas</SummaryLabel>
            <SummaryValue>{summary.total}</SummaryValue>
          </SummaryItem>
          <SummaryItem>
            <SummaryLabel>Total comisiones</SummaryLabel>
            <SummaryValue>{formatMoney(summary.amount)}</SummaryValue>
          </SummaryItem>
          <SummaryItem>
            <SummaryLabel>Colaboradores</SummaryLabel>
            <SummaryValue>{summary.employees}</SummaryValue>
          </SummaryItem>
          <SummaryItem>
            <SummaryLabel>Por revisar</SummaryLabel>
            <SummaryValue>{summary.unresolved}</SummaryValue>
          </SummaryItem>
        </SummaryGrid>

        <CommissionsToolbar>
          <VmSearchField
            aria-label="Buscar comisiones"
            value={searchTerm}
            onChange={setSearchTerm}
          >
            <VmSearchField.Group>
              <VmSearchField.SearchIcon />
              <VmSearchField.Input placeholder="Buscar empleado, factura o servicio" />
              <VmSearchField.ClearButton />
            </VmSearchField.Group>
          </VmSearchField>
          <HrDateRangeField
            ariaLabel="Rango de comisiones RRHH"
            value={dateRange}
            onChange={setDateRange}
          />
          <VmSelect
            aria-label="Estado de comision"
            selectedKey={status}
            onSelectionChange={(key) =>
              setStatus(String(key) as HrCommissionEntryStatus | 'all')
            }
          >
            <VmSelect.Trigger>
              <VmSelect.Value />
              <VmSelect.Indicator />
            </VmSelect.Trigger>
            <VmSelect.Popover>
              <VmListBox aria-label="Estados de comision">
                <VmListBox.Item id="all" textValue="Todos los estados">
                  Todos los estados
                  <VmListBox.ItemIndicator />
                </VmListBox.Item>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <VmListBox.Item key={value} id={value} textValue={label}>
                    {label}
                    <VmListBox.ItemIndicator />
                  </VmListBox.Item>
                ))}
              </VmListBox>
            </VmSelect.Popover>
          </VmSelect>
          <VmButton
            variant="secondary"
            isDisabled={recalculating}
            onPress={handleRecalculate}
          >
            <TeamOutlined />
            Sincronizar
          </VmButton>
        </CommissionsToolbar>

        <HrDataTable<HrCommissionEntryRecord>
          ariaLabel="Comisiones de colaboradores"
          columns={commissionEntryColumns}
          emptyText="No hay comisiones para los filtros actuales."
          rows={filteredRows}
          loading={loading}
          pageSize={12}
        />
      </Page>
    </>
  );
}
