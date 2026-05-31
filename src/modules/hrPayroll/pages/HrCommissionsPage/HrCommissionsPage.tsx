import { Alert, Button, DatePicker, Input, Select, Table, message } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { ReloadOutlined, TeamOutlined } from '@/constants/icons/antd';
import {
  recalculateHrCommissionEntries,
  useHrCommissionEntries,
} from '@/firebase/hrPayroll/useHrCommissionEntries';
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

const { RangePicker } = DatePicker;

export default function HrCommissionsPage() {
  const currentUser = useSelector(selectUser);
  const businessId = currentUser?.businessID ?? null;
  const [messageApi, contextHolder] = message.useMessage();
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState<HrCommissionEntryStatus | 'all'>('all');
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>(() => [
    dayjs().startOf('month'),
    dayjs().endOf('day'),
  ]);
  const [recalculating, setRecalculating] = useState(false);
  const { rows, loading, error } = useHrCommissionEntries({
    businessId,
    startDate: dateRange[0].toDate(),
    endDate: dateRange[1].toDate(),
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
        startDate: dateRange[0].toDate(),
        endDate: dateRange[1].toDate(),
      });
      messageApi.success(
        `Entradas actualizadas: ${result.writtenEntries}. Revisar: ${result.unresolvedCount}.`,
      );
    } catch (recalculateError) {
      messageApi.error(getErrorMessage(recalculateError));
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <>
      {contextHolder}
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
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            loading={recalculating}
            onClick={handleRecalculate}
          >
            Recalcular
          </Button>
        </Header>

        {!businessId ? (
          <Alert
            type="warning"
            showIcon
            message="Selecciona un negocio para revisar comisiones RRHH."
          />
        ) : null}

        {error ? (
          <Alert
            type="error"
            showIcon
            message="No se pudieron cargar las comisiones RRHH."
            description={error.message}
          />
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
          <Input.Search
            allowClear
            placeholder="Buscar empleado, factura o servicio"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <RangePicker
            value={dateRange}
            onChange={(range) => {
              if (!range?.[0] || !range?.[1]) return;
              setDateRange([range[0], range[1]]);
            }}
            style={{ width: '100%' }}
          />
          <Select
            value={status}
            onChange={setStatus}
            options={[
              { value: 'all', label: 'Todos los estados' },
              ...Object.entries(STATUS_LABELS).map(([value, label]) => ({
                value,
                label,
              })),
            ]}
          />
          <Button icon={<TeamOutlined />} onClick={handleRecalculate}>
            Sincronizar
          </Button>
        </CommissionsToolbar>

        <TableFrame>
          <Table<HrCommissionEntryRecord>
            columns={commissionEntryColumns}
            dataSource={filteredRows}
            loading={loading}
            rowKey="id"
            scroll={{ x: 1080 }}
            pagination={{
              pageSize: 12,
              showSizeChanger: false,
            }}
          />
        </TableFrame>
      </Page>
    </>
  );
}
