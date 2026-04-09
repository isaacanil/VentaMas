import { DownloadOutlined } from '@/constants/icons/antd';
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
import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { selectBusinessData } from '@/features/auth/businessSlice';
import { selectUser } from '@/features/auth/userSlice';
import { PageShell } from '@/components/layout/PageShell';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';
import { hasDeveloperAccess } from '@/utils/access/developerAccess';

import { FinancialSummary } from './components/FinancialSummary';
import { InvoiceTable } from './components/InvoiceTable';
import { DEFAULT_SAMPLE_LIMIT, MAX_SAMPLE_LIMIT } from './constants';
import { useReceivableInvoices } from './hooks/useReceivableInvoices';
import {
  buildAccountReceivableAuditExportRows,
  exportAccountReceivableAuditRows,
} from './utils/exportAccountReceivableAudit';
import { formatDate, formatPrice } from './utils/formatters';

import type { TablePaginationConfig } from 'antd/es/table';
import type { UserIdentity } from '@/types/users';

const { Title, Text } = Typography;

type User = UserIdentity;

interface Business {
  id?: string;
  businessId?: string;
  businessID?: string;
}

const PageWrapper = styled(PageShell)`
  display: grid;
  grid-template-rows: min-content 1fr;
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
  const isDeveloperUser = hasDeveloperAccess(user);
  const [form] = Form.useForm();
  const [receivableFilter, setReceivableFilter] = useState<
    'all' | 'with' | 'missing'
  >('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [exporting, setExporting] = useState(false);
  const [tablePagination, setTablePagination] = useState<TablePaginationConfig>(
    {
      current: 1,
      pageSize: 20,
      showSizeChanger: false,
    },
  );
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
      sum + (Number.isFinite(invoice.totalAmount) ? invoice.totalAmount : 0),
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
      setTablePagination((prev) => ({
        ...prev,
        current: 1,
      }));
      void fetchInvoices(values?.sampleLimit);
    },
    [fetchInvoices],
  );

  const handlePaginationChange = useCallback(
    (paginationConfig: TablePaginationConfig) => {
      setTablePagination(paginationConfig);
    },
    [],
  );

  const navigate = useNavigate();

  const handleExportToExcel = useCallback(() => {
    if (!filteredInvoices.length) {
      message.warning('No hay registros para exportar.');
      return;
    }

    const rows = buildAccountReceivableAuditExportRows({
      invoices: filteredInvoices,
      isDeveloperUser,
      receivablesByInvoice,
    });

    setExporting(true);

    void exportAccountReceivableAuditRows(rows)
      .then(() => {
        message.success('Exportación generada');
      })
      .catch((err) => {
        console.error('[AccountReceivableAudit] excel export failed', err);
        message.error('No se pudo exportar a Excel.');
      })
      .then(() => {
        setExporting(false);
      });
  }, [filteredInvoices, isDeveloperUser, receivablesByInvoice]);

  const handleReceivableFilterChange = useCallback(
    (value: 'all' | 'with' | 'missing') => {
      setReceivableFilter(value);
      setTablePagination((prev) => ({
        ...prev,
        current: 1,
      }));
    },
    [],
  );

  const handleSearchTermChange = useCallback((value: string) => {
    setSearchTerm(value);
    setTablePagination((prev) => ({
      ...prev,
      current: 1,
    }));
  }, []);

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
                handleReceivableFilterChange(value as 'all' | 'with' | 'missing')
              }
            />
            <Input.Search
              allowClear
              placeholder="Buscar por factura, número o cliente"
              value={searchTerm}
              onSearch={handleSearchTermChange}
              onChange={(event) => handleSearchTermChange(event.target.value)}
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
          <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
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
