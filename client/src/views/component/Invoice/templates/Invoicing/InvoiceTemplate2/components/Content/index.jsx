import { Table } from "antd";
import styled from "styled-components";

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
    return(
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