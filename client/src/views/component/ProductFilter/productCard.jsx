import React from 'react'
import { useDispatch } from 'react-redux'
import { useMatch } from 'react-router-dom'
import styled from 'styled-components'
import {SelectProduct} from '../../../features/addOrder/addOrderModalSlice'

export const ProductCard = ({data, setShowProductList, fn}) => {

 
  return (
    <Container onClick={() => fn(data)}>
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