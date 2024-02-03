import React from 'react'
import styled from 'styled-components'
import { ProductCard } from './ProductCard'
import { SelectProducts, SelectTotalPurchase } from '../../../features/addOrder/addOrderModalSlice'
import { useSelector } from 'react-redux'
import { separator } from '../../../hooks/separator'
import { useFormatPrice } from '../../../hooks/useFormatPrice'

import * as antd from 'antd';
const { Table, Input, Button } = antd;
import { IoMdTrash } from 'react-icons/io';
import { icons } from '../../../constants/icons/icons'

export const ProductListSelected = ({
  productsSelected,
  handleDeleteProduct,
  handleUpdateProduct,
}) => {
  const columns = [
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
      render: (text, record) => (
        <Input
        type='number'
          value={text}
          onChange={e =>
            handleUpdateProduct({
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
      width: 150,
      key: 'initialCost',
      render: (text, record) => (
        <Input
            type='number'
          value={text}
          onChange={e =>
            handleUpdateProduct({
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
      render: (_, record) => useFormatPrice(record.initialCost * record.newStock),
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 120,
      align: 'right',
      render: (_, record) => (
        <Button     
          icon={icons.operationModes.delete}
          onClick={() => handleDeleteProduct(record)}
        />
      ),
    },
  ];

  return (
    <Container>
      <h4>Lista de productos</h4>
      <Table 
      dataSource={productsSelected} 
      bordered
    
      columns={columns} 
      size='small'
      pagination={{ pageSize: 5 }} 
      footer={
        () => (
          <span>Total: {useFormatPrice(productsSelected.reduce((acc, item) => acc + item.initialCost * item.newStock, 0))}</span>
        )
      }
      />
    </Container>
  );
};
const Container = styled.div`
   display: grid;
    
`


















// export const ProductListSelected = ({ productsSelected, productsTotalPrice, handleDeleteProduct, handleUpdateProduct }) => {
//     return (
//         <Container>
//             <Head>
//                 <h4>Lista de productos</h4>
//                 <span>Total: {useFormatPrice(productsTotalPrice)}</span>
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
//     background-color: var(--White1);
//     border-radius: 6px;
//     height: 100%;
//     position: relative;
    
//     display: grid;
//     grid-template-rows: min-content 1fr;
//     overflow: hidden;
//     padding-bottom: 6px;

// `
// const Head = styled.div`
//     background-color: var(--White1);
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