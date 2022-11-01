import React from 'react'
import styled from 'styled-components'
import { separator } from '../../../../../hooks/separator'

export const ProductCard = ({product}) => {
  return (
    <Container>
        <Col>
            <h5>
                {product.productName}
            </h5>
        </Col>
        <Col>
            <h5>
                {product.stock}
            </h5>
        </Col>
        <Col>
            <h5>
                RD${separator(product.cost.unit)}
            </h5>
        </Col>
        <Col>
            <h5>
                RD${separator(product.cost.unit * product.stock)}
            </h5>
        </Col>
        <Col>
            
        </Col>
    </Container>
  )
}
const Container = styled.div`
    display: grid;
    grid-template-columns: 250px min-content 1fr 1fr 1fr;
    height: 2.75em;
    align-items: center;
    align-content: center;
    padding: 0 0.8em;
    background-color: #fff;
    border-bottom: 1px solid #00000034;
    color: #353535;
    gap: 1em;
    &:last-child{
        border-bottom: none;
    }
    
`
const Col = styled.div`
    &:first-child{
        h5{
            max-width: 180px;
            width: 100%;
            font-size: 12px;
            line-height: 1pc;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;  
            //white-space: nowrap;
            text-transform: uppercase;
            text-overflow: ellipsis;
            overflow: hidden;
           
            
        }
    }
    &:nth-child(3n){
        h5{
            display: block;
            text-align: right;
        }
    }
    &:nth-child(4n){
        h5{
            display: block;
            text-align: right;
        }
    }
`