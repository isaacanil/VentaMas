import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { ProductCard } from './ProductCard'
import { useSelector } from 'react-redux'
import { separator } from '../../../../../hooks/separator'
import { formatData } from '../../../../../features/customProducts/customProductSlice'
import { useFormatPrice } from '../../../../../hooks/useFormatPrice'
export const ProductListSelected = ({SELECTED_PURCHASE}) => {
    const [products, setProducts] = useState([])
    
    useEffect(()=>{
        setProducts(SELECTED_PURCHASE.products)
    }, [SELECTED_PURCHASE])

    const ProductTotalPurchasePrice = SELECTED_PURCHASE.totalPurchase 
    
    return (
        <Container>
            <Head>
                <h4>Lista Productos</h4>
                <span>Total: {useFormatPrice(ProductTotalPurchasePrice)}</span>
            </Head>
            <Body>
                {
                    products.length > 0 ? ( 
                    products.map(({ product }, index) => (
                        <ProductCard key={index} product={product} />
                    ))) : null
                }
            </Body>
        </Container>
    )
}
const Container = styled.div`
    background-color: #ffffff;
    border: var(--border-primary);
    border-radius: 6px;
    height: 12em;
    position: relative;
    display: grid;
    grid-template-rows: min-content 1fr;
    overflow: hidden;

`
const Head = styled.div`
    background-color: #e9e9e9;
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
   
 
    overflow-y: scroll;
`