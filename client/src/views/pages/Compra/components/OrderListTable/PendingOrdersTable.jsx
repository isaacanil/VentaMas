import React, { useState } from 'react'
import styled from 'styled-components'
import { Data } from '../../Data'
import { ListItem } from '../../ListItem/ListItem'
import { getOrders } from '../../../../../firebase/firebaseconfig'
import { useEffect } from 'react'
import { OrderItem } from '../../ListItem/OrderItem'

export const PendingOrdersTable = () => {
  const [orders, setOrders] = useState([])
  useEffect(() => {
    getOrders(setOrders)
  }, [])
  console.log(orders)
  return (
    <Container>
      <Body>
        <TitleContainer>
          <h3>Lista de Compras</h3>
        </TitleContainer>
        <Table>

          <Row fill='fill'>

            <Col>#</Col>
            <Col>Proveedor</Col>
            <Col>Nota</Col>
            <Col>Fecha</Col>
            <Col>Fecha de Pago</Col>
            <Col position='right'>Total</Col>
            <Col>Acción</Col>

          </Row>

          <TableBody>
            {
              Array(orders).length > 0 ? (
                orders.map((e, index) => (
                  <OrderItem Row={Row} Col={Col} key={index} e={e} index={index} />
                ))
              ) : null

            }
          </TableBody>
        </Table>
      </Body>
    </Container>

  )
}
const Container = styled.div`
    width: 100%;
    padding: 0 1em;
    display: flex;
    justify-content: center;
`
const Body = styled.header`
    justify-self: center;
    border: 1px solid rgba(0, 0, 0, 0.100);
    border-radius: 10px;
    position: relative;
    height: calc(100vh - 2.75em - 2.5em - 1.5em);
    overflow: hidden;
    //max-height: 400px;
    width: 100%;
    max-width: 1000px;
    
    display: grid;
    grid-template-rows: min-content 1fr; 
    background-color: #ffffff;
    @media (max-width: 800px){
      max-height: 100%;
      
  }
`
const Table = styled.div`
  position: relative;
  width: 100%;
  overflow: hidden;
  display: grid;
  grid-template-rows: min-content 1fr;
  
 

`

const TableBody = styled.div`
  display: grid;
  align-items: flex-start;
  align-content: flex-start;
  overflow-y: auto;
  overflow-x: hidden;
  width: 100%;
  color: rgb(70, 70, 70);
  

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
  height: 3em;
  gap: 1em;
  grid-template-columns: 
  minmax(44px, 0.1fr) //numero
  minmax(120px, 0.5fr) //proveedor
  minmax(64px, 0.1fr) //nota
  minmax(104px, 0.4fr) //f. pedido
  minmax(104px, 0.4fr) //f. entrega
  minmax(110px, 0.4fr) //total
  minmax(126px, 0.3fr); //acción
  @media (max-width: 800px){
    gap: 0;
  }
  ${(props) => {
    switch (props.container) {
      case 'first':
        return `
        @media (max-width: 800px){
        display: grid;
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
  ${(props) => {
    switch (props.fill) {
      case 'fill':
        return `
          padding-right: 16px;
          height: 2em;
          background-color: var(--White1);
        `

      default:
        break;
    }
  }}
`
// const Row = styled.div`
//   display: grid;
//   align-items: center;

//   gap: 1em;
//   ${(props) => {
//     switch (props.container) {
//       case 'first':
//         return `
//         @media (max-width: 800px){
//         display: grid;
//         grid-template-columns: min-content 1fr;
//         span{
//           display: block;
//           transform: rotate(90deg);
//           width: 
//         }
//       }

//       `
//       default:

//     }
//   }}
//     ${(props) => {
//     switch (props.border) {
//       case 'border-bottom':
//         return `
//               border-bottom: 1px solid rgba(0, 0, 0, 0.200);
//               &:last-child{
//                 border-bottom: none;
//               }
//               `
//       default:
//     }
//   }}
//   ${(props) => {
//     switch (props.color) {
//       case 'header':
//         return `
//         background-color: #9c0e0e;
//         `
//       case 'item':
//         return `
//         background-color: #ebebeb;
//         `
//       default:
//     }
//   }}
// `
const Col = styled.div`
  padding: 0 0.6em;
  ${props => {
    switch (props.position) {
      case 'right':
        return`
          text-align: right;
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
        grid-template-columns: min-content min-content 100px 70px 0.7fr 0.7fr 1fr 110px;
        align-items: center;
        height: 3em;
        padding: 0 1em;}
        gap:1.6em;
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