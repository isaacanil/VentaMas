import {
  Alert,
  Button,
  DatePicker,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  message,
} from 'antd';
import type { TableProps } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { PageShell } from '@/components/layout/PageShell';
import { ReloadOutlined, TeamOutlined } from '@/constants/icons/antd';
import {
  recalculateHrCommissionEntries,
  useHrCommissionEntries,
} from '@/firebase/hrPayroll/useHrCommissionEntries';
import { selectUser } from '@/features/auth/userSlice';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';
import type {
  HrCommissionEntryRecord,
  HrCommissionEntryStatus,
} from '@/types/hrPayroll';

const { RangePicker } = DatePicker;

const STATUS_LABELS: Record<HrCommissionEntryStatus, string> = {
  calculated: 'Calculada',
  eligible: 'Elegible',
  included_in_cut: 'En corte',
  approved: 'Aprobada',
  paid: 'Pagada',
  reversed: 'Reversada',
  cancelled: 'Cancelada',
  requires_adjustment: 'Revisar',
};

const STATUS_COLORS: Record<HrCommissionEntryStatus, string> = {
  calculated: 'blue',
  eligible: 'cyan',
  included_in_cut: 'purple',
  approved: 'green',
  paid: 'success',
  reversed: 'red',
  cancelled: 'default',
  requires_adjustment: 'orange',
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
  grid-template-columns:
    minmax(220px, 320px) minmax(260px, 380px) minmax(180px, 240px)
    max-content;
  gap: var(--ds-space-3);
  align-items: center;

  @media (max-width: 1080px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
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

const CellStack = styled.div`
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

const AmountText = styled.span`
  display: block;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
  text-align: right;
`;

const toCleanString = (value: unknown): string | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
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

const matchesSearch = (entry: HrCommissionEntryRecord, searchTerm: string) => {
  if (!searchTerm) return true;
  const haystack = [
    entry.employeeCode,
    entry.employeeNameSnapshot,
    entry.invoiceNumber,
    entry.invoiceId,
    entry.serviceName,
    entry.sourceCommissionId,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(searchTerm.toLowerCase());
};

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
    () => rows.filter((entry) => matchesSearch(entry, searchTerm)),
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

  const columns: TableProps<HrCommissionEntryRecord>['columns'] = useMemo(
    () => [
      {
        title: 'Colaborador',
        dataIndex: 'employeeNameSnapshot',
        key: 'employee',
        width: 260,
        render: (_value, entry) => (
          <CellStack>
            <PrimaryText>
              {entry.employeeNameSnapshot ||
                entry.employeeCode ||
                'Sin colaborador HR'}
            </PrimaryText>
            <MutedText>
              {entry.employeeCode || entry.employeeId || 'Pendiente de vinculo'}
            </MutedText>
          </CellStack>
        ),
      },
      {
        title: 'Factura / servicio',
        key: 'source',
        width: 280,
        render: (_value, entry) => (
          <CellStack>
            <PrimaryText>{entry.invoiceNumber || entry.invoiceId}</PrimaryText>
            <MutedText>{entry.serviceName || entry.invoiceItemId}</MutedText>
          </CellStack>
        ),
      },
      {
        title: 'Base',
        dataIndex: 'baseAmount',
        key: 'baseAmount',
        align: 'right',
        width: 140,
        render: (_value, entry) => (
          <AmountText>
            {formatMoney(entry.baseAmount, entry.currency)}
          </AmountText>
        ),
      },
      {
        title: 'Tasa',
        key: 'rate',
        width: 120,
        render: (_value, entry) => (
          <MutedText>
            {entry.rateType === 'percentage'
              ? `${entry.rateValue}%`
              : formatMoney(entry.rateValue, entry.currency)}
          </MutedText>
        ),
      },
      {
        title: 'Comision',
        dataIndex: 'commissionAmount',
        key: 'commissionAmount',
        align: 'right',
        width: 140,
        render: (_value, entry) => (
          <AmountText>
            {formatMoney(entry.commissionAmount, entry.currency)}
          </AmountText>
        ),
      },
      {
        title: 'Estado',
        dataIndex: 'status',
        key: 'status',
        width: 140,
        render: (entryStatus: HrCommissionEntryStatus, entry) => {
          const tag = (
            <Tag color={STATUS_COLORS[entryStatus]}>
              {STATUS_LABELS[entryStatus]}
            </Tag>
          );
          if (entryStatus !== 'requires_adjustment') return tag;
          return (
            <Tooltip title="Vincula el colaborador a un empleado de RRHH y recalcula.">
              {tag}
            </Tooltip>
          );
        },
      },
    ],
    [],
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

        <Toolbar>
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
          <Space>
            <Button icon={<TeamOutlined />} onClick={handleRecalculate}>
              Sincronizar
            </Button>
          </Space>
        </Toolbar>

        <TableFrame>
          <Table<HrCommissionEntryRecord>
            columns={columns}
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
