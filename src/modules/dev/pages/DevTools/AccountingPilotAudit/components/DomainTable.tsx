import { Alert, Card, Empty, Skeleton, Statistic, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React from 'react';

import type { AuditRow, DomainAuditResult } from '../types';

const { Text } = Typography;

interface Props {
  result: DomainAuditResult;
  title: string;
}

const DOMAIN_LABELS: Record<string, string> = {
  invoices: 'Facturas',
  accountsReceivablePayments: 'Pagos CxC',
  purchases: 'Compras',
  expenses: 'Gastos',
};

const formatDate = (millis: number | null): string => {
  if (millis === null) return '—';
  return new Date(millis).toLocaleString('es-DO', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
};

const columns: ColumnsType<AuditRow> = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 180,
    ellipsis: true,
    render: (id: string) => <Text code copyable style={{ fontSize: 11 }}>{id}</Text>,
  },
  {
    title: 'Fecha',
    dataIndex: 'date',
    key: 'date',
    width: 140,
    render: (date: number | null) => <Text style={{ fontSize: 12 }}>{formatDate(date)}</Text>,
  },
  {
    title: 'Monto',
    dataIndex: 'amount',
    key: 'amount',
    width: 100,
    align: 'right',
    render: (amount: number | null) =>
      amount !== null ? (
        <Text style={{ fontSize: 12 }}>{amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</Text>
      ) : (
        <Text type="secondary">—</Text>
      ),
  },
  {
    title: 'hasMonetary',
    dataIndex: 'hasMonetary',
    key: 'hasMonetary',
    width: 110,
    align: 'center',
    render: (has: boolean) =>
      has ? (
        <Tag color="success">yes</Tag>
      ) : (
        <Tag color="error">no</Tag>
      ),
  },
  {
    title: 'docCurrency',
    key: 'documentCurrency',
    width: 100,
    render: (_: unknown, row: AuditRow) => (
      <Text style={{ fontSize: 12 }}>{row.monetary?.documentCurrency ?? '—'}</Text>
    ),
  },
  {
    title: 'funcCurrency',
    key: 'functionalCurrency',
    width: 100,
    render: (_: unknown, row: AuditRow) => (
      <Text style={{ fontSize: 12 }}>{row.monetary?.functionalCurrency ?? '—'}</Text>
    ),
  },
  {
    title: 'rate',
    key: 'rate',
    width: 80,
    align: 'right',
    render: (_: unknown, row: AuditRow) => (
      <Text style={{ fontSize: 12 }}>{row.monetary?.rate ?? '—'}</Text>
    ),
  },
  {
    title: 'capturedAt',
    key: 'capturedAt',
    width: 140,
    render: (_: unknown, row: AuditRow) => (
      <Text style={{ fontSize: 12 }}>{formatDate(row.monetary?.capturedAt ?? null)}</Text>
    ),
  },
  {
    title: 'Snapshot',
    key: 'snippet',
    ellipsis: true,
    render: (_: unknown, row: AuditRow) => (
      <Text type="secondary" style={{ fontSize: 11 }}>{row.monetary?.snippet ?? '—'}</Text>
    ),
  },
];

const CoverageSummary: React.FC<{ rows: AuditRow[] }> = ({ rows }) => {
  const total = rows.length;
  const withMonetary = rows.filter((r) => r.hasMonetary).length;
  const withoutMonetary = total - withMonetary;
  const coverage = total > 0 ? Math.round((withMonetary / total) * 100) : 0;

  return (
    <div style={{ display: 'flex', gap: 24, marginBottom: 12 }}>
      <Statistic title="Consultados" value={total} />
      <Statistic title="Con monetary" value={withMonetary} valueStyle={{ color: '#3f8600' }} />
      <Statistic title="Sin monetary" value={withoutMonetary} valueStyle={{ color: withoutMonetary > 0 ? '#cf1322' : undefined }} />
      <Statistic title="Cobertura" value={coverage} suffix="%" valueStyle={{ color: coverage === 100 ? '#3f8600' : coverage > 0 ? '#d48806' : '#cf1322' }} />
    </div>
  );
};

export const DomainTable: React.FC<Props> = ({ result, title }) => {
  const label = DOMAIN_LABELS[result.domain] ?? title;

  return (
    <Card
      title={<Text strong>{label}</Text>}
      size="small"
      style={{ marginBottom: 16 }}
    >
      {result.loading && <Skeleton active paragraph={{ rows: 3 }} />}

      {!result.loading && result.error && (
        <Alert
          type="error"
          message="Error al cargar colección"
          description={result.error}
          showIcon
          style={{ marginBottom: 8 }}
        />
      )}

      {!result.loading && !result.error && result.rows.length === 0 && (
        <Empty description="Sin resultados" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}

      {!result.loading && !result.error && result.rows.length > 0 && (
        <>
          <CoverageSummary rows={result.rows} />
          <Table<AuditRow>
            dataSource={result.rows}
            columns={columns}
            rowKey="id"
            size="small"
            pagination={false}
            scroll={{ x: 1000 }}
            rowClassName={(row) => (row.hasMonetary ? '' : 'ant-table-row-danger')}
          />
        </>
      )}
    </Card>
  );
};
