import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import styled from 'styled-components';

import { formatNumber, formatPrice } from '@/utils/format';

import type {
  CustomerInvoiceRow,
  CustomerSummaryRow,
} from '../../analyticsSummary';

type CustomerSalesReportTableProps = {
  customers: CustomerSummaryRow[];
};

type CustomerInvoiceDetailRow = {
  key: string;
  numberID?: string | number;
  fecha: string;
  items: number;
  total: number;
  productos: string;
};

const invoiceColumns: ColumnsType<CustomerInvoiceDetailRow> = [
  { title: 'Factura', dataIndex: 'numberID', key: 'numberID', width: 120 },
  { title: 'Fecha', dataIndex: 'fecha', key: 'fecha', width: 120 },
  {
    title: 'Items',
    dataIndex: 'items',
    key: 'items',
    align: 'right',
    width: 100,
    render: (value: number) => formatNumber(value) ?? 0,
  },
  {
    title: 'Total',
    dataIndex: 'total',
    key: 'total',
    align: 'right',
    width: 140,
    render: (value: number) => formatPrice(value),
  },
  {
    title: 'Productos',
    dataIndex: 'productos',
    key: 'productos',
    render: (value: string) => <ProductsText>{value}</ProductsText>,
  },
];

const summarizeInvoiceProducts = (invoice: CustomerInvoiceRow) => {
  if (invoice.productos.length === 0) {
    return 'Sin detalle de productos';
  }

  const preview = invoice.productos
    .slice(0, 3)
    .map((product) => product.nombre)
    .filter(Boolean)
    .join(', ');

  if (invoice.productos.length <= 3) {
    return preview;
  }

  return `${preview} +${invoice.productos.length - 3} mas`;
};

const buildInvoiceDetails = (
  invoices: CustomerInvoiceRow[],
): CustomerInvoiceDetailRow[] =>
  invoices.map((invoice) => ({
    key: invoice.key,
    numberID: invoice.numberID,
    fecha: invoice.fecha,
    items: invoice.items,
    total: invoice.total,
    productos: summarizeInvoiceProducts(invoice),
  }));

export const CustomerSalesReportTable = ({
  customers,
}: CustomerSalesReportTableProps) => {
  const [pageSize, setPageSize] = useState(12);
  const [currentPage, setCurrentPage] = useState(1);

  const columns: ColumnsType<CustomerSummaryRow> = [
    {
      title: 'Cliente',
      dataIndex: 'cliente',
      key: 'cliente',
      render: (value: string, record) => (
        <CustomerCell>
          <strong>{value}</strong>
          <span>
            {record.isGeneric ? 'Cliente generico' : 'Cliente identificado'}
          </span>
        </CustomerCell>
      ),
    },
    {
      title: 'Facturas',
      dataIndex: 'invoiceCount',
      key: 'invoiceCount',
      align: 'right',
      render: (value: number) => formatNumber(value) ?? 0,
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      align: 'right',
      render: (value: number) => formatNumber(value) ?? 0,
    },
    {
      title: 'Ticket promedio',
      dataIndex: 'averageTicket',
      key: 'averageTicket',
      align: 'right',
      render: (value: number) => formatPrice(value),
    },
    {
      title: 'Ultima compra',
      dataIndex: 'lastPurchaseDate',
      key: 'lastPurchaseDate',
      width: 140,
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      align: 'right',
      render: (value: number) => formatPrice(value),
    },
  ];

  const handleTableChange = (page: number, nextPageSize: number) => {
    setCurrentPage(page);
    setPageSize(nextPageSize);
  };

  return (
    <Section>
      <Header>
        <Title>Detalle por cliente</Title>
        <Subtitle>
          Usa esta tabla para validar quien compra mas, con que frecuencia y
          que facturas explican ese total.
        </Subtitle>
      </Header>

      <TableWrapper>
        <Table
          columns={columns}
          dataSource={customers}
          rowKey="key"
          size="small"
          scroll={{ x: 880 }}
          pagination={{
            current: currentPage,
            pageSize,
            showSizeChanger: true,
            pageSizeOptions: ['12', '24', '48'],
            onChange: handleTableChange,
          }}
          expandable={{
            expandedRowRender: (record) => (
              <NestedTable>
                <Table
                  columns={invoiceColumns}
                  dataSource={buildInvoiceDetails(record.facturas)}
                  pagination={false}
                  rowKey="key"
                  size="small"
                  scroll={{ x: 720 }}
                />
              </NestedTable>
            ),
          }}
          summary={(pageData) => {
            const visibleInvoices = pageData.reduce(
              (acc, customer) => acc + customer.invoiceCount,
              0,
            );
            const visibleItems = pageData.reduce(
              (acc, customer) => acc + customer.items,
              0,
            );
            const visibleTotal = pageData.reduce(
              (acc, customer) => acc + customer.total,
              0,
            );

            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>
                  <SummaryLabel>Total visible</SummaryLabel>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <SummaryValue>
                    {formatNumber(visibleInvoices) ?? 0}
                  </SummaryValue>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  <SummaryValue>{formatNumber(visibleItems) ?? 0}</SummaryValue>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  <SummaryValue>
                    {pageData.length > 0
                      ? formatPrice(visibleTotal / pageData.length)
                      : formatPrice(0)}
                  </SummaryValue>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4}></Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right">
                  <SummaryValue>{formatPrice(visibleTotal)}</SummaryValue>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            );
          }}
        />
      </TableWrapper>
    </Section>
  );
};

const Section = styled.section`
  display: grid;
  gap: 1rem;
  padding: 1.1rem 1.15rem;
  background: var(--white);
  border: 1px solid rgb(15 23 42 / 12%);
  border-radius: 10px;
`;

const Header = styled.header`
  display: grid;
  gap: 0.2rem;
`;

const Title = styled.h3`
  margin: 0;
  color: var(--black-3);
  font-size: 1rem;
  font-weight: 600;
`;

const Subtitle = styled.p`
  margin: 0;
  color: var(--gray-6);
  font-size: 0.82rem;
  line-height: 1.45;
`;

const TableWrapper = styled.div`
  .ant-table {
    font-size: 0.86rem;
  }

  .ant-table-thead > tr > th {
    color: var(--gray-7);
    font-size: 0.75rem;
    font-weight: 600;
    background: var(--white-2);
  }

  .ant-table-tbody > tr > td {
    vertical-align: top;
  }

  .ant-pagination {
    margin-bottom: 0;
  }
`;

const CustomerCell = styled.div`
  display: grid;
  gap: 0.2rem;

  strong {
    color: var(--black-3);
    font-size: 0.88rem;
    font-weight: 600;
  }

  span {
    color: var(--gray-6);
    font-size: 0.76rem;
  }
`;

const NestedTable = styled.div`
  .ant-table {
    margin: -0.2rem 0;
  }
`;

const ProductsText = styled.span`
  color: var(--gray-7);
  font-size: 0.8rem;
  line-height: 1.45;
`;

const SummaryLabel = styled.span`
  color: var(--black-3);
  font-size: 0.82rem;
  font-weight: 600;
`;

const SummaryValue = styled.span`
  color: var(--black-3);
  font-size: 0.82rem;
  font-weight: 600;
`;
