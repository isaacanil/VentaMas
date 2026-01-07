// @ts-nocheck
import { Table } from 'antd';
import styled from 'styled-components';

import { PRODUCT_BRAND_DEFAULT } from '@/features/updateProduct/updateProductSlice';
import { formatPrice } from '@/utils/format';



export default function Content({ data }) {
  const creditNotes = data?.creditNotePayment || [];
  const columns = [
    {
      title: 'CANT.',
      dataIndex: 'amountToBuy',
      key: 'quantity',
      render: (value, record) => {
        const quantity = Number(value || 0);
        if (quantity > 0) return quantity;
        const weight = Number(record?.weightDetail?.weight || 0);
        return weight > 0 ? weight : 0;
      },
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
      render: (value, record) => {
        const name = value || 'Producto sin nombre';
        const rawBrand =
          typeof record?.brand === 'string' ? record.brand.trim() : '';
        const hasBrand =
          rawBrand &&
          rawBrand.toLowerCase() !== PRODUCT_BRAND_DEFAULT.toLowerCase();

        return (
          <div>
            <div>{name}</div>
            {hasBrand && (
              <div style={{ fontSize: '11px', color: '#555' }}>
                Marca: {rawBrand}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'PRECIO',
      dataIndex: 'pricing',
      key: 'price',
      align: 'right',
      render: (pricing) => {
        const price = Number(pricing?.price || 0);
        return price.toFixed(2);
      },
    },
    {
      title: 'ITBIS',
      dataIndex: 'pricing',
      key: 'itbis',
      align: 'right',
      render: (pricing) => {
        const price = Number(pricing?.price || 0);
        const taxRate = Number(pricing?.tax || 0);
        return ((price * taxRate) / 100).toFixed(2);
      },
    },
    {
      title: 'TOTAL',
      key: 'total',
      align: 'right',
      render: (_, record) => {
        const price = Number(record?.pricing?.price || 0);
        const taxRate = Number(record?.pricing?.tax || 0);
        const quantity = Number(record?.amountToBuy || 0);
        const tax = (price * taxRate) / 100;
        return ((price + tax) * quantity).toFixed(2);
      },
    },
  ];

  return (
    <Container>
      <TableContainer>
        <Table
          size="small"
          columns={columns}
          dataSource={data?.products || []}
          pagination={false}
          // bordered
        />
      </TableContainer>
      {creditNotes.length > 0 && (
        <CreditNotesSection>
          <SectionTitle>Notas de Crédito Aplicadas</SectionTitle>
          <CreditNotesTable>
            <Table
              size="small"
              columns={[
                {
                  title: 'NCF',
                  dataIndex: 'ncf',
                  key: 'ncf',
                },
                {
                  title: 'Monto Aplicado',
                  dataIndex: 'amountUsed',
                  key: 'amountUsed',
                  align: 'right',
                  render: (amount) => formatPrice(amount),
                },
              ]}
              dataSource={creditNotes}
              rowKey={(record) => record.id}
              pagination={false}
              showHeader={true}
            />
          </CreditNotesTable>
        </CreditNotesSection>
      )}
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
  padding: 0 2em;

  /* border: 1px solid green; */
`;

const CreditNotesSection = styled.div`
  padding-top: 16px;
  margin-top: 16px;
  border-top: 1px solid #ddd;

  @media print {
    padding-top: 12px;
    margin-top: 12px;
  }
`;

const SectionTitle = styled.h4`
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  text-align: center;
`;

const CreditNotesTable = styled.div`
  .ant-table {
    border: 1px solid #ddd;
  }

  .ant-table-thead > tr > th {
    font-weight: 600;
    background-color: #f5f5f5;
  }
`;
