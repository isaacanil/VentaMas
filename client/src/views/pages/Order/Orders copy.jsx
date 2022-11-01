import React, { Fragment } from 'react'
import styled from 'styled-components'
import { Select } from '../../templates/system/Select/Select'
import { provider } from './Selects/Provider'
import { useDispatch } from 'react-redux'
import { openModalAddOrder } from '../../../features/modals/modalSlice'
import { separator } from '../../../hooks/separator'
import { ListItem } from './ListItem/ListItem'


import {
  MenuApp,
  ButtonGroup,
  Button,
  PurchaseButton,
  EditButton,
  DeleteButton,
  ArrowRightButton,
  StatusIndicatorDot
} from '../../'
import { Data } from './Data'
export const Orders = () => {
  const dispatch = useDispatch()
  const openModal = () => {
    dispatch(
      openModalAddOrder()
    )
  }
  return (
    <Fragment>
      <Container>
        <MenuApp></MenuApp>
        <OrderContainer>
          <Wrapper>
            <Head>
              <div>

                <Button onClick={openModal}>Nuevo Pedido</Button>
              </div>
              <FilterBar>
                <Select data={provider} title='PROVEEDOR'></Select>
                <Select data={provider} title='Estado'></Select>
                <Select data={provider} title='Condición'></Select>
              </FilterBar>

            </Head>
            <Body>
              <TitleContainer>
                <h3>Lista de Pedidos Pendientes</h3>
              </TitleContainer>
              <Table>
                <TableHead>
                  <Row  >
                    <Group column='order-list'>

                      <Col>#</Col>
                      <Col>Est</Col>
                      <Col>Proveedor</Col>
                      <Col>Nota</Col>
                      <Col>F. Pedido</Col>
                      <Col>F. Entrega</Col>
                      <Col>Total</Col>
                      <Col>Acción</Col>

                    </Group>

                  </Row>
                </TableHead>
                <TableBody>
                  {
                    Data.length > 0 ? (
                      Data.map((e, index) => (
                        <ListItem key={index} e={e} index={index}></ListItem>
                      ))
                    ) : null
                  }

                </TableBody>
              </Table>


            </Body>
          </Wrapper>

        </OrderContainer>
      </Container>
    </Fragment>
  )
}
const Container = styled.div`
display: grid; 
grid-template-rows: 2.75fr 1fr;
height: 100vh;

`
const OrderContainer = styled.div`
display: flex;
    justify-content: center;
    width: 100%;
    height: 100%;
  
    padding: 0;
    margin: 0;
    background-color: red;
    
`
const Head = styled.header`
    display: grid;
    gap: 10px;
`
const Wrapper = styled.div`
 // background-color: #1010a0;
  display: grid;
  //grid-template-rows: 1fr;
  gap: 1em;
  max-width: 800px;
  width: 800px;
  @media (max-width: 800px){
    width: 100%
  }
`
const Body = styled.header`
  border: 1px solid #00000067;
  border-radius: 10px;
  position: relative;
  height: 400px;
  overflow: hidden;
  max-height: 400px;
  display: grid;
  grid-template-rows: min-content 1fr; 
  background-color: rgb(235,235,235);

`
const FilterBar = styled.div`
  display: flex;
  gap: 1em;
`
