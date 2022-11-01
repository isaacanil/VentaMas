import React from 'react'
import { SelectTotalShoppingItems } from '../../../features/cart/cartSlice'
import { useSelector } from 'react-redux'
import styled from 'styled-components'
export const ShoppingItemsCounter = () => {
    const totalShoppingItems = useSelector(SelectTotalShoppingItems)
  return (
    <Container>Artículos: {totalShoppingItems}</Container>
  )
}

const Container = styled.div`
    background-color: #313131;
    font-weight: 600;
    padding: 0 1em;
    display: flex;
    align-items: center;
    height: 2.4em;
    position: absolute;
    border-radius: 100px;
    color: white;
    bottom: 0.2em;
    left: 0.2em;
 
`