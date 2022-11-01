import React from 'react'
import styled from 'styled-components'
import { Data } from '../../Data'
import { ListItem } from '../../ListItem/ListItem'

export const OrderListTable = () => {
    return (
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
                            <Col style={{textAlign: 'center'}}>Nota</Col>
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
    )
}

const Body = styled.header`
    justify-self: center;
    border: 1px solid rgba(0, 0, 0, 0.100);
    border-radius: 10px;
    position: relative;
    height: 400px;
    overflow: hidden;
    max-height: 400px;
    width: 100%;
    max-width: 800px;
    display: grid;
    grid-template-rows: min-content 1fr; 
    background-color: #ffffff;

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
  background-color: #e7e7e7;
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