import React from 'react'
import { useDispatch } from 'react-redux'
import styled from 'styled-components'
import {SelectProduct} from '../../../../../features/addOrder/addOrderModalSlice'

export const ProductCard = ({data, showProductList}) => {
   const dispatch = useDispatch()
   const handleSelectProduct = (data) => {
       
        dispatch(
            SelectProduct(data)
        )
   }
  return (
    <Container onClick={() => handleSelectProduct(data)}>
        <span>
            {data.product.productName}
        </span>       
    </Container>
  )
}
const Container = styled.div`
    height: 2.25em;
    display: flex;
    align-items: center;
    padding: 0 0.6em;
    background-color: var(--White);
    border-radius: var(--border-radius-light);
    
`