import React from 'react'
import { SelectTotalShoppingItems } from '../../../../../features/cart/cartSlice'
import { useSelector } from 'react-redux'
import styled from 'styled-components'
export const ShoppingItemsCounter = ({itemLength}) => {
    const totalShoppingItems = useSelector(SelectTotalShoppingItems)
  return (
    <Container> {totalShoppingItems} / {itemLength}</Container>
  )
}

const Container = styled.div`
    background-color: var(--Gray8);
    font-weight: 600;
    padding: 0 1em;
    display: flex;
    align-items: center;
    height: 2.2em;
    position: absolute;
    z-index: 100;
    border-radius: 100px;
    /* border-top-left-radius: 6px;
    border-top-right-radius: 6px; */
    color: white;
    bottom: 0.2em;
    right: 1.2em;

   
 
`