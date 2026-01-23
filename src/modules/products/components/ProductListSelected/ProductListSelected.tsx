import { Table, Input, Button } from 'antd';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';
import { formatPrice } from '@/utils/format';

import type { ColumnsType } from 'antd/es/table';

interface ProductListRow {
  id?: string;
  key?: string;
  productID?: string;
  productName?: string;
  newStock?: number;
  initialCost?: number;
  [key: string]: unknown;
}

interface ProductListSelectedProps {
  productsSelected?: ProductListRow[];
  handleDeleteProduct?: (item: ProductListRow) => void;
  handleUpdateProduct?: (payload: {
    value: Partial<ProductListRow>;
    productID?: string;
  }) => void;
}

export const ProductListSelected = ({
  productsSelected = [],
  handleDeleteProduct,
  handleUpdateProduct,
}: ProductListSelectedProps) => {
  const rows = Array.isArray(productsSelected) ? productsSelected : [];

  const columns: ColumnsType<ProductListRow> = [
    {
      title: 'Producto',
      dataIndex: 'productName',
      key: 'productName',
      width: 250,
    },
    {
      title: 'Cantidad',
      dataIndex: 'newStock',
      key: 'newStock',
      width: 150,
      render: (text: ProductListRow['newStock'], record) => (
        <Input
          type="number"
          value={text}
          onChange={(e) =>
            handleUpdateProduct?.({
              value: { newStock: Number(e.target.value) },
              productID: record.id,
            })
          }
        />
      ),
    },
    {
      title: 'Costo Inicial',
      dataIndex: 'initialCost',
      key: 'initialCost',
      width: 150,
      render: (text: ProductListRow['initialCost'], record) => (
        <Input
          type="number"
          value={text}
          onChange={(e) =>
            handleUpdateProduct?.({
              value: { initialCost: Number(e.target.value) },
              productID: record.id,
            })
          }
        />
      ),
    },
    {
      title: 'Total',
      key: 'total',
      render: (_: unknown, record) =>
        formatPrice(
          (Number(record?.initialCost) || 0) * (Number(record?.newStock) || 0),
        ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 120,
      align: 'right',
      render: (_: unknown, record) => (
        <Button
          icon={icons.operationModes.delete}
          onClick={() => handleDeleteProduct?.(record)}
        />
      ),
    },
  ];

  const total = rows.reduce(
    (acc, item) =>
      acc +
      (Number(item?.initialCost) || 0) * (Number(item?.newStock) || 0),
    0,
  );

  return (
    <Container>
      <h4>Lista de productos</h4>
      <Table
        dataSource={rows}
        bordered
        columns={columns}
        rowKey={(record) => record?.id ?? record?.key ?? record?.productID}
        size="small"
        pagination={{ pageSize: 5 }}
        footer={() => <span>Total: {formatPrice(total)}</span>}
      />
    </Container>
  );
};

const Container = styled.div`
  display: grid;
  gap: 8px;
`;

// export const ProductListSelected = ({ productsSelected, productsTotalPrice, handleDeleteProduct, handleUpdateProduct }) => {
//     return (
//         <Container>
//             <Head>
//                 <h4>Lista de productos</h4>
//                 <span>Total: {formatPrice(productsTotalPrice)}</span>
//             </Head>
//             <Body>
//                 {
//                     Array(productsSelected).length > 0 && productsSelected ?
//                         (productsSelected.map((item, index) => (
//                             <ProductCard
//                                 key={index}
//                                 item={item}
//                                 handleDeleteProduct={handleDeleteProduct}
//                                 handleUpdateProduct={handleUpdateProduct}
//                             />
//                         ))) : null
//                 }
//             </Body>
//         </Container>
//     )
// }
// const Container = styled.div`
//     border: var(--border-primary);
//     background-color: var(--white-1);
//     border-radius: 6px;
//     height: 100%;
//     position: relative;

//     display: grid;
//     grid-template-rows: min-content 1fr;
//     overflow: hidden;
//     padding-bottom: 6px;

// `
// const Head = styled.div`
//     background-color: var(--white-1);
//     color: #303030;
//     height: 2em;
//     display: grid;
//     grid-template-columns: 1fr min-content;
//     align-items: center;
//     align-content: center;
//     padding: 0 1em;
//     h3{
//         //text-align: center;
//         margin: 0;
//     }
//     span{
//         color: #131313;
//         text-align: right;
//         white-space: nowrap;
//     }
// `
// const Body = styled.div`
//    padding: 0em;

//     overflow-y: scroll;
// `
