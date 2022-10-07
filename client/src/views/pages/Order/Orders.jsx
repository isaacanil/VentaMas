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
const Table = styled.div`
  position: relative;

  overflow: hidden;
  display: grid;
  grid-template-rows: min-content 1fr;
  @media (max-width: 811px){
    grid-template-rows: 1fr;
  }
 

`
const TableHead = styled.div`
  background-color: #c9c9c9;
  font-weight: 600;
  padding: 0 16px 0 0;
  @media (max-width: 811px){
    display:none;
  
  }
  
`
const TableBody = styled.div`
  display: grid;
  align-items: flex-start;
  align-content: flex-start;
  overflow-y: scroll;
  @media (max-width: 800px){
    
  }

`
const TitleContainer = styled.div`
  display: grid;
  align-items: center;
  justify-content: center;
  background: #3f3f3f;
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
  span{
    display: none;
    
  }
  gap: 1em;
  ${(props) => {
    switch (props.container) {
      case 'first':
        return `
        display: grid;
        @media (max-width: 800px){
          grid-template-columns: min-content 1fr;
          span{
            display: block;
            transform: rotate(90deg);
            width: 
          }
        }
        
        `

      default:

    }
  }}
    ${(props) => {
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
  ${(props) => {
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
  ${(props) => {
    switch (props.size) {
      case 'limit':
        return `
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
const Group = styled.div`
  display: grid;
  gap: 1em;
  label{
    display: none;
  }
  ${(props) => {
    switch (props.column) {
      case "order-list":
        return `

          grid-template-columns: min-content min-content 100px 3.6em 86px 86px 1fr 100px ;
          align-items: center;
          height: 3em;
          padding: 0 1em;
          @media (max-width: 811px ){
            grid-template-columns: 1fr;
            height: auto;
            padding: 1em;
          
        }
      
        
        `

      default:
        break;
    }
  }}
  ${(props) => {
    switch (props.name) {
      case 'number':
        return `
        
        `
      case 'items':
        return `
        grid-template-columns: min-content;
        @media (max-width: 811px ){
          display: grid;
          grid-template-columns: 0.3fr 1fr;
          label{
            display: block;
          }
          display: none;
          &:nth-child(1){
            display: grid;
          }
         
  
        }
        
        `
      default:
        return ``
    }
  }}
  align-items: center;
`