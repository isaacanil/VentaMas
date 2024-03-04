import React, { useState, useEffect, useCallback } from 'react'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { ProductItem } from './ProductCard/ProductItem'
import { ProductCardRow } from './ProductCard/ProductCardRow'
import { Carrusel } from '../../../../../../component/Carrusel/Carrusel'
import { FormattedValue } from '../../../../../../templates/system/FormattedValue/FormattedValue'
import { CenteredText } from '../../../../../../templates/system/CentredText'
import { icons } from '../../../../../../../constants/icons/icons'
import { openModalUpdateProd } from '../../../../../../../features/modals/modalSlice'
import { ChangeProductData, selectUpdateProductData } from '../../../../../../../features/updateProduct/updateProductSlice'
import { OPERATION_MODES } from '../../../../../../../constants/modes'
import { handleDeleteProductAlert } from '../../../../../../../features/Alert/AlertSlice'
import { ButtonGroup } from '../../../../../../templates/system/Button/Button'
import StockIndicator from '../../../../../../templates/system/labels/StockIndicator'
import { useFormatPrice } from '../../../../../../../hooks/useFormatPrice'
import { ImgCell } from '../../../../../../templates/system/AdvancedTable/components/Cells/Img/ImgCell'
import { AdvancedTable } from '../../../../../../templates/system/AdvancedTable/AdvancedTable'
import { useDialog } from '../../../../../../../Context/Dialog/DialogContext'
import { fbDeleteProduct } from '../../../../../../../firebase/products/fbDeleteproduct'
import { selectUser } from '../../../../../../../features/auth/userSlice'
import { getTax, getTotalPrice } from '../../../../../../../utils/pricing'
import * as antd from 'antd'
const { Button } = antd;

export const ProductsTable = ({ products, searchTerm }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const { setDialogConfirm } = useDialog();

  const handleDeleteProduct = useCallback((user, id) => {
    let docId = id.product.id ? id.product.id : id.id
    setDialogConfirm({
      title: 'Eliminar producto',
      isOpen: true,
      type: 'error',
      message: '¿Está seguro que desea eliminar este producto?',
      onConfirm: () => fbDeleteProduct(user, docId),
    })
  }, [user])

  const handleUpdateProduct = (product) => {
    dispatch(openModalUpdateProd());
    dispatch(ChangeProductData({ product: product, status: OPERATION_MODES.UPDATE.label }));
  };

  const columns = [
    {
      Header: 'Nombre',
      accessor: 'name',
      reorderable: false,
      minWidth: '300px',
      maxWidth: '1fr',
      sortable: true,
      sortableValue: (value) => value.name,
      cell: ({ value }) => (
        <ProductName>
          <ImgCell img={value.img} />
          <span>{value.name}</span>
        </ProductName>
      )
    },
    {
      Header: 'Stock',
      accessor: 'stock',
      align: 'right',
      sortable: true,
      sortableValue: (value) => value.stock,
      minWidth: '80px',
      maxWidth: '80px',
      cell: ({ value }) => <StockIndicator stock={value.stock} trackInventory={value.trackInventory}></StockIndicator>
    },
    {
      Header: 'Costo',
      align: 'right',
      sortable: true,
      accessor: 'cost',
      minWidth: '120px',
      maxWidth: '0.4fr',
      cell: ({ value }) => <div>{useFormatPrice(value)}</div>
    },
    {
      Header: 'Impuesto',
      sortable: true,
      align: 'right',
      minWidth: '120px',
      maxWidth: '0.4fr',
      accessor: 'tax',
      cell: ({ value }) => <div>{useFormatPrice(value)}</div>
    },
    {
      Header: 'Precio',
      sortable: true,
      accessor: 'price',
      minWidth: '120px',
      maxWidth: '0.4fr',
      align: 'right',
      cell: ({ value }) => {
        const price = getTotalPrice(value)
        console.log("value ", value)
        const unit = value?.weightDetail?.weightUnit
        const isSoldByWeight = value?.weightDetail?.isSoldByWeight
        if (isSoldByWeight) {
          return (
            <div>{useFormatPrice(price)} / {unit}</div>
          )
        }
        return useFormatPrice(price)
      }
    },
    {
      Header: 'Facturable',
      accessor: 'isVisible',
      minWidth: '100px',
      maxWidth: '100px',
      align: 'center',
      cell: ({ value }) => <div>{value === false && icons.operationModes.hide}</div>
    },
    {
      Header: 'Acción',
      accessor: 'action',
      reorderable: false,
      minWidth: '100px',
      maxWidth: '100px',
      align: 'right',
      cell: ({ value }) => {
        console.log(value)
        return (
          <ButtonGroup>
            <Button
              icon={icons?.operationModes?.edit}
              onClick={() => handleUpdateProduct(value)}
            />
            <Button
              icon={icons.operationModes.delete}
              danger
              onClick={() => handleDeleteProduct(user, value)}
            />
          </ButtonGroup>
        )
      }
    }
  ];

  const data = products.map((product) => ({
    id: product.id,
    image: product.image,
    name: { name: product.name, img: product.image },
    stock: { stock: product.stock, trackInventory: product.trackInventory },
    trackInventory: product.trackInventory,
    cost: product?.pricing?.cost,
    price: product,
    tax: getTax(product),
    isVisible: product?.isVisible,
    action: product,
    category: product.category,
  }));

  return (
    <Container>
      <TableWrapper>
        <AdvancedTable
          data={data}
          columns={columns}
          searchTerm={searchTerm}
          headerComponent={<Carrusel addCategoryBtn />}
          tableName={'inventory_items_table'}
          elementName={'productos'}
          onRowClick={(row) => handleUpdateProduct(row.action)}
          groupBy={'category'}
        />
      </TableWrapper>
    </Container>
  )
}
const ProductName = styled.div`
  display: flex;
  align-items: center;
  height: 100%;                     
  gap: 1.2em;
`
const Container = styled.div`
    width: 100%;
    display: flex;
    background-color: var(--color2);
    justify-content: center;
`
const TableWrapper = styled.header`
  position: relative;
  display: grid;
  grid-template-rows: 1fr; 
  height: calc(100vh - 2.75em);
  width: 100%;
  
  overflow: hidden;
  //border-radius: 0.5em;
  margin: 0; /* nuevo estilo */
  @media (max-width: 800px) {
    max-height: 100%;
  }
`;
const ProductCountDisplay = styled.div`
  position: absolute;
  left: 10px;

`

