import {
  Alert,
  Button,
  DatePicker,
  Popconfirm,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import type { TableProps } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { PageShell } from '@/components/layout/PageShell';
import {
  CheckCircleOutlined,
  LockOutlined,
  PlusOutlined,
} from '@/constants/icons/antd';
import {
  manageHrCommissionPeriod,
  useHrCommissionPeriods,
  useHrPayrollEmployeeLines,
} from '@/firebase/hrPayroll/useHrCommissionPeriods';
import { selectUser } from '@/features/auth/userSlice';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';
import type {
  HrCommissionPeriodRecord,
  HrCommissionPeriodStatus,
  HrPayrollEmployeeLineRecord,
} from '@/types/hrPayroll';

const { RangePicker } = DatePicker;

const STATUS_LABELS: Record<HrCommissionPeriodStatus, string> = {
  draft: 'Borrador',
  closed: 'Cerrado',
  approved: 'Aprobado',
  cancelled: 'Cancelado',
};

const STATUS_COLORS: Record<HrCommissionPeriodStatus, string> = {
  draft: 'blue',
  closed: 'gold',
  approved: 'green',
  cancelled: 'default',
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
  max-width: 720px;
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
  grid-template-columns: minmax(260px, 380px) max-content;
  gap: var(--ds-space-3);
  align-items: center;
  justify-content: start;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const SplitGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.9fr);
  gap: var(--ds-space-4);
  align-items: start;

  @media (max-width: 1120px) {
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

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'No se pudo completar la operacion.';
};

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && 'toDate' in value) {
    const date = (value as { toDate: () => unknown }).toDate();
    return date instanceof Date ? date : null;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
};

const formatDate = (value: unknown) => {
  const date = toDate(value);
  return date
    ? new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium' }).format(date)
    : '-';
};

const formatMoney = (amount: number, currency = 'DOP') =>
  new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);

