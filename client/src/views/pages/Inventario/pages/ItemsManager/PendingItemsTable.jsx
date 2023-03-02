import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { ProductItem } from './ProductCard/ProductItem'
import { ProductCardRow } from './ProductCard/ProductCardRow'


export const PendingItemsTable = ({ productsArray }) => {
  // const [ products, setProducts ] = useState([])
  // useEffect(() => setProducts(productsArray), [productsArray])
  return (
    <Container>
      <Body>
        <Table>
          <Row fill='fill'>
            <Col>Image</Col>
            <Col>Nombre</Col>
            <Col position='right'>Stock</Col>
            <Col position='right'>Costo</Col>
            <Col position='right'>Impuesto</Col>
            <Col position='right'>Total</Col>
            <Col>Acción</Col>
          </Row>
          <TableBody>
            {productsArray.length > 0 ? (
            productsArray.map(({product}, index)=>(
              // <ProductItem  product={product} Row={Row} Col={Col} key={index}/>
              <ProductCardRow product={product} Col={Col} Row={Row}/>
            ))
           ) : null}
          </TableBody>
        </Table>
      </Body>
    </Container>
  )
}
const Container = styled.div`
    width: 100%;
    //padding: 0 1em;
    display: flex;
    justify-content: center;
`
const Body = styled.header`
  justify-self: center;
  position: relative;
  max-height: calc(100vh - 5.5em);
  width: 100%;
  display: grid;
  grid-template-rows: min-content 1fr; 
  background-color: #ffffff;
  margin: 0; /* nuevo estilo */
  @media (max-width: 800px) {
    max-height: 100%;
  }
`;

const Table = styled.div`
  position: relative;
  width: 100%;
  display: grid;
  grid-template-rows: auto 1fr; /* nuevo estilo */
`;

const TableBody = styled.div`
  display: grid;
  align-items: flex-start;
  align-content: flex-start;
  height: calc(100vh - 5.5em - 2.75em);
  width: 100%;
  overflow-y: scroll; /* nuevo estilo */
  color: rgb(70, 70, 70);
`;
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
  gap: 3vw;
  grid-template-columns: 
  minmax(80px, 0.1fr) //Image
  minmax(200px, 1fr) //Name
  minmax(70px, 0.4fr) //cost
  minmax(70px, 0.4fr) //stock
  minmax(70px, 0.5fr) //precio
  minmax(70px, 0.5fr) //precio
  minmax(80px, 0.1fr); //acción
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