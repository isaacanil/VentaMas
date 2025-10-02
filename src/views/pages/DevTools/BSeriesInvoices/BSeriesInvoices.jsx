import React, { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  Alert,
  Card,
  Col,
  Empty,
  Input,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';

import { MenuApp } from '../../../templates/MenuApp/MenuApp';
import { useFbGetInvoicesBySerie } from '../../../../firebase/invoices/useFbGetInvoicesBySerie';

const { Title, Paragraph, Text } = Typography;

const parseNcfParts = (ncf) => {
  if (!ncf || typeof ncf !== 'string') {
    return { serie: null, type: null, sequence: null };
  }

  const normalized = ncf.toUpperCase().trim();
  const serie = normalized.slice(0, 1) || null;
  const type = normalized.slice(1, 3) || null;
  const sequence = normalized.slice(3) || null;

  return { serie, type, sequence };
};

const toDayjs = (value) => {
  if (!value) return null;
  if (dayjs.isDayjs(value)) return value;
  if (value.seconds) {
    return dayjs.unix(value.seconds);
  }
  if (value instanceof Date) {
    return dayjs(value);
  }
  return dayjs(value);
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
  }).format(amount || 0);

const buildDataset = (invoices) =>
  invoices.map((invoice) => {
    const { data = {}, id } = invoice;
    const { serie, type, sequence } = parseNcfParts(data?.NCF || invoice?.NCF || '');
    const date = toDayjs(data?.date);
    const key = id || data?.NCF || `${serie || 'NCF'}-${sequence || 'unknown'}`;

    return {
      key,
      raw: invoice,
      ncf: data?.NCF || invoice?.NCF || '—',
      serie,
      type,
      sequence,
      client: data?.client?.name || 'Sin cliente',
      createdAt: date,
      total: Number(data?.totalPurchase?.value || 0),
      status: data?.status || 'active',
    };
  });

const columns = [
  {
    title: 'NCF',
    dataIndex: 'ncf',
    key: 'ncf',
    render: (value) => <Text code>{value}</Text>,
  },
  {
    title: 'Serie',
    dataIndex: 'serie',
    key: 'serie',
    render: (value) => <Tag color="geekblue">{value || '—'}</Tag>,
  },
  {
    title: 'Tipo',
    dataIndex: 'type',
    key: 'type',
    render: (value) => <Tag color="gold">{value || '—'}</Tag>,
  },
  {
    title: 'Secuencia',
    dataIndex: 'sequence',
    key: 'sequence',
    render: (value) => <Text>{value || '—'}</Text>,
  },
  {
    title: 'Cliente',
    dataIndex: 'client',
    key: 'client',
  },
  {
    title: 'Fecha',
    dataIndex: 'createdAt',
    key: 'createdAt',
    render: (value) => (value ? value.format('DD/MM/YYYY HH:mm') : '—'),
    sorter: (a, b) => {
      if (!a.createdAt && !b.createdAt) return 0;
      if (!a.createdAt) return -1;
      if (!b.createdAt) return 1;
      return a.createdAt.valueOf() - b.createdAt.valueOf();
    },
    defaultSortOrder: 'descend',
  },
  {
    title: 'Total',
    dataIndex: 'total',
    key: 'total',
    render: (value) => formatCurrency(value),
    sorter: (a, b) => a.total - b.total,
  },
  {
    title: 'Estado',
    dataIndex: 'status',
    key: 'status',
    render: (value) => {
      if (value === 'cancelled') {
        return <Tag color="red">Anulada</Tag>;
      }
      return <Tag color="green">Activa</Tag>;
    },
  },
];

const FILTER_ALL = 'all';

export default function BSeriesInvoices() {
  const { invoices, loading, error } = useFbGetInvoicesBySerie('B');
  const [selectedType, setSelectedType] = useState(FILTER_ALL);
  const [sequenceQuery, setSequenceQuery] = useState('');

  const dataset = useMemo(() => buildDataset(invoices), [invoices]);

  const availableTypes = useMemo(() => {
    const unique = new Set(dataset.map((item) => item.type).filter(Boolean));
    return [FILTER_ALL, ...Array.from(unique).sort()];
  }, [dataset]);

  const typeCounts = useMemo(() => {
    return dataset.reduce(
      (acc, item) => {
        const type = item.type || '—';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {}
    );
  }, [dataset]);

  const filteredDataset = useMemo(() => {
    return dataset.filter((item) => {
      if (selectedType !== FILTER_ALL && item.type !== selectedType) return false;
      if (sequenceQuery && !item.sequence?.toLowerCase().includes(sequenceQuery.toLowerCase())) return false;
      return true;
    });
  }, [dataset, selectedType, sequenceQuery]);

  const totalAmount = useMemo(
    () => filteredDataset.reduce((sum, item) => sum + item.total, 0),
    [filteredDataset]
  );

  const summaryCards = (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} md={8} lg={6}>
        <Card>
          <Statistic title="Facturas encontradas" value={filteredDataset.length} />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={6}>
        <Card>
          <Statistic title="Facturado" value={formatCurrency(totalAmount)} />
        </Card>
      </Col>
      <Col xs={24} md={8} lg={6}>
        <Card>
          <Statistic title="Tipos detectados" value={Object.keys(typeCounts).length} />
        </Card>
      </Col>
    </Row>
  );

  const filterControls = (
    <Space direction="vertical" style={{ width: '100%' }} size="small">
      <Space wrap>
        <Select
          value={selectedType}
          style={{ minWidth: 180 }}
          onChange={setSelectedType}
          options={availableTypes.map((value) => ({
            value,
            label: value === FILTER_ALL ? 'Todos los tipos' : `Tipo ${value}`,
          }))}
        />
        <Input.Search
          allowClear
          placeholder="Buscar por secuencia"
          value={sequenceQuery}
          onChange={(event) => setSequenceQuery(event.target.value)}
          style={{ minWidth: 220 }}
        />
      </Space>
      <Text type="secondary">
        La secuencia puede contener 8, 10 o más dígitos según el rango disponible.
      </Text>
    </Space>
  );

  const tableContent = (() => {
    if (loading) {
      return (
        <div style={{ padding: '3rem 0', textAlign: 'center' }}>
          <Spin size="large" />
        </div>
      );
    }

    if (!filteredDataset.length) {
      return <Empty description="No hay facturas que coincidan con los filtros" style={{ padding: '2rem 0' }} />;
    }

    return (
      <Table
        columns={columns}
        dataSource={filteredDataset}
        pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `${total} facturas` }}
        scroll={{ x: true }}
      />
    );
  })();

  return (
    <>
      <MenuApp sectionName="Serie B activa" />
      <div style={{ padding: 24 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={3} style={{ marginBottom: 8 }}>
              Comprobantes activos de Serie B
            </Title>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              Se muestran todas las facturas del negocio actual cuya secuencia corresponde a la serie <Text strong>B</Text>.
              El código NCF se descompone en serie, tipo y secuencia para facilitar el análisis.
            </Paragraph>
          </div>

          {error && (
            <Alert
              type="error"
              message="No pudimos recuperar las facturas"
              description={error.message || 'Verifica tu conexión o tus permisos e intenta nuevamente.'}
              showIcon
            />
          )}

          {summaryCards}

          <Card title="Filtros">
            {filterControls}
          </Card>

          <Card title="Detalle de facturas">
            {tableContent}
          </Card>
        </Space>
      </div>
    </>
  );
}
