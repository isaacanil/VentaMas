import React, { Fragment } from 'react'
import styled from 'styled-components'
import { Select } from '../../templates/system/Select/Select'
import { provider } from './Selects/Provider'
import { useDispatch } from 'react-redux'
import { openModalAddOrder } from '../../../features/modals/modalSlice'
import { separator } from '../../../hooks/separator'
import {
  MenuApp,
  ButtonGroup,
  Button,
  EditButton,
  DeleteButton,
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
      <MenuApp></MenuApp>
      <Container>
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
                <Row column='orderList' >
                  <Col>#</Col>
                  <Col>Est</Col>
                  <Col>Proveedor</Col>
                  <Col>Nota</Col>
                  <Col>F. Pedido</Col>
                  <Col>F. Entrega</Col>
                  <Col>Total</Col>
                  <Col>Acción</Col>

                </Row>
              </TableHead>
              <TableBody>
                {
                  Data.length > 0 ? (
                    Data.map((e, index) => (
                      <Row column='orderList' key={index} color='item' border='border-bottom'>
                        
                        <Col>{index + 1}</Col>
                        <Col>
                          <StatusIndicatorDot color={e.estado}></StatusIndicatorDot>
                        </Col>
                        <Col size='limit'>{e.Proveedor}</Col>
                        <Col>
                        <Button height='small'>Ver</Button>
                        </Col>
                        <Col>{e.orderDate}</Col>
                        <Col>{e.deliveryDate}</Col>
                        <Col>${separator(e.total)}</Col>
                        <ButtonGroup>
                          <EditButton></EditButton>
                          <DeleteButton></DeleteButton>

                        </ButtonGroup>
                      </Row>
                    ))
                  ) : null
                }
                
              </TableBody>
            </Table>


          </Body>
        </Wrapper>

      </Container>
    </Fragment>
  )
}
const Container = styled.div`
    display: grid;
    
    width: 100%;
    height: 100vh - 2.75em;
    justify-content: center;
    padding: 1.5em 0;
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
`
const Body = styled.header`
  border: 1px solid black;
  border-radius: 10px;
  position: relative;
  height: 400px;
  overflow: hidden;
  max-height: 400px;
  display: grid;
  grid-template-rows: min-content 1fr;


    
`
const FilterBar = styled.div`
  display: flex;
  gap: 1em;
`
const Table = styled.div`
  position: relative;

  overflow: hidden;
  display: grid;
  grid-template-rows: min-content 1fr;

 

`
const TableHead = styled.div`
  background-color: #c9c9c9;
  font-weight: 600;
  padding: 0 17px 0 0;
  
`
const TableBody = styled.div`
  display: grid;
  align-items: flex-start;
  align-content: flex-start;
  overflow-y: scroll;

`


const TitleContainer = styled.div`
  display: grid;
  align-items: center;
  justify-content: center;
  background: black;
  height: 2em;
  h3{
    margin: 0;
    color: white;
    font-weight: 500;

  }
  text-align: center;
`
const Row = styled.div`
  display: grid;
 
  align-items: center;
  
  gap: 1em;
  ${(props)=>{
    switch (props.column) {
      case 'orderList':
        return `
        grid-template-columns: min-content min-content 1fr 0.6fr 1fr 1fr 1.5fr 1fr;
        align-items: center;
        height: 3em;
        padding: 0 1em;
      
        `

      default:
        
    }
  }}
    ${(props)=>{
    switch (props.border) {
      case 'border-bottom':
        return `
      
        border-bottom: 1px solid rgba(0, 0, 0, 0.200);
        &:last-child{
          border-bottom: none;
        }
      
      
        `

      default:
        
    }
  }}
  ${(props)=>{
    switch (props.color) {
      case 'header':
        return `
        background-color: #9c0e0e;
      
        `
      case 'item':
        return `
        background-color: #ebebeb;
      
        `
     
    
      default:
        
    }
  }}
`
const Col = styled.div`
  ${(props)=>{
      switch (props.size) {
        case 'limit':
          return`
          width: 100px;
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
