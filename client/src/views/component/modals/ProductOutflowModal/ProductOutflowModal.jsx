import React, { useRef, useState } from 'react'
import { MdDelete, MdEdit } from 'react-icons/md'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import { toggleAddProductOutflow } from '../../../../features/modals/modalSlice'
import productOutflow, { deleteData, deleteProductFromProductOutflow, SelectProductList, SelectProductOutflow } from '../../../../features/productOutflow/productOutflow'
import { fbAddProductOutFlow } from '../../../../firebase/ProductOutflow/fbAddProductOutflow'
import { fbDeleteItemFromProductOutflow } from '../../../../firebase/ProductOutflow/fbDeleteItemFromProductOutflow'
import { fbGetProductOutflow } from '../../../../firebase/ProductOutflow/fbGetProductOutflow'
import { fbUpdateProductOutflow } from '../../../../firebase/ProductOutflow/fbUpdateProductOutflow'
import { fbUpdateStock } from '../../../../firebase/ProductOutflow/fbUpdateStock'
import { useFormatNumber } from '../../../../hooks/useFormatNumber'
import useScroll from '../../../../hooks/useScroll'
import { CenteredText } from '../../../templates/system/CentredText'
import { Button, ButtonGroup } from '../../../templates/system/Button/Button'
import { FormattedValue } from '../../../templates/system/FormattedValue/FormattedValue'
import { ProductFilter } from '../../ProductFilter/ProductFilter'
import { Modal } from '../Modal'
import { OutputProductEntry } from './OutputProductEntry/OutputProductEntry'
import { fbRemoveOutputRestoreQuantity } from '../../../../firebase/ProductOutflow/fbRemoveOutputRestoreQuantity'

export const ProductOutflowModal = ({ isOpen, mode = 'create' }) => {
  const outFlowList = useSelector(SelectProductList)
  const outFlowProduct = useSelector(SelectProductOutflow)
  const dispatch = useDispatch()
  const [open, setOpen] = useState(false)

  const onClose = () => {
    dispatch(toggleAddProductOutflow())
    dispatch(deleteData())
  }

  const handleDeleteProductOutflow = (item, idDoc) => {
    console.log(item.id)
    fbRemoveOutputRestoreQuantity(item)
    dispatch(deleteProductFromProductOutflow({ id: item.id }))
  }
  
  const handleUpdateProductOutflow = () => {
    fbUpdateProductOutflow(outFlowProduct.data)
    fbUpdateStock(outFlowProduct.data.productList)
  }

  const handleAddOutflow = () => {
    fbAddProductOutFlow(outFlowProduct.data, dispatch)
    fbUpdateStock(outFlowProduct.data.productList)
  }

  const handleSubmit = () => {
    if (mode === 'create') {
      handleAddOutflow()
    }
    if (mode === 'update') {
      handleUpdateProductOutflow()
    }
  }

  const tableRef = useRef(null);
  const isScrolled = useScroll(tableRef)
  return (
    <Modal
      width={'large'}
      isOpen={isOpen}
      btnSubmitName={'Guardar'}
      nameRef={mode === 'create' ? 'Agregar Salida de Producto' : 'Editar Salida de Producto'}
      handleSubmit={handleSubmit}
      close={onClose}
      children={
        <Container>
          <Header>
            <OutputProductEntry />
          </Header>
          <Body>
            <Table ref={tableRef} >
              <TableHeader isScrolled={isScrolled}>
                <FormattedValue type={'subtitle-table'} value="#" />
                <FormattedValue type={'subtitle-table'} value="Producto" />
                <FormattedValue type={'subtitle-table'} value="Cantidad" />
                <FormattedValue type={'subtitle-table'} value="Motivo" />
                <FormattedValue type={'subtitle-table'} value="Observaciones" />
                <FormattedValue type={'subtitle-table'} value="Acción" />
              </TableHeader>
              <TableItems>
                {(outFlowList?.length > 0 &&
                  outFlowList
                    .slice()
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .reverse()
                    .map((item, index) =>
                    (
                      <Row key={index}>
                        <FormattedValue type={'number'} value={outFlowList?.length - index} />
                        <FormattedValue type={'text'} value={item?.product?.productName} />
                        <FormattedValue type={'number'} value={mode === 'create'? item?.currentRemovedQuantity : item?.totalRemovedQuantity} />
                        <FormattedValue type={'text'} value={item?.motive} />
                        <FormattedValue type={'text'} value={item?.observations} />
                        <ButtonGroup>
                          <Button
                            width={'icon32'}
                            title={<MdDelete />}
                            color={'gray-dark'}
                            borderRadius={'normal'}
                            onClick={() => handleDeleteProductOutflow(item, outFlowProduct.data.id)}
                          />
                        </ButtonGroup>
                      </Row>
                    )) || (
                    <CenteredText
                      text={
                        mode === 'create' ?
                          'Seleccione un producto para agregar una salida de producto, y rellene los campos de cantidad, motivo y observaciones'
                          : 'No hay registros de salida de productos'
                      }
                      
                      

                    />
                  )
                )}
              </TableItems>
            </Table>
          </Body>
        </Container>

      }
    />
  )
}
const Container = styled.div`
display: grid;
grid-template-rows: min-content 1fr;
height: 100%;
overflow: hidden;
`
const Header = styled.div`

width: 100%;
`
const Body = styled.div`
height: 100%;
width: 100%;
overflow-y: hidden;
`
const Table = styled.div`
max-width: 1100px;
width: 100%;
overflow-y: hidden;
margin: 0 auto;
height: 100%;
background-color: aliceblue;

background-color: var(--White);

`
const TableItems = styled.div`
display: grid;
height: calc(100% - 2.6em);
overflow-y: scroll;
align-content: flex-start;
align-items: flex-start;
  position: relative;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 6em 1fr 1fr 1fr 1fr 5em;
  align-items: center;
  background-color: var(--White);
  padding: 8px;
  font-size: 14px;
  font-weight: bold;
  position: sticky;
    top: 0;
    border-bottom: 1px solid transparent;
    z-index: 1;
    transition: all 0.2s linear;
    ${({ isScrolled }) => isScrolled && `
    background-color: var(--White);
    border-bottom: 1px solid rgba(0, 0, 0, 0.100);
  `}
`;

const Label = styled.div``;

const Row = styled.div`
  display: grid;
  grid-template-columns: 6em  1fr 1fr 1fr 1fr 5em;
  align-items: center;
  border-radius: 4px;
  padding: 8px;
  font-size: 14px;
  transition: all 0.2s linear;
  :hover{
    background-color: #f5f5f5;
  }
`;

const NumberList = styled.span`
  font-weight: bold;
 font-family: 'Chivo Mono', monospace;
`;
const Number = styled.span`
  font-family: 'Chivo Mono', monospace;
`;

