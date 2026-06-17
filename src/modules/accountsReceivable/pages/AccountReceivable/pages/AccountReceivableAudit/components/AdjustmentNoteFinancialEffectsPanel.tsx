import {
  CheckCircleOutlined,
  ReloadOutlined,
  WarningOutlined,
} from '@/constants/icons/antd';
import {
  Alert,
  Button,
  Card,
  Empty,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useMemo } from 'react';

import { formatDate, formatPrice } from '../utils/formatters';
import {
  FullWidthSpace,
  Header,
  ImpactTags,
  PanelTitle,
  SummaryText,
} from './AdjustmentNoteFinancialEffectsPanel.styles';

import type { TableColumnsType as ColumnsType } from 'antd';
import type {
  AdjustmentNoteFinancialEffectIssue,
  AdjustmentNoteFinancialEffectsIndicator,
} from '../services/accountReceivableAuditHttp';

const { Text } = Typography;

const toCount = (value: number | null | undefined) =>
  Number.isFinite(Number(value)) ? Number(value) : 0;

const getNoteTypeLabel = (noteType: string) =>
  noteType === 'debitNote'
    ? 'Nota de débito'
    : noteType === 'creditNote'
      ? 'Nota de crédito'
      : noteType || 'Nota';

const getMainAmount = (issue: AdjustmentNoteFinancialEffectIssue) => {
  if (issue.noteType === 'creditNote') {
    return issue.availableAmount ?? 0;
  }
  return issue.accountsReceivable?.balance ?? 0;
};

interface AdjustmentNoteFinancialEffectsPanelProps {
  error?: string | null;
  indicator: AdjustmentNoteFinancialEffectsIndicator | null;
  lastUpdated?: number | null;
  loading: boolean;
  onRefresh: () => void;
}

export const AdjustmentNoteFinancialEffectsPanel = ({
  error,
  indicator,
  lastUpdated,
  loading,
  onRefresh,
}: AdjustmentNoteFinancialEffectsPanelProps) => {
  const issues = indicator?.issues ?? [];
  const hasIssues = issues.length > 0;

  const columns: ColumnsType<AdjustmentNoteFinancialEffectIssue> = useMemo(
    () => [
      {
        title: 'Documento',
        key: 'document',
        render: (_: unknown, record) => (
          <Space direction="vertical" size={0}>
            <Text strong>{getNoteTypeLabel(record.noteType)}</Text>
            <Text type="secondary">{record.noteId}</Text>
          </Space>
        ),
      },
      {
        title: 'NCF',
        dataIndex: 'ncf',
        key: 'ncf',
        render: (value: string | null) => value || 'N/D',
      },
      {
        title: 'Estado fiscal',
        key: 'fiscalStatus',
        render: (_: unknown, record) => (
          <Space direction="vertical" size={0}>
            <Tag color="red">{record.fiscalStatus || 'no postable'}</Tag>
            <Text type="secondary">
              {record.status || 'Sin estado interno'}
            </Text>
          </Space>
        ),
      },
      {
        title: 'Monto activo',
        key: 'amount',
        align: 'right',
        render: (_: unknown, record) => formatPrice(getMainAmount(record)),
      },
      {
        title: 'Efectos detectados',
        key: 'effects',
        render: (_: unknown, record) => (
          <ImpactTags>
            {record.accountsReceivable ? <Tag>CxC</Tag> : null}
            {toCount(record.payments) > 0 ? (
              <Tag color="orange">Pagos {record.payments}</Tag>
            ) : null}
            {toCount(record.installmentPayments) > 0 ? (
              <Tag color="orange">
                Pagos cuotas {record.installmentPayments}
              </Tag>
            ) : null}
            {toCount(record.applications) > 0 ? (
              <Tag color="orange">Aplicaciones {record.applications}</Tag>
            ) : null}
            {record.accountingEvent ? <Tag>Evento contable</Tag> : null}
            {record.journalEntry ? <Tag color="orange">Asiento</Tag> : null}
          </ImpactTags>
        ),
      },
    ],
    [],
  );

  return (
    <Card>
      <Header>
        <SummaryText>
          <PanelTitle level={4}>Efectos financieros de E33/E34</PanelTitle>
          <Text type="secondary">
            Revisa notas electrónicas no aceptadas que aún tengan CxC, crédito,
            pagos o contabilidad activa.
          </Text>
          {lastUpdated ? (
            <Text type="secondary">
              Última ejecución: {formatDate(lastUpdated)}
            </Text>
          ) : null}
        </SummaryText>
        <Button icon={<ReloadOutlined />} loading={loading} onClick={onRefresh}>
          Reejecutar
        </Button>
      </Header>

      {error ? (
        <Alert type="error" message={error} showIcon />
      ) : hasIssues ? (
        <FullWidthSpace direction="vertical" size="middle">
          <Alert
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            message={`${issues.length} nota(s) requieren revisión financiera`}
          />
          <Table
            size="small"
            columns={columns}
            dataSource={issues}
            rowKey={(record) => `${record.noteType}-${record.noteId}`}
            loading={loading}
            pagination={false}
            scroll={{ x: true }}
          />
        </FullWidthSpace>
      ) : (
        <Alert
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
          message="Sin E33/E34 no postables con efectos financieros activos"
          description={
            indicator
              ? `Notas revisadas: ${indicator.scanned}.`
              : 'Ejecuta la auditoría para revisar notas electrónicas.'
          }
        />
      )}

      {!error && !hasIssues && loading ? (
        <Empty description="Ejecutando auditoría" />
      ) : null}
    </Card>
  );
};
