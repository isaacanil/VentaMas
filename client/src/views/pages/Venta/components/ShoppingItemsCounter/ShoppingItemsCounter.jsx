import React from 'react'
import { SelectTotalShoppingItems } from '../../../../../features/cart/cartSlice'
import { useSelector } from 'react-redux'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { AnimatedNumber } from '../../../../templates/system/AnimatedNumber/AnimatedNumber'
import { useFormatNumber } from '../../../../../hooks/useFormatNumber'

export const ShoppingItemsCounter = ({ itemLength }) => {
  const totalShoppingItems = useSelector(SelectTotalShoppingItems)

  return (
    <Container>
     {totalShoppingItems ? (
        <>
          <AnimatedNumber value={`${useFormatNumber(totalShoppingItems)}`} />
          <Separator>/</Separator>
        </>
      ) : null}
      <AnimatedNumber value={useFormatNumber(itemLength)} />
    </Container>
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
  color: white;
  bottom: 0.2em;
  right: 1.2em;
`
const Separator = styled.span`
  font-weight: 600;
  display: flex;
  align-items: center;
  color: white;
`
export default ShoppingItemsCounter
