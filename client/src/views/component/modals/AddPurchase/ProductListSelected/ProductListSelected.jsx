import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { ProductCard } from './ProductCard'
import { useSelector } from 'react-redux'
import { separator } from '../../../../../hooks/separator'
export const ProductListSelected = ({productsData}) => {
    const [products, setProducts] = useState([])
    useEffect(()=>{
        setProducts(productsData)
    }, [productsData])
    console.log(products)
    // const ProductTotalPurchasePrice = useSelector(SelectTotalPurchase)
    return (
        <Container>
            <Head>
                <h4>Lista Productos</h4>
                <span>Total: RD${/*separator()/-*/}</span>
            </Head>
            <Body>
                {
                    products.length > 0 && products ?
                   ( products.map(({ product }, index) => (
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