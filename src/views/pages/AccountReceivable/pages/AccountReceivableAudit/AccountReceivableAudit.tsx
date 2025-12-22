import { DownloadOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Segmented,
  Space,
  Typography,
  message,
} from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { selectBusinessData } from '../../../../../features/auth/businessSlice';
import { selectUser } from '../../../../../features/auth/userSlice';
import {
  addReportHeader,
  applyProfessionalStyling,
  formatCurrencyColumns,
} from '../../../../../hooks/exportToExcel/exportConfig';
import exportToExcel from '../../../../../hooks/exportToExcel/useExportToExcel';
import { MenuApp } from '../../../../templates/MenuApp/MenuApp';

import { FinancialSummary } from './components/FinancialSummary';
import { InvoiceTable } from './components/InvoiceTable';
import { DEFAULT_SAMPLE_LIMIT, MAX_SAMPLE_LIMIT } from './constants';
import { useReceivableInvoices } from './hooks/useReceivableInvoices';
import { formatDate, formatPrice } from './utils/formatters';

import type { TablePaginationConfig } from 'antd/es/table';

const { Title, Text } = Typography;

interface User {
  businessID?: string;
  role?: string;
}

interface Business {
  id?: string;
  businessId?: string;
  businessID?: string;
}

const PageWrapper = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr;
  height: 100%;
  min-height: 100vh;
  width: 100%;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  min-height: 0;
  width: 100%;
  overflow-y: auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
