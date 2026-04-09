import { Table } from 'antd';
import styled from 'styled-components';
import type { ColumnsType } from 'antd/es/table';
import type { QuotationData } from '@/pdf/invoicesAndQuotation/types';
import type { InvoiceProduct } from '@/types/invoice';
import {
  resolveInvoiceProductQuantity,
  resolveInvoiceProductTaxRate,
  resolveInvoiceProductUnitPrice,
} from '@/utils/invoice/product';

const columns: ColumnsType<InvoiceProduct> = [
  {
    title: 'CANT.',
    dataIndex: 'amountToBuy',
    key: 'quantity',
    render: (_value, record) => resolveInvoiceProductQuantity(record),
  },
  {
    title: 'CODIGO',
    dataIndex: 'barcode',
    key: 'code',
  },
  {
    title: 'DESCRIPCION',
    dataIndex: 'name',
    key: 'description',
  },
  {
    title: 'PRECIO',
    dataIndex: 'pricing',
    key: 'price',
    align: 'right',
    render: (_value, record) =>
      resolveInvoiceProductUnitPrice(record).toFixed(2),
  },
  {
    title: 'ITBIS',
    dataIndex: 'pricing',
    key: 'itbis',
    align: 'right',
    render: (_value, record) => {
      const price = resolveInvoiceProductUnitPrice(record);
      const taxRate = resolveInvoiceProductTaxRate(record);
      return ((price * taxRate) / 100).toFixed(2);
    },
  },
  {
    title: 'TOTAL',
    key: 'total',
    align: 'right',
    render: (_value, record) => {
      const price = resolveInvoiceProductUnitPrice(record);
      const taxRate = resolveInvoiceProductTaxRate(record);
      const quantity = resolveInvoiceProductQuantity(record);
      const tax = (price * taxRate) / 100;
      return ((price + tax) * quantity).toFixed(2);
    },
  },
];

interface ContentProps {
  data?: QuotationData | null;
}

export default function Content({ data }: ContentProps) {
  return (
    <Container>
      <TableContainer>
        <Table
          size="small"
          columns={columns}
          dataSource={data?.products || []}
          rowKey={(record) =>
            record?.cid ||
            record?.id ||
            record?.productId ||
            record?.barcode ||
            record?.name ||
            ''
          }
          pagination={false}
          // bordered
        />
      </TableContainer>
    </Container>
  );
}
const TableContainer = styled.div`
  margin-top: 16px;

  @media print {
    margin-top: 0;
  }
`;
const Container = styled.div`
  width: 100%;
  padding: 0 2em;
  border: 1px solid #e0e0e0;

  /* border: 1px solid green; */
`;