export default function HrCommissionPeriodsPage() {
  const currentUser = useSelector(selectUser);
  const businessId = currentUser?.businessID ?? null;
  const [messageApi, contextHolder] = message.useMessage();
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>(() => [
    dayjs().startOf('month'),
    dayjs().endOf('day'),
  ]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const {
    rows: periods,
    loading,
    error,
  } = useHrCommissionPeriods({
    businessId,
  });
  const selectedPeriod =
    periods.find((period) => period.id === selectedPeriodId) ??
    periods[0] ??
    null;
  const {
    rows: employeeLines,
    loading: linesLoading,
    error: linesError,
  } = useHrPayrollEmployeeLines({
    businessId,
    periodId: selectedPeriod?.id,
  });

  const summary = useMemo(
    () => ({
      periods: periods.length,
      amount: periods.reduce(
        (sum, period) => sum + period.totalCommissionAmount,
        0,
      ),
      approved: periods.filter((period) => period.status === 'approved').length,
      pending: periods.filter((period) => period.status !== 'approved').length,
    }),
    [periods],
  );

  const handleAction = async (
    action: 'create' | 'close' | 'approve',
    period?: HrCommissionPeriodRecord,
  ) => {
    if (!businessId) return;
    const key =
      action === 'create' ? 'create' : `${action}:${period?.id ?? 'none'}`;
    setActionKey(key);
    try {
      const result = await manageHrCommissionPeriod({
        action,
        businessId,
        periodId: period?.id,
        startDate: dateRange[0].toDate(),
        endDate: dateRange[1].toDate(),
      });
      setSelectedPeriodId(result.periodId);
      messageApi.success(
        action === 'create'
          ? `Corte listo: ${result.entriesCount} comisiones.`
          : `Corte ${STATUS_LABELS[result.status].toLowerCase()}.`,
      );
    } catch (actionError) {
      messageApi.error(getErrorMessage(actionError));
    } finally {
      setActionKey(null);
    }
  };

  const periodColumns: TableProps<HrCommissionPeriodRecord>['columns'] =
    useMemo(
      () => [
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
                onClick={() => handleAction('close', period)}
              >
                Cerrar
              </Button>
              <Popconfirm
                title="Aprobar corte"
                description="Se marcara la corrida como aprobada y se emitira el evento contable."
                okText="Aprobar"
                cancelText="Cancelar"
                disabled={period.status !== 'closed'}
                onConfirm={() => handleAction('approve', period)}
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
      ],
      [actionKey],
    );

  const lineColumns: TableProps<HrPayrollEmployeeLineRecord>['columns'] =
    useMemo(
      () => [
        {
          title: 'Colaborador',
          key: 'employee',
          render: (_value, line) => (
            <CellStack>
              <PrimaryText>
                {line.employeeNameSnapshot ||
                  line.employeeCode ||
                  line.employeeId}
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
          title: 'Neto',
          dataIndex: 'netAmount',
          key: 'netAmount',
          align: 'right',
          width: 140,
          render: (_value, line) => (
            <AmountText>
              {formatMoney(line.netAmount, line.currency)}
            </AmountText>
          ),
        },
      ],
      [],
    );

  return (
    <>
      {contextHolder}
      <MenuApp sectionName="Cortes RRHH" />
      <Page>
        <Header>
          <TitleBlock>
            <Title>Cortes de comisiones</Title>
            <Description>
              Agrupa comisiones calculadas por colaborador y aprueba la corrida
              antes del pago.
            </Description>
          </TitleBlock>
          <Toolbar>
            <RangePicker
              value={dateRange}
              onChange={(range) => {
                if (!range?.[0] || !range?.[1]) return;
                setDateRange([range[0], range[1]]);
              }}
              style={{ width: '100%' }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              loading={actionKey === 'create'}
              onClick={() => handleAction('create')}
            >
              Crear corte
            </Button>
          </Toolbar>
        </Header>

        {!businessId ? (
          <Alert
            type="warning"
            showIcon
            message="Selecciona un negocio para gestionar cortes RRHH."
          />
        ) : null}

        {error ? (
          <Alert
            type="error"
            showIcon
            message="No se pudieron cargar los cortes RRHH."
            description={error.message}
          />
        ) : null}

        {linesError ? (
          <Alert
            type="error"
            showIcon
            message="No se pudieron cargar las lineas del corte."
            description={linesError.message}
          />
        ) : null}

        <SummaryGrid>
          <SummaryItem>
            <SummaryLabel>Cortes</SummaryLabel>
            <SummaryValue>{summary.periods}</SummaryValue>
          </SummaryItem>
          <SummaryItem>
            <SummaryLabel>Total reciente</SummaryLabel>
            <SummaryValue>{formatMoney(summary.amount)}</SummaryValue>
          </SummaryItem>
          <SummaryItem>
            <SummaryLabel>Aprobados</SummaryLabel>
            <SummaryValue>{summary.approved}</SummaryValue>
          </SummaryItem>
          <SummaryItem>
            <SummaryLabel>Pendientes</SummaryLabel>
            <SummaryValue>{summary.pending}</SummaryValue>
          </SummaryItem>
        </SummaryGrid>

        <SplitGrid>
          <TableFrame>
            <Table<HrCommissionPeriodRecord>
              columns={periodColumns}
              dataSource={periods}
              loading={loading}
              rowKey="id"
              scroll={{ x: 980 }}
              rowClassName={(period) =>
                period.id === selectedPeriod?.id ? 'ant-table-row-selected' : ''
              }
              onRow={(period) => ({
                onClick: () => setSelectedPeriodId(period.id),
              })}
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
              }}
            />
          </TableFrame>

          <TableFrame>
            <Table<HrPayrollEmployeeLineRecord>
              columns={lineColumns}
              dataSource={employeeLines}
              loading={linesLoading}
              rowKey="id"
              locale={{
                emptyText: selectedPeriod
                  ? 'Sin lineas para este corte'
                  : 'Selecciona un corte',
              }}
              pagination={{
                pageSize: 8,
                showSizeChanger: false,
              }}
            />
          </TableFrame>
        </SplitGrid>
      </Page>
    </>
  );
}
