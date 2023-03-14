import React from 'react'
import { IoMdTrash } from 'react-icons/io'
import { useDispatch } from 'react-redux'
import styled from 'styled-components'
import { DeleteProduct } from '../../../features/addOrder/addOrderModalSlice'
import { separator } from '../../../hooks/separator'
import { Button } from '../../templates/system/Button/Button'

export const ProductCard = ({ product, handleDeleteProduct }) => {
    return (
        <Container>
            <Col>
                <span>
                    {product.productName}
                </span>
            </Col>
            <Col>
                <span>
                    {product.stock.newStock}
                </span>
            </Col>
            <Col>
                <span>
                    RD${separator(product.initialCost)}
                </span>
            </Col>
            <Col>
                <span>
                    RD${separator(product.initialCost * product.stock.newStock)}
                </span>
            </Col>
            <Button
                title={<IoMdTrash />}
                width='icon24'
                border='light'
                borderRadius='normal'
                onClick={() => handleDeleteProduct(product)}
            />

        </Container>
    )
}
const Container = styled.div`
    display: grid;
    grid-template-columns: 250px 30px 1fr 1fr min-content;
    height: 2.75em;
    align-items: center;
    align-content: center;
    padding: 0 0.8em;
    background-color: #fff;
    color: #353535;
    border: var(--border-primary);
    border-radius: var(--border-radius-light);
    gap: 1em;
    &:last-child{
        border-bottom: none;
    }
    
`
const Col = styled.div`
color: var(--Gray6);
    &:first-child{
        span{
            max-width: 180px;
            width: 100%;
            line-height: 1pc;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;  
            //white-space: nowrap;
            text-transform: capitalize;
            text-overflow: ellipsis;
            overflow: hidden;            
        }
    }
    &:nth-child(3n){
        span{
            display: block;
            text-align: right;
        }
    }
    &:nth-child(4n){
        span{
            display: block;
            text-align: right;
        }
    }
    &:nth-child(4n){
      
            display: block;
            text-align: right;
        
    }
`