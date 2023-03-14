import React from 'react'
import styled from 'styled-components'
import { ProductCard } from './ProductCard'
import { SelectProducts, SelectTotalPurchase } from '../../../features/addOrder/addOrderModalSlice'
import { useSelector } from 'react-redux'
import { separator } from '../../../hooks/separator'
import { useFormatPrice } from '../../../hooks/useFormatPrice'
export const ProductListSelected = ({ productsSelected, productsTotalPrice, handleDeleteProduct }) => {
    return (
        <Container>
            <Head>
                <h4>Lista de productos</h4>
                <span>Total: {useFormatPrice(productsTotalPrice)}</span>
            </Head>
            <Body>
                {
                    Array(productsSelected).length > 0 && productsSelected ?
                        (productsSelected.map(({ product }, index) => (
                            <ProductCard
                                key={index}
                                product={product}
                                handleDeleteProduct={handleDeleteProduct}
                            />
                        ))) : null
                }
            </Body>
        </Container>
    )
}
const Container = styled.div`
    border: var(--border-primary);
    background-color: var(--White1);
    border-radius: 6px;
    height: 12em;
    position: relative;
    display: grid;
    grid-template-rows: min-content 1fr;
    overflow: hidden;
    padding-bottom: 6px;

`
const Head = styled.div`
    background-color: var(--White1);
    color: #303030;
    height: 2em;
    display: grid;
    grid-template-columns: 1fr 10em;
    align-items: center;
    align-content: center;
    padding: 0 1em;
    h3{
        //text-align: center;
        margin: 0;
    }
    span{
        color: #131313;
        text-align: right;
    }
`
const Body = styled.div`
   padding: 0.4em;
    
    overflow-y: scroll;
`