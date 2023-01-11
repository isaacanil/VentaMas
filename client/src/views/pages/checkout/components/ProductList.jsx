import React from 'react'
import styled from 'styled-components'
import { separator } from '../../../../hooks/separator'
import { Col, Row } from './Table'
export const ProductList = ({ data }) => {
    const {products} = data
    return (
        <Products>
            {
                products.length > 0 ? (
                    products.map((product, index) => (
                        <Product key={index}>
                            <Row cols='3'>
                                <Col>{product.amountToBuy.total} x {separator(product.price.unit)}</Col>
                                <Col textAlign='right'>{separator(product.tax.total)}</Col>
                                <Col textAlign='right'>{separator(product.price.total)}</Col>
                            </Row>
                            <Row>
                                <ProductName>{product.productName}</ProductName>
                            </Row>
                        </Product>
                    ))
                ) : null
            }
        </Products>
    )
}

const Products = styled.div`
    display: block;
    border: none;
    padding: 0;
    list-style: none;
`
const Product = styled.div`
    width: 100%;
    &:nth-child(1n) {
        border-bottom: 1px dashed black;
    }
    
    &:last-child {
        border-bottom: none;
    }
`
const ProductName = styled.div`
    text-transform: lowercase;
        width: 100%;
        grid-column: 1 / 4;
        line-height: 1.4pc;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        //white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
`