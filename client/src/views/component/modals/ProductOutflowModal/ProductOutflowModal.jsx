import React, { useRef, useState } from 'react'
import { MdDelete, MdEdit } from 'react-icons/md'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import { toggleAddProductOutflow } from '../../../../features/modals/modalSlice'
import productOutflow, { deleteData, deleteProductFromProductOutflow, SelectProductList, SelectProductOutflow, updateProductFromProductOutflow } from '../../../../features/productOutflow/productOutflow'
import { fbAddProductOutFlow } from '../../../../firebase/ProductOutflow/fbAddProductOutflow'
import { fbDeleteItemFromProductOutflow } from '../../../../firebase/ProductOutflow/fbDeleteItemFromProductOutflow'
import { fbGetProductOutflow } from '../../../../firebase/ProductOutflow/fbGetProductOutflow'
import { fbUpdateProductOutflow } from '../../../../firebase/ProductOutflow/fbUpdateProductOutflow'
import { fbUpdateStock } from '../../../../firebase/ProductOutflow/fbUpdateStock'
import { useFormatNumber } from '../../../../hooks/useFormatNumber'
import useScroll from '../../../../hooks/useScroll'
import { CenteredText } from '../../../templates/system/CentredText'
import { FormattedValue } from '../../../templates/system/FormattedValue/FormattedValue'
import { ProductFilter } from '../../ProductFilter/ProductFilter'
import { Modal } from '../Modal'
import { OutputProductEntry } from './OutputProductEntry/OutputProductEntry'
import { fbRemoveOutputRestoreQuantity } from '../../../../firebase/ProductOutflow/fbRemoveOutputRestoreQuantity'
import { selectUser } from '../../../../features/auth/userSlice'
import { ButtonGroup } from '../../../templates/system/Button/Button'
import * as antd from 'antd'
import { icons } from '../../../../constants/icons/icons'
const { Button, Input } = antd
export const ProductOutflowModal = ({ isOpen, mode = 'create' }) => {
  const outFlowList = useSelector(SelectProductList)
  const outFlowProduct = useSelector(SelectProductOutflow)
  const dispatch = useDispatch()
  const user = useSelector(selectUser)

  const onClose = () => {
    dispatch(toggleAddProductOutflow())
    dispatch(deleteData())
  }

  const handleDeleteProductOutflow = (item, idDoc) => {
    fbRemoveOutputRestoreQuantity(user, item)
    dispatch(deleteProductFromProductOutflow({ id: item.id }))
  }

  const handleUpdateProductOutflow = async () => {
    try {
      console.log(outFlowProduct.data)
      await fbUpdateProductOutflow(user, outFlowProduct.data)
    } catch (err) {

    }
  }

  const handleAddOutflow = async () => {
    try {
      console.log(" click handleAddOutflow")
      await fbAddProductOutFlow(user, outFlowProduct.data);
    } catch (err) {
      console.log(err)
    }
  }

  const handleSubmit = async () => {
    console.log("click  handleSubmit")
    if (mode === 'create') {
      await handleAddOutflow()
    }
    if (mode === 'update') {
      await handleUpdateProductOutflow()
    }
  }

  const handleUpdateProduct = (id, updatedFields) => {
    console.log({ id, data: updatedFields })
    dispatch(updateProductFromProductOutflow({ id, data: updatedFields }));
  };

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
                        <FormattedValue type={'text'} value={item?.product?.name} />
                        <Input
                          type='number'
                          value={item?.quantityRemoved}
                          onChange={(e) => handleUpdateProduct(item.id, { quantityRemoved: e.target.value })}
                        />
                        <Input
                          value={item?.motive || "none"}
                          onChange={(e) => handleUpdateProduct(item.id, { motive: e.target.value })}
                        />
                        <Input
                          value={item?.observations || "none"}
                          onChange={(e) => handleUpdateProduct(item.id, { observations: e.target.value })}
                        />
                        <div
                          style={
                            {
                              display: "flex",
                              justifyContent: "right"
                            }
                          }
                        >
                          <Button
                            danger
                            icon={icons.operationModes.delete}
                            onClick={() => handleDeleteProductOutflow(item, outFlowProduct.data.id)}
                          />
                        </div>
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
  grid-template-columns: 3em 1fr 1fr 1fr 1fr 5em;
  align-items: center;
  background-color: var(--White);
  padding: 8px 24px 8px 8px;
  gap: 1em;
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

const Row = styled.div`
  display: grid;
  grid-template-columns: 3em  1fr 1fr 1fr 1fr 5em;
  align-items: center;
  gap: 1em;
  border-radius: 4px;
  padding: 8px 8px 8px 8px;
  font-size: 14px;
  transition: all 0.2s linear;
  :hover{
    background-color: #f5f5f5;
  }
`;