import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { ProductItem } from './ProductCard/ProductItem'
import { ProductCardRow } from './ProductCard/ProductCardRow'
import { Pagination } from '@mui/material'
import { Carrusel } from '../../../../../../component/Carrusel/Carrusel'
import { FormattedValue } from '../../../../../../templates/system/FormattedValue/FormattedValue'
import { CenteredText } from '../../../../../../templates/system/CentredText'
import { icons } from '../../../../../../../constants/icons/icons'
import { openModalUpdateProd } from '../../../../../../../features/modals/modalSlice'
import { ChangeProductData, selectUpdateProductData } from '../../../../../../../features/updateProduct/updateProductSlice'
import { OPERATION_MODES } from '../../../../../../../constants/modes'


export const PendingItemsTable = ({ productsArray, setCurrentProducts, filteredProducts, totalProductsCount }) => {

  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 16;
  const dispatch = useDispatch();
  useEffect(() => {
    const start = (currentPage - 1) * productsPerPage;
    const end = start + productsPerPage;
    setCurrentProducts(filteredProducts.slice(start, end));
  }, [filteredProducts, currentPage]);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const handlerProductModal = () => {
    dispatch(openModalUpdateProd());
    dispatch(ChangeProductData({ status: OPERATION_MODES.CREATE.label }));
  }

  return (
    <Container>
      <TableWrapper>
        <Table>
          <Categories>
            <Carrusel />
          </Categories>
          <Row type='header'>
            <Col>
              <FormattedValue type='subtitle-table' value={'Imagen'} />
            </Col>
            <Col>
              <FormattedValue type='subtitle-table' value={'Nombre'} />
            </Col>
            <Col position='right'>
              <FormattedValue type='subtitle-table' value={'Stock'} />
            </Col>
            <Col position='right'>
              <FormattedValue type='subtitle-table' value={'Costo'} />
            </Col>
            <Col position='right'>
              <FormattedValue type='subtitle-table' value={'Impuesto'} />
            </Col>
            <Col position='right'>
              <FormattedValue type='subtitle-table' value={'Total'} />
            </Col>
            <Col position='right'>
              <FormattedValue type='subtitle-table' value={'Acción'} />
            </Col>

          </Row>
          <TableBody>
            {productsArray.length > 0 ? (
              productsArray.map(({ product }, index) => (
                // <ProductItem  product={product} Row={Row} Col={Col} key={index}/>
                <ProductCardRow product={product} Col={Col} Row={Row} key={index} />
              ))
            ) : null}
            {
              productsArray.length === 0 /*|| Object.keys(productsByCategory).length === 0) */ /*&& !productsLoading*/ ? (
                <CenteredText
                  text='No se encontraron productos, ¿Desea agregar uno?'
                  buttonText={'Producto'}
                  handleAction={handlerProductModal}
                  startIcon={icons.operationModes.add}
                />
              ) : null
            }
          </TableBody>

          <Footer>
            <ProductCountDisplay>
              {`${productsArray.length} / ${totalProductsCount} Resultados`}
            </ProductCountDisplay>
            <Pagination
              count={Math.ceil((filteredProducts.length / productsPerPage))}
              page={currentPage}
              onChange={handlePageChange}
              siblingCount={1}
              boundaryCount={1}
              color="primary"
            />
          </Footer>
        </Table>
      </TableWrapper>
    </Container>
  )
}
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
  height: calc(100vh - 3em);
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