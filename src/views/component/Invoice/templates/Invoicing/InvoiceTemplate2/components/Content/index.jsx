import { Table } from "antd";
import styled from "styled-components";
import { useFormatPrice } from "../../../../../../../../hooks/useFormatPrice";

const columns = [
    {
      title: 'CANT.',
      dataIndex: 'amountToBuy',
      key: 'quantity',
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
      render: (pricing) => pricing.price.toFixed(2),
    },
    {
      title: 'ITBIS',
      dataIndex: 'pricing',
      key: 'itbis',
      align: 'right',
      render: (pricing) => ((pricing.price * Number(pricing.tax)) / 100).toFixed(2),
    },
    {
      title: 'TOTAL',
      key: 'total',
      align: 'right',
      render: (_, record) => {
        const price = record.pricing.price;
        const tax = (price * Number(record.pricing.tax)) / 100;
        return ((price + tax) * record.amountToBuy).toFixed(2);
      },
    },
  ];

export default function Content ({data}){
    const creditNotes = data?.creditNotePayment || [];
    
    return(
        <Container>
        <TableContainer>
          <Table
            size="small"
            columns={columns}
            dataSource={data?.products || []}
            rowKey={(record) => record.id}
            pagination={false}
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
                    render: (amount) => useFormatPrice(amount),
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
    )
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
  margin-top: 16px;
  border-top: 1px solid #ddd;
  padding-top: 16px;
  
  @media print {
    margin-top: 12px;
    padding-top: 12px;
  }
`;

const SectionTitle = styled.h4`
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  color: #333;
`;

const CreditNotesTable = styled.div`
  .ant-table {
    border: 1px solid #ddd;
  }
  
  .ant-table-thead > tr > th {
    background-color: #f5f5f5;
    font-weight: 600;
  }
`;