`;

const FiltersRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

export const AccountReceivableAudit = () => {
  const sectionName = 'Auditoría CxC';
  const business = useSelector(selectBusinessData) as Business;
  const user = useSelector(selectUser) as User;
  const isDeveloperUser = user?.role === 'dev';
  const [form] = Form.useForm();
  const [receivableFilter, setReceivableFilter] = useState<
    'all' | 'with' | 'missing'
  >('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [exporting, setExporting] = useState(false);
  const [tablePagination, setTablePagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 20,
    showSizeChanger: false,
  });
  const businessId =
    business?.id ||
    business?.businessId ||
    business?.businessID ||
    user?.businessID ||
    null;

  const {
    receivableInvoices,
    missingReceivableInvoices,
    receivablesByInvoice,
    loading,
    error,
    lastUpdated,
    fetchInvoices,
  } = useReceivableInvoices(businessId, {
    defaultLimit: DEFAULT_SAMPLE_LIMIT,
  });

  const totalInvoices = receivableInvoices.length;
  const filteredInvoices = (() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return receivableInvoices.filter((invoice) => {
      const matchesSearch =
        !normalizedSearch ||
        invoice.invoiceId.toLowerCase().includes(normalizedSearch) ||
        (invoice.number &&
          String(invoice.number).toLowerCase().includes(normalizedSearch)) ||
        invoice.clientName.toLowerCase().includes(normalizedSearch);

      const hasReceivable = !!receivablesByInvoice[invoice.invoiceId];
      const matchesFilter =
        receivableFilter === 'all' ||
        (receivableFilter === 'with' && hasReceivable) ||
        (receivableFilter === 'missing' && !hasReceivable);

      return matchesSearch && matchesFilter;
    });
  })();

  const totalAmount = filteredInvoices.reduce(
    (sum, invoice) =>
      sum +
      (Number.isFinite(invoice.totalAmount) ? invoice.totalAmount : 0),
    0,
  );
  const invoicesWithReceivableCount =
    totalInvoices - missingReceivableInvoices.length;

  // React Compiler automatically handles memoization for this object
  const financialSummaryData = {
    totalInvoices: totalInvoices,
    withCxC: invoicesWithReceivableCount,
    withoutCxC: missingReceivableInvoices.length,
    coveragePercent:
      totalInvoices > 0
        ? Number(
          ((invoicesWithReceivableCount / totalInvoices) * 100).toFixed(1),
        )
        : 0,
    totalAmount: formatPrice(totalAmount),
    lastUpdate: lastUpdated ? formatDate(lastUpdated) : 'N/D',
  };

  const handleSubmit = useCallback(
    (values: { sampleLimit?: number }) => {
      void fetchInvoices(values?.sampleLimit);
    },
    [fetchInvoices],
  );

  useEffect(() => {
    setTablePagination((prev) => ({
      ...prev,
      current: 1,
    }));
  }, [receivableFilter, searchTerm, receivableInvoices]);

  const handlePaginationChange = useCallback(
    (paginationConfig: TablePaginationConfig) => {
      setTablePagination(paginationConfig);
    },
    [],
  );

  const navigate = useNavigate();

  const handleExportToExcel = useCallback(async () => {
    if (!filteredInvoices.length) {
      message.warning('No hay registros para exportar.');
      return;
    }

    const rows = filteredInvoices.map((invoice) => {
      const baseRow = {
        Número: invoice.number ?? 'N/D',
        Cliente: invoice.clientName,
        NCF: invoice.ncf ?? 'N/D',
        'Monto total': Number(invoice.totalAmount || 0),
        Fecha: invoice.createdAt ? formatDate(invoice.createdAt) : 'N/D',
        Estado: invoice.status || 'N/D',
        'Tiene CxC': receivablesByInvoice[invoice.invoiceId] ? 'Sí' : 'No',
      };
      return isDeveloperUser
        ? { 'ID Factura': invoice.invoiceId, ...baseRow }
        : baseRow;
    });

    try {
      setExporting(true);
      const timestamp = new Date()
        .toISOString()
        .replace(/[-:T]/g, '')
        .split('.')[0];
      await exportToExcel(
        rows,
        'Facturas CxC',
        `auditoria-cxc-${timestamp}.xlsx`,
        (worksheet, dataSet: unknown[], columns) => {
          applyProfessionalStyling(worksheet, Array.isArray(dataSet) ? dataSet.length : 0);
          formatCurrencyColumns(worksheet, columns, ['Monto total']);
          addReportHeader(worksheet, 'Auditoría de Cuentas por Cobrar');
        },
      );
      message.success('Exportación generada');
    } catch (err) {
      console.error('[AccountReceivableAudit] excel export failed', err);
      message.error('No se pudo exportar a Excel.');
    } finally {
      setExporting(false);
    }
  }, [filteredInvoices, isDeveloperUser, receivablesByInvoice]);

  const handleRecoverInvoice = useCallback(
    (invoiceId: string) => {
      if (!invoiceId) return;
      void navigate(
        `/dev/tools/invoice-v2-recovery?invoiceId=${encodeURIComponent(invoiceId)}&businessId=${encodeURIComponent(businessId || '')}`,
      );
    },
    [businessId, navigate],
  );

  const handleRecoverInvoiceInNewTab = useCallback(
    (invoiceId: string) => {
      if (!invoiceId) return;
      const url = `/dev/tools/invoice-v2-recovery?invoiceId=${encodeURIComponent(invoiceId)}&businessId=${encodeURIComponent(businessId || '')}`;
      const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
      // Try to keep focus on the current window (best effort, browser dependent)
      if (newWindow) {
        void window.focus();
      }
    },
    [businessId],
  );

  if (!businessId) {
    return (
      <PageWrapper>
        <MenuApp sectionName={sectionName} />
        <Container>
          <Alert
            type="info"
            message="No encontramos un negocio activo asociado a tu sesión. Verifica tu configuración e inténtalo otra vez."
          />
        </Container>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <MenuApp sectionName={sectionName} />
      <Container>
        <Header>
          <div>
            <Title level={3}>Auditoría de Cuentas por Cobrar</Title>
            <Text type="secondary">
              Analiza facturas, cuentas y pagos en busca de inconsistencias.
            </Text>
            {lastUpdated && (
              <Text type="secondary" style={{ display: 'block' }}>
                Última ejecución: {formatDate(lastUpdated)}
              </Text>
            )}
          </div>
          <Form
            layout="inline"
            form={form}
            initialValues={{ sampleLimit: DEFAULT_SAMPLE_LIMIT }}
            onFinish={handleSubmit}
            style={{ gap: '0.8rem', flexWrap: 'wrap' }}
          >
            <Form.Item
              label="Muestras por indicador"
              name="sampleLimit"
              rules={[{ required: true, message: 'Ingresa el límite' }]}
            >
              <InputNumber min={5} max={MAX_SAMPLE_LIMIT} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                Actualizar
              </Button>
            </Form.Item>
          </Form>
        </Header>

        {error && <Alert type="error" message={error} />}

        <FinancialSummary data={financialSummaryData} />


        <FiltersRow>
          <FilterGroup>
            <Segmented
              options={[
                { label: 'Todas', value: 'all' },
                { label: 'Con CxC', value: 'with' },
                { label: 'Sin CxC', value: 'missing' },
              ]}
              value={receivableFilter}
              onChange={(value) =>
                setReceivableFilter(value as 'all' | 'with' | 'missing')
              }
            />
            <Input.Search
              allowClear
              placeholder="Buscar por factura, número o cliente"
              value={searchTerm}
              onSearch={(value) => setSearchTerm(value)}
              onChange={(event) => setSearchTerm(event.target.value)}
              style={{ minWidth: 260 }}
            />
          </FilterGroup>
          <Button
            icon={<DownloadOutlined />}
            onClick={() => {
              void handleExportToExcel();
            }}
            disabled={!filteredInvoices.length}
            loading={exporting}
          >
            Exportar Excel
          </Button>
        </FiltersRow>

        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Title level={4}>Facturas y cuentas por cobrar</Title>
            <InvoiceTable
              invoices={filteredInvoices}
              receivablesMap={receivablesByInvoice}
              loading={loading}
              pagination={tablePagination}
              totalItems={filteredInvoices.length}
              onChangePagination={handlePaginationChange}
              showRecoveryAction={isDeveloperUser}
              onRecoverInvoice={handleRecoverInvoice}
              onRecoverInvoiceInNewTab={handleRecoverInvoiceInNewTab}
            />
          </Space>
        </Card>
      </Container>
    </PageWrapper>
  );
};

export default AccountReceivableAudit;
