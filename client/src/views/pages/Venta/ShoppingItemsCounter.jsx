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
    background-color: rgb(75,190,142);
    font-weight: 600;
    padding: 0 1em;
    display: flex;
    align-items: center;
    height: 1.5em;
    border-top: 2px solid #00000050;
`