const Table = styled.div`
  position: relative;
  margin: 0 auto;
 
  background-color: white;
  overflow-y: auto;
  
  height: 100%;
  width: 100%;
  display: grid;
  grid-template-rows: min-content min-content 1fr min-content; /* nuevo estilo */
`;
const Categories = styled.div`
position: sticky;
top: 0;
z-index: 2;

`
const TableBody = styled.div`
  display: grid;
  align-items: flex-start;
  align-content: flex-start;
  height: 100%;
  gap: 0.4em;
  width: 100%;
  color: rgb(70, 70, 70);
`;

const Row = styled.div`
  display: grid;
  align-items: center;
  height: 3em;
  width: 100%;
  gap: 1vw;
  grid-template-columns: 
  minmax(80px, 0.1fr) //Image
  minmax(200px, 1fr) //Name
  minmax(70px, 0.4fr) //cost
  minmax(70px, 0.4fr) //stock
  minmax(70px, 0.5fr) //precio
  minmax(70px, 0.5fr) //precio
  minmax(100px, 0.1fr); //acción
  @media (max-width: 800px){
    gap: 0;
  }
 
  ${(props) => {
    switch (props.type) {
      case 'header':
        return `    
          background-color: var(--White);
          border-top: var(--border-primary);
          border-bottom: var(--border-primary);
          
          position: sticky;
          top: 2.60em;
          z-index: 1;
        `
      default:
        break;
    }
  }}
`

const Col = styled.div`
  padding: 0 0.6em;
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  overflow: hidden;
  ${props => {
    switch (props.position) {
      case 'right':
        return `
          justify-content: right;
        `;

      default:
        break;
    }
  }}
  ${(props) => {
    switch (props.size) {
      case 'limit':
        return `
          width: 100%;
          
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;  
          //white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          `

      default:
        break;
    }
  }}
`

const Footer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
 border-top: var(--border-primary);
  height: 3em;
  position: sticky;
  background-color: white;
  bottom: 0;
  z-index: 1;